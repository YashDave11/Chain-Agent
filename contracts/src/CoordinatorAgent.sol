// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CoordinatorAgent
 * @notice Main agent that receives user permissions and delegates to ExecutionAgent
 * @dev Demonstrates Agent-to-Agent (A2A) delegation pattern for the hackathon
 */
contract CoordinatorAgent {
    using SafeERC20 for IERC20;
    
    // ============ Structs ============
    
    struct Permission {
        address user;           // User who granted permission
        address token;          // Token to spend (e.g., USDC)
        uint256 dailyLimit;     // Maximum daily spend
        uint256 totalLimit;     // Total permission amount
        uint256 startTime;      // When permission started
        uint256 duration;       // Duration in seconds
        uint256 targetDipBps;   // Target dip percentage in basis points (500 = 5%)
        bool active;            // Is permission still valid
    }
    
    struct Delegation {
        address executor;       // ExecutionAgent address
        uint256 dailyLimit;     // Delegated daily limit
        uint256 spentToday;     // Amount spent today
        uint256 lastResetDay;   // Day number of last reset
        bool active;            // Is delegation active
    }
    
    // ============ State Variables ============
    
    address public owner;
    address public priceOracle;
    
    // User => Permission
    mapping(address => Permission) public permissions;
    
    // User => Delegation to executor
    mapping(address => Delegation) public delegations;
    
    // Track total spent per user
    mapping(address => uint256) public totalSpent;
    
    // ============ Events ============
    
    event PermissionReceived(
        address indexed user,
        address indexed token,
        uint256 dailyLimit,
        uint256 totalLimit,
        uint256 duration,
        uint256 targetDipBps
    );
    
    event SubDelegationIssued(
        address indexed user,
        address indexed executor,
        uint256 dailyLimit
    );
    
    event ExecutionTriggered(
        address indexed user,
        address indexed executor,
        uint256 amount,
        uint256 price
    );
    
    event PermissionRevoked(address indexed user);
    event DelegationRevoked(address indexed user, address indexed executor);
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "CoordinatorAgent: not owner");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _priceOracle) {
        owner = msg.sender;
        priceOracle = _priceOracle;
    }
    
    // ============ Permission Management ============
    
    /**
     * @notice Receive a permission from a user (simulating ERC-7715 grant)
     * @dev In production, this would integrate with MetaMask Smart Accounts Kit
     */
    function receivePermission(
        address token,
        uint256 dailyLimit,
        uint256 totalLimit,
        uint256 durationDays,
        uint256 targetDipBps
    ) external {
        require(dailyLimit > 0, "CoordinatorAgent: zero daily limit");
        require(totalLimit >= dailyLimit, "CoordinatorAgent: invalid limits");
        require(durationDays > 0, "CoordinatorAgent: zero duration");
        
        // Store permission
        permissions[msg.sender] = Permission({
            user: msg.sender,
            token: token,
            dailyLimit: dailyLimit,
            totalLimit: totalLimit,
            startTime: block.timestamp,
            duration: durationDays * 1 days,
            targetDipBps: targetDipBps,
            active: true
        });
        
        emit PermissionReceived(
            msg.sender,
            token,
            dailyLimit,
            totalLimit,
            durationDays * 1 days,
            targetDipBps
        );
    }
    
    /**
     * @notice Issue a sub-delegation to an ExecutionAgent
     * @param user The user whose permission to sub-delegate
     * @param executor The ExecutionAgent address
     * @param delegatedDailyLimit The daily limit to delegate
     */
    function issueSubDelegation(
        address user,
        address executor,
        uint256 delegatedDailyLimit
    ) external onlyOwner {
        Permission storage perm = permissions[user];
        require(perm.active, "CoordinatorAgent: no active permission");
        require(delegatedDailyLimit <= perm.dailyLimit, "CoordinatorAgent: exceeds daily limit");
        require(executor != address(0), "CoordinatorAgent: zero executor");
        
        delegations[user] = Delegation({
            executor: executor,
            dailyLimit: delegatedDailyLimit,
            spentToday: 0,
            lastResetDay: block.timestamp / 1 days,
            active: true
        });
        
        emit SubDelegationIssued(user, executor, delegatedDailyLimit);
    }
    
    /**
     * @notice Check if execution is allowed and return available amount
     * @param user The user to check
     * @return allowed True if execution is allowed
     * @return availableAmount Amount available to spend
     * @return reason Reason if not allowed
     */
    function checkExecutionAllowed(address user) 
        external 
        view 
        returns (bool allowed, uint256 availableAmount, string memory reason) 
    {
        Permission storage perm = permissions[user];
        Delegation storage del = delegations[user];
        
        // Check permission is active
        if (!perm.active) {
            return (false, 0, "Permission not active");
        }
        
        // Check permission hasn't expired
        if (block.timestamp > perm.startTime + perm.duration) {
            return (false, 0, "Permission expired");
        }
        
        // Check total limit not exceeded
        if (totalSpent[user] >= perm.totalLimit) {
            return (false, 0, "Total limit reached");
        }
        
        // Check delegation exists
        if (!del.active) {
            return (false, 0, "No active delegation");
        }
        
        // Reset daily counter if new day
        uint256 currentDay = block.timestamp / 1 days;
        uint256 spentToday = del.spentToday;
        if (currentDay > del.lastResetDay) {
            spentToday = 0;
        }
        
        // Calculate available amount
        availableAmount = del.dailyLimit - spentToday;
        if (availableAmount > perm.totalLimit - totalSpent[user]) {
            availableAmount = perm.totalLimit - totalSpent[user];
        }
        
        return (availableAmount > 0, availableAmount, "");
    }
    
    /**
     * @notice Record an execution (called by ExecutionAgent)
     * @param user The user whose funds were used
     * @param amount The amount spent
     * @param price The price at execution
     */
    function recordExecution(
        address user,
        uint256 amount,
        uint256 price
    ) external {
        Delegation storage del = delegations[user];
        require(del.active, "CoordinatorAgent: no delegation");
        require(msg.sender == del.executor, "CoordinatorAgent: not executor");
        
        // Reset daily counter if new day
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > del.lastResetDay) {
            del.spentToday = 0;
            del.lastResetDay = currentDay;
        }
        
        // Check amount is within limits
        require(del.spentToday + amount <= del.dailyLimit, "CoordinatorAgent: daily limit exceeded");
        
        // Update spending
        del.spentToday += amount;
        totalSpent[user] += amount;
        
        emit ExecutionTriggered(user, msg.sender, amount, price);
    }
    
    /**
     * @notice Revoke a user's permission
     */
    function revokePermission(address user) external {
        require(
            msg.sender == user || msg.sender == owner,
            "CoordinatorAgent: not authorized"
        );
        
        permissions[user].active = false;
        delegations[user].active = false;
        
        emit PermissionRevoked(user);
    }
    
    // ============ View Functions ============
    
    function getPermission(address user) external view returns (Permission memory) {
        return permissions[user];
    }
    
    function getDelegation(address user) external view returns (Delegation memory) {
        return delegations[user];
    }
    
    function getDailySpent(address user) external view returns (uint256) {
        Delegation storage del = delegations[user];
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > del.lastResetDay) {
            return 0;
        }
        return del.spentToday;
    }
    
    function getRemainingTotal(address user) external view returns (uint256) {
        Permission storage perm = permissions[user];
        if (totalSpent[user] >= perm.totalLimit) {
            return 0;
        }
        return perm.totalLimit - totalSpent[user];
    }
    
    // ============ Admin Functions ============
    
    function setPriceOracle(address _priceOracle) external onlyOwner {
        priceOracle = _priceOracle;
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "CoordinatorAgent: zero address");
        owner = newOwner;
    }
}
