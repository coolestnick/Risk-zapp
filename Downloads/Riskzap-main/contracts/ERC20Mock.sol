// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ERC20Mock
 * @dev Mock ERC20 token for testing purposes
 */
contract ERC20Mock is ERC20 {
    /**
     * @dev Constructor mints initial supply to deployer
     * @param name Token name
     * @param symbol Token symbol  
     * @param initial Initial supply to mint
     */
    constructor(string memory name, string memory symbol, uint256 initial) ERC20(name, symbol) {
        _mint(msg.sender, initial);
    }

    /**
     * @dev Mint new tokens to specified address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
