// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IShardeumRegistry {
    function domains(string memory name) external view returns (
        address owner,
        uint256 expiry,
        address resolver,
        uint256 price,
        bool isForSale,
        bool isPremium
    );
    
    function transfer(string memory name, address to) external;
    function getDomain(string memory name) external view returns (address, uint256, bool, uint256, bool);
    function isAvailable(string memory name) external view returns (bool);
    function calculatePrice(string memory name) external view returns (uint256);
}