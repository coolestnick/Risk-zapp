// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MemeToken is ERC20, Ownable, ReentrancyGuard {
    string public description;
    string public imageHash;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    bool public tradingEnabled;
    address public factory;
    
    mapping(address => bool) public isExcludedFromFees;
    
    event TradingEnabled();
    event MetadataUpdated(string description, string imageHash);
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _description,
        string memory _imageHash,
        address _owner
    ) ERC20(_name, _symbol) Ownable(_owner) {
        description = _description;
        imageHash = _imageHash;
        factory = msg.sender;
        
        // Mint initial supply to factory for bonding curve
        _mint(factory, MAX_SUPPLY);
        
        // Exclude factory from fees
        isExcludedFromFees[factory] = true;
        isExcludedFromFees[_owner] = true;
    }
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call this");
        _;
    }
    
    function enableTrading() external onlyFactory {
        require(!tradingEnabled, "Trading already enabled");
        tradingEnabled = true;
        emit TradingEnabled();
    }
    
    function updateMetadata(
        string memory _description,
        string memory _imageHash
    ) external onlyOwner {
        description = _description;
        imageHash = _imageHash;
        emit MetadataUpdated(_description, _imageHash);
    }
    
    function setExcludedFromFees(address account, bool excluded) external onlyOwner {
        isExcludedFromFees[account] = excluded;
    }
    
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override {
        // Allow minting and factory transfers always
        if (from == address(0) || from == factory || to == factory) {
            super._update(from, to, amount);
            return;
        }
        
        // Require trading to be enabled for regular transfers
        require(tradingEnabled, "Trading not yet enabled");
        
        super._update(from, to, amount);
    }
    
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    function burnFrom(address account, uint256 amount) external {
        uint256 currentAllowance = allowance(account, msg.sender);
        require(currentAllowance >= amount, "Burn amount exceeds allowance");
        
        _approve(account, msg.sender, currentAllowance - amount);
        _burn(account, amount);
    }
}