// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockPriceOracle
 * @notice Simple mock oracle for demo purposes - allows owner to set prices
 * @dev This is NOT for production - just for hackathon demonstration
 */
contract MockPriceOracle {
    address public owner;
    
    // Token address => Price in USD (8 decimals like Chainlink)
    mapping(address => uint256) public prices;
    
    // Track price history for our "dip detection"
    mapping(address => uint256) public previousPrices;
    
    event PriceUpdated(address indexed token, uint256 oldPrice, uint256 newPrice);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "MockPriceOracle: not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        
        // Set initial ETH price to $3000 (with 8 decimals)
        prices[address(0)] = 3000 * 1e8; // ETH
        previousPrices[address(0)] = 3000 * 1e8;
    }
    
    /**
     * @notice Get the current price of a token
     * @param token The token address (use address(0) for ETH)
     * @return price The price in USD with 8 decimals
     */
    function getPrice(address token) external view returns (uint256) {
        return prices[token];
    }
    
    /**
     * @notice Update the price of a token (only owner)
     * @param token The token address
     * @param newPrice The new price in USD with 8 decimals
     */
    function updatePrice(address token, uint256 newPrice) external onlyOwner {
        uint256 oldPrice = prices[token];
        previousPrices[token] = oldPrice;
        prices[token] = newPrice;
        
        emit PriceUpdated(token, oldPrice, newPrice);
    }
    
    /**
     * @notice Check if the price has dropped by at least the target percentage
     * @param token The token to check
     * @param targetDipBps The target dip in basis points (100 = 1%)
     * @return hasDipped True if price dropped by at least targetDipBps
     * @return currentPrice The current price
     * @return dropPercentBps The actual drop in basis points
     */
    function checkPriceDip(
        address token, 
        uint256 targetDipBps
    ) external view returns (bool hasDipped, uint256 currentPrice, uint256 dropPercentBps) {
        uint256 previous = previousPrices[token];
        uint256 current = prices[token];
        
        if (previous == 0 || current >= previous) {
            return (false, current, 0);
        }
        
        // Calculate percentage drop in basis points
        dropPercentBps = ((previous - current) * 10000) / previous;
        hasDipped = dropPercentBps >= targetDipBps;
        currentPrice = current;
    }
    
    /**
     * @notice Simulate a price dip for demo purposes
     * @param token The token to simulate dip for
     * @param dipPercentBps The percentage to drop in basis points (500 = 5%)
     */
    function simulateDip(address token, uint256 dipPercentBps) external onlyOwner {
        uint256 currentPrice = prices[token];
        require(currentPrice > 0, "MockPriceOracle: no price set");
        
        // Store current as previous
        previousPrices[token] = currentPrice;
        
        // Calculate new price after dip
        uint256 newPrice = currentPrice - (currentPrice * dipPercentBps / 10000);
        prices[token] = newPrice;
        
        emit PriceUpdated(token, currentPrice, newPrice);
    }
    
    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "MockPriceOracle: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
