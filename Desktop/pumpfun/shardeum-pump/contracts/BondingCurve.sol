// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library BondingCurveLib {
    
    uint256 constant SCALE = 1e18;
    uint256 constant BASE_PRICE = 1e12; // 0.000001 ETH base price
    uint256 constant CURVE_EXPONENT = 2;
    
    function calculateBuyPrice(uint256 currentSupply, uint256 amount) internal pure returns (uint256) {
        if (amount == 0) return 0;
        
        // Integral of price function from currentSupply to currentSupply + amount
        // For exponential curve: price = basePrice * (supply/scale)^exponent
        // Integral = (basePrice * scale^(-exponent)) * (supply^(exponent+1)) / (exponent+1)
        
        uint256 newSupply = currentSupply + amount;
        uint256 cost = integralCost(newSupply) - integralCost(currentSupply);
        
        return cost;
    }
    
    function calculateSellPrice(uint256 currentSupply, uint256 amount) internal pure returns (uint256) {
        if (amount == 0) return 0;
        require(currentSupply >= amount, "Insufficient supply to sell");
        
        uint256 newSupply = currentSupply - amount;
        uint256 refund = integralCost(currentSupply) - integralCost(newSupply);
        
        // Apply 5% sell tax
        return refund * 95 / 100;
    }
    
    function integralCost(uint256 supply) internal pure returns (uint256) {
        if (supply == 0) return 0;
        
        // For quadratic curve: integral = basePrice * supply^3 / (3 * scale^2)
        uint256 supplySquared = supply * supply / SCALE;
        uint256 supplyCubed = supplySquared * supply / SCALE;
        
        return BASE_PRICE * supplyCubed / 3 / SCALE;
    }
    
    function getCurrentPrice(uint256 supply) internal pure returns (uint256) {
        if (supply == 0) return BASE_PRICE;
        
        // price = basePrice * (supply/scale)^2
        uint256 supplyRatio = supply * SCALE / SCALE;
        uint256 supplySquared = supplyRatio * supply / SCALE;
        
        return BASE_PRICE * supplySquared / SCALE;
    }
    
    function getMarketCap(uint256 supply) internal pure returns (uint256) {
        return getCurrentPrice(supply) * supply / SCALE;
    }
}