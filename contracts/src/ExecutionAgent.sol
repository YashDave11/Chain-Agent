// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ICoordinatorAgent {
    function recordExecution(address user, uint256 amount, uint256 price) external;
    function checkExecutionAllowed(address user) external view returns (bool, uint256, string memory);
}

interface IMockPriceOracle {
    function getPrice(address token) external view returns (uint256);
    function checkPriceDip(address token, uint256 targetDipBps) external view returns (bool, uint256, uint256);
}

interface IUniswapRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

/**
 * @title ExecutionAgent
 * @notice Executes swaps on behalf of users within delegated limits
 * @dev Receives sub-delegation from CoordinatorAgent and performs actual swaps
 */
contract ExecutionAgent {
    using SafeERC20 for IERC20;
    
    // ============ State Variables ============
    
    address public owner;
    address public coordinator;
    address public priceOracle;
    address public uniswapRouter;
    
    // Token addresses
    address public usdcToken;
    address public wethToken;
    
    // Execution stats
    uint256 public totalSwapsExecuted;
    uint256 public totalUsdcSpent;
    uint256 public totalEthBought;
    
    // User => Total ETH accumulated
    mapping(address => uint256) public userEthAccumulated;
    
    // ============ Events ============
    
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 price
    );
    
    event QuotaExceeded(
        address indexed user,
        uint256 requested,
        uint256 available
    );
    
    event EmergencyWithdraw(address indexed token, uint256 amount);
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "ExecutionAgent: not owner");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(
        address _coordinator,
        address _priceOracle,
        address _uniswapRouter,
        address _usdcToken,
        address _wethToken
    ) {
        owner = msg.sender;
        coordinator = _coordinator;
        priceOracle = _priceOracle;
        uniswapRouter = _uniswapRouter;
        usdcToken = _usdcToken;
        wethToken = _wethToken;
    }
    
    // ============ Execution Functions ============
    
    /**
     * @notice Execute a swap for a user if conditions are met
     * @param user The user to execute for
     * @param amount The USDC amount to swap
     * @return success True if swap was executed
     * @return ethReceived Amount of ETH received
     */
    function executeSwap(
        address user,
        uint256 amount
    ) external returns (bool success, uint256 ethReceived) {
        // Check if execution is allowed
        (bool allowed, uint256 available, string memory reason) = 
            ICoordinatorAgent(coordinator).checkExecutionAllowed(user);
        
        if (!allowed) {
            emit QuotaExceeded(user, amount, 0);
            return (false, 0);
        }
        
        // Adjust amount if needed
        uint256 actualAmount = amount;
        if (amount > available) {
            actualAmount = available;
            emit QuotaExceeded(user, amount, available);
        }
        
        // Get current price
        uint256 price = IMockPriceOracle(priceOracle).getPrice(address(0)); // ETH price
        
        // For demo: simulate swap (in production, would call Uniswap)
        // Calculate ETH amount: (USDC amount * 1e8) / price
        // USDC has 6 decimals, ETH has 18 decimals, price has 8 decimals
        // ETH = USDC * 1e18 / price * 1e8 / 1e6 = USDC * 1e20 / price
        ethReceived = (actualAmount * 1e20) / price;
        
        // Record execution with coordinator
        ICoordinatorAgent(coordinator).recordExecution(user, actualAmount, price);
        
        // Update stats
        totalSwapsExecuted++;
        totalUsdcSpent += actualAmount;
        totalEthBought += ethReceived;
        userEthAccumulated[user] += ethReceived;
        
        emit SwapExecuted(
            user,
            usdcToken,
            wethToken,
            actualAmount,
            ethReceived,
            price
        );
        
        return (true, ethReceived);
    }
    
    /**
     * @notice Check if a swap would be allowed
     * @param user The user to check
     * @param amount The amount to check
     * @return canExecute True if execution would succeed
     * @return availableAmount Maximum amount that can be swapped
     * @return estimatedEth Estimated ETH output
     */
    function previewSwap(
        address user,
        uint256 amount
    ) external view returns (bool canExecute, uint256 availableAmount, uint256 estimatedEth) {
        (bool allowed, uint256 available,) = 
            ICoordinatorAgent(coordinator).checkExecutionAllowed(user);
        
        if (!allowed || available == 0) {
            return (false, 0, 0);
        }
        
        availableAmount = amount > available ? available : amount;
        
        uint256 price = IMockPriceOracle(priceOracle).getPrice(address(0));
        estimatedEth = (availableAmount * 1e20) / price;
        
        return (true, availableAmount, estimatedEth);
    }
    
    /**
     * @notice Check if price conditions are met for execution
     * @param user The user to check
     * @param targetDipBps Target dip in basis points
     * @return shouldExecute True if conditions are met
     * @return currentPrice Current ETH price
     * @return dipAmount Actual dip in basis points
     */
    function checkPriceCondition(
        address user,
        uint256 targetDipBps
    ) external view returns (bool shouldExecute, uint256 currentPrice, uint256 dipAmount) {
        (bool hasDipped, uint256 price, uint256 actualDipBps) = 
            IMockPriceOracle(priceOracle).checkPriceDip(address(0), targetDipBps);
        
        if (!hasDipped) {
            return (false, price, actualDipBps);
        }
        
        // Also check if user has available quota
        (bool allowed,,) = ICoordinatorAgent(coordinator).checkExecutionAllowed(user);
        
        return (allowed && hasDipped, price, actualDipBps);
    }
    
    // ============ View Functions ============
    
    function getUserStats(address user) external view returns (
        uint256 ethAccumulated,
        uint256 availableToday
    ) {
        ethAccumulated = userEthAccumulated[user];
        
        (bool allowed, uint256 available,) = 
            ICoordinatorAgent(coordinator).checkExecutionAllowed(user);
        
        availableToday = allowed ? available : 0;
    }
    
    function getGlobalStats() external view returns (
        uint256 swaps,
        uint256 usdcSpent,
        uint256 ethBought
    ) {
        return (totalSwapsExecuted, totalUsdcSpent, totalEthBought);
    }
    
    // ============ Admin Functions ============
    
    function setCoordinator(address _coordinator) external onlyOwner {
        coordinator = _coordinator;
    }
    
    function setPriceOracle(address _priceOracle) external onlyOwner {
        priceOracle = _priceOracle;
    }
    
    function setUniswapRouter(address _router) external onlyOwner {
        uniswapRouter = _router;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ExecutionAgent: zero address");
        owner = newOwner;
    }
    
    /**
     * @notice Emergency withdraw tokens (only owner)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner, amount);
        emit EmergencyWithdraw(token, amount);
    }
}
