// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MemeToken.sol";
import "./BondingCurve.sol";
import "./TokenFactoryLib.sol";

contract TokenFactory is ReentrancyGuard, Ownable {
    using BondingCurveLib for uint256;
    using TokenFactoryLib for TokenFactoryLib.TokenInfo;
    
    mapping(address => TokenFactoryLib.TokenInfo) public tokens;
    address[] public allTokens;
    mapping(address => address[]) public creatorTokens;
    
    uint256 public constant LISTING_THRESHOLD = 50 ether;
    address public feeRecipient;
    uint256 public totalFeesCollected;
    
    event TokenCreated(address indexed tokenAddress, address indexed creator, string name, string symbol, string description, string imageHash);
    event TokenPurchased(address indexed buyer, address indexed tokenAddress, uint256 ethAmount, uint256 tokenAmount, uint256 newPrice, uint256 marketCap);
    event TokenSold(address indexed seller, address indexed tokenAddress, uint256 tokenAmount, uint256 ethAmount, uint256 newPrice, uint256 marketCap);
    event TokenListed(address indexed tokenAddress, uint256 marketCap, uint256 liquidityAdded);
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }
    
    function createToken(
        string memory name,
        string memory symbol,
        string memory description,
        string memory imageHash
    ) external payable nonReentrant returns (address) {
        require(bytes(name).length > 0 && bytes(symbol).length > 0 && bytes(description).length > 0, "Invalid input");
        
        MemeToken token = new MemeToken(name, symbol, description, imageHash, msg.sender);
        address tokenAddress = address(token);
        
        tokens[tokenAddress] = TokenFactoryLib.TokenInfo({
            tokenAddress: tokenAddress,
            creator: msg.sender,
            createdAt: block.timestamp,
            initialSupply: token.MAX_SUPPLY(),
            currentSupply: 0,
            marketCap: 0,
            totalRaised: 0,
            isListed: false,
            name: name,
            symbol: symbol,
            description: description,
            imageHash: imageHash
        });
        
        allTokens.push(tokenAddress);
        creatorTokens[msg.sender].push(tokenAddress);
        
        emit TokenCreated(tokenAddress, msg.sender, name, symbol, description, imageHash);
        
        if (msg.value > 0) {
            _buyTokens(tokenAddress, msg.sender, msg.value);
        }
        
        return tokenAddress;
    }
    
    function buyTokens(address tokenAddress) external payable nonReentrant {
        require(msg.value > 0 && tokens[tokenAddress].tokenAddress != address(0) && !tokens[tokenAddress].isListed, "Invalid buy");
        _buyTokens(tokenAddress, msg.sender, msg.value);
    }
    
    function sellTokens(address tokenAddress, uint256 tokenAmount) external nonReentrant {
        require(tokenAmount > 0 && tokens[tokenAddress].tokenAddress != address(0) && !tokens[tokenAddress].isListed, "Invalid sell");
        
        (uint256 sellerAmount, uint256 newPrice, uint256 fee) = TokenFactoryLib.processSell(
            tokens[tokenAddress],
            tokenAddress,
            msg.sender,
            tokenAmount,
            feeRecipient
        );
        
        totalFeesCollected += fee;
        emit TokenSold(msg.sender, tokenAddress, tokenAmount, sellerAmount, newPrice, tokens[tokenAddress].marketCap);
    }
    
    function _buyTokens(address tokenAddress, address buyer, uint256 ethAmount) internal {
        (uint256 tokenAmount, uint256 newPrice, uint256 fee) = TokenFactoryLib.processBuy(
            tokens[tokenAddress],
            tokenAddress,
            buyer,
            ethAmount,
            feeRecipient
        );
        
        totalFeesCollected += fee;
        emit TokenPurchased(buyer, tokenAddress, ethAmount, tokenAmount, newPrice, tokens[tokenAddress].marketCap);
        
        if (tokens[tokenAddress].marketCap >= LISTING_THRESHOLD && !tokens[tokenAddress].isListed) {
            _listToken(tokenAddress);
        }
    }
    
    function _listToken(address tokenAddress) internal {
        tokens[tokenAddress].isListed = true;
        MemeToken(tokenAddress).enableTrading();
        emit TokenListed(tokenAddress, tokens[tokenAddress].marketCap, address(this).balance);
    }
    
    // View functions
    function getTokenInfo(address tokenAddress) external view returns (TokenFactoryLib.TokenInfo memory) {
        return tokens[tokenAddress];
    }
    
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }
    
    function getCreatorTokens(address creator) external view returns (address[] memory) {
        return creatorTokens[creator];
    }
    
    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }
    
    function getBuyPrice(address tokenAddress, uint256 ethAmount) external view returns (uint256) {
        TokenFactoryLib.TokenInfo memory tokenInfo = tokens[tokenAddress];
        uint256 fee = ethAmount * 100 / 10000; // PLATFORM_FEE
        return TokenFactoryLib.calculateTokensForEth(tokenInfo.currentSupply, ethAmount - fee);
    }
    
    function getSellPrice(address tokenAddress, uint256 tokenAmount) external view returns (uint256) {
        TokenFactoryLib.TokenInfo memory tokenInfo = tokens[tokenAddress];
        uint256 ethAmount = BondingCurveLib.calculateSellPrice(tokenInfo.currentSupply, tokenAmount);
        return ethAmount - (ethAmount * 100 / 10000); // Minus PLATFORM_FEE
    }
    
    function getCurrentPrice(address tokenAddress) external view returns (uint256) {
        return BondingCurveLib.getCurrentPrice(tokens[tokenAddress].currentSupply);
    }
    
    // Admin functions
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }
    
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }
}