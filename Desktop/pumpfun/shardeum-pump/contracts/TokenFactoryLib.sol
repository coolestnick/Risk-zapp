// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MemeToken.sol";
import "./BondingCurve.sol";

library TokenFactoryLib {
    using BondingCurveLib for uint256;
    
    struct TokenInfo {
        address tokenAddress;
        address creator;
        uint256 createdAt;
        uint256 initialSupply;
        uint256 currentSupply;
        uint256 marketCap;
        uint256 totalRaised;
        bool isListed;
        string name;
        string symbol;
        string description;
        string imageHash;
    }
    
    uint256 constant PLATFORM_FEE = 100; // 1% platform fee
    uint256 constant MAX_BUY_PERCENTAGE = 200; // 2% max buy per transaction
    
    function calculateTokensForEth(uint256 currentSupply, uint256 ethAmount) internal pure returns (uint256) {
        // Binary search to find token amount for given ETH
        uint256 low = 0;
        uint256 high = 1000000 * 1e18; // Max reasonable token amount
        uint256 tolerance = 1e15; // 0.001 ETH tolerance
        
        while (high - low > 1) {
            uint256 mid = (low + high) / 2;
            uint256 cost = BondingCurveLib.calculateBuyPrice(currentSupply, mid);
            
            if (cost <= ethAmount + tolerance && cost >= ethAmount - tolerance) {
                return mid;
            } else if (cost < ethAmount) {
                low = mid;
            } else {
                high = mid;
            }
        }
        
        return low;
    }
    
    function processBuy(
        TokenInfo storage tokenInfo,
        address tokenAddress,
        address buyer,
        uint256 ethAmount,
        address feeRecipient
    ) internal returns (uint256 tokenAmount, uint256 newPrice, uint256 fee) {
        MemeToken token = MemeToken(tokenAddress);
        
        // Calculate platform fee
        fee = ethAmount * PLATFORM_FEE / 10000;
        uint256 buyAmount = ethAmount - fee;
        
        // Calculate token amount based on bonding curve
        tokenAmount = calculateTokensForEth(tokenInfo.currentSupply, buyAmount);
        require(tokenAmount > 0, "Invalid buy amount");
        
        // Check max buy limit (2% of total supply)
        uint256 maxBuy = tokenInfo.initialSupply * MAX_BUY_PERCENTAGE / 10000;
        require(tokenAmount <= maxBuy, "Exceeds max buy limit");
        
        // Update token info
        tokenInfo.currentSupply = tokenInfo.currentSupply + tokenAmount;
        tokenInfo.marketCap = BondingCurveLib.getMarketCap(tokenInfo.currentSupply);
        tokenInfo.totalRaised = tokenInfo.totalRaised + buyAmount;
        
        // Transfer tokens to buyer
        require(token.transfer(buyer, tokenAmount), "Token transfer failed");
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        newPrice = BondingCurveLib.getCurrentPrice(tokenInfo.currentSupply);
    }
    
    function processSell(
        TokenInfo storage tokenInfo,
        address tokenAddress,
        address seller,
        uint256 tokenAmount,
        address feeRecipient
    ) internal returns (uint256 sellerAmount, uint256 newPrice, uint256 fee) {
        MemeToken token = MemeToken(tokenAddress);
        require(token.balanceOf(seller) >= tokenAmount, "Insufficient token balance");
        
        uint256 ethAmount = BondingCurveLib.calculateSellPrice(tokenInfo.currentSupply, tokenAmount);
        require(ethAmount > 0, "Invalid sell amount");
        
        // Calculate platform fee
        fee = ethAmount * PLATFORM_FEE / 10000;
        sellerAmount = ethAmount - fee;
        
        // Update token info
        tokenInfo.currentSupply = tokenInfo.currentSupply - tokenAmount;
        tokenInfo.marketCap = BondingCurveLib.getMarketCap(tokenInfo.currentSupply);
        tokenInfo.totalRaised = tokenInfo.totalRaised - ethAmount;
        
        // Transfer tokens from seller to factory
        require(token.transferFrom(seller, address(this), tokenAmount), "Token transfer failed");
        
        // Transfer ETH to seller
        require(address(this).balance >= sellerAmount, "Insufficient ETH balance");
        (bool success, ) = payable(seller).call{value: sellerAmount}("");
        require(success, "ETH transfer failed");
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        newPrice = BondingCurveLib.getCurrentPrice(tokenInfo.currentSupply);
    }
}