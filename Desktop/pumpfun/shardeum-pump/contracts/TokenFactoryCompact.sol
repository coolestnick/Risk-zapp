// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MemeToken.sol";
import "./BondingCurve.sol";

contract TokenFactory is ReentrancyGuard, Ownable {
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
    
    mapping(address => TokenInfo) public tokens;
    address[] public allTokens;
    mapping(address => address[]) public creatorTokens;
    
    uint256 public constant LISTING_THRESHOLD = 50 ether;
    uint256 public constant PLATFORM_FEE = 100; // 1%
    uint256 public constant MAX_BUY_PERCENTAGE = 200; // 2%
    
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
        require(bytes(name).length > 0);
        require(bytes(symbol).length > 0);
        require(bytes(description).length > 0);
        
        MemeToken token = new MemeToken(name, symbol, description, imageHash, msg.sender);
        address tokenAddress = address(token);
        
        tokens[tokenAddress] = TokenInfo({
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
        require(msg.value > 0);
        require(tokens[tokenAddress].tokenAddress != address(0));
        require(!tokens[tokenAddress].isListed);
        
        _buyTokens(tokenAddress, msg.sender, msg.value);
    }
    
    function sellTokens(address tokenAddress, uint256 tokenAmount) external nonReentrant {
        require(tokenAmount > 0);
        require(tokens[tokenAddress].tokenAddress != address(0));
        require(!tokens[tokenAddress].isListed);
        
        MemeToken token = MemeToken(tokenAddress);
        require(token.balanceOf(msg.sender) >= tokenAmount);
        
        TokenInfo storage tokenInfo = tokens[tokenAddress];
        uint256 ethAmount = BondingCurveLib.calculateSellPrice(tokenInfo.currentSupply, tokenAmount);
        require(ethAmount > 0);
        
        uint256 fee = ethAmount * PLATFORM_FEE / 10000;
        uint256 sellerAmount = ethAmount - fee;
        
        tokenInfo.currentSupply -= tokenAmount;
        tokenInfo.marketCap = BondingCurveLib.getMarketCap(tokenInfo.currentSupply);
        tokenInfo.totalRaised -= ethAmount;
        
        require(token.transferFrom(msg.sender, address(this), tokenAmount));
        require(address(this).balance >= sellerAmount);
        
        (bool success, ) = payable(msg.sender).call{value: sellerAmount}("");
        require(success);
        
        if (fee > 0) {
            totalFeesCollected += fee;
            (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
            require(feeSuccess);
        }
        
        uint256 newPrice = BondingCurveLib.getCurrentPrice(tokenInfo.currentSupply);
        emit TokenSold(msg.sender, tokenAddress, tokenAmount, sellerAmount, newPrice, tokenInfo.marketCap);
    }
    
    function _buyTokens(address tokenAddress, address buyer, uint256 ethAmount) internal {
        TokenInfo storage tokenInfo = tokens[tokenAddress];
        MemeToken token = MemeToken(tokenAddress);
        
        uint256 fee = ethAmount * PLATFORM_FEE / 10000;
        uint256 buyAmount = ethAmount - fee;
        
        uint256 tokenAmount = _calculateTokensForEth(tokenInfo.currentSupply, buyAmount);
        require(tokenAmount > 0);
        
        uint256 maxBuy = tokenInfo.initialSupply * MAX_BUY_PERCENTAGE / 10000;
        require(tokenAmount <= maxBuy);
        
        tokenInfo.currentSupply += tokenAmount;
        tokenInfo.marketCap = BondingCurveLib.getMarketCap(tokenInfo.currentSupply);
        tokenInfo.totalRaised += buyAmount;
        
        require(token.transfer(buyer, tokenAmount));
        
        if (fee > 0) {
            totalFeesCollected += fee;
            (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
            require(feeSuccess);
        }
        
        uint256 newPrice = BondingCurveLib.getCurrentPrice(tokenInfo.currentSupply);
        emit TokenPurchased(buyer, tokenAddress, ethAmount, tokenAmount, newPrice, tokenInfo.marketCap);
        
        if (tokenInfo.marketCap >= LISTING_THRESHOLD && !tokenInfo.isListed) {
            _listToken(tokenAddress);
        }
    }
    
    function _calculateTokensForEth(uint256 currentSupply, uint256 ethAmount) internal pure returns (uint256) {
        uint256 low = 0;
        uint256 high = 1000000 * 1e18;
        uint256 tolerance = 1e15;
        
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
    
    function _listToken(address tokenAddress) internal {
        TokenInfo storage tokenInfo = tokens[tokenAddress];
        require(!tokenInfo.isListed);
        
        tokenInfo.isListed = true;
        MemeToken(tokenAddress).enableTrading();
        emit TokenListed(tokenAddress, tokenInfo.marketCap, address(this).balance);
    }
    
    // View functions
    function getTokenInfo(address tokenAddress) external view returns (TokenInfo memory) {
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
        TokenInfo memory tokenInfo = tokens[tokenAddress];
        uint256 fee = ethAmount * PLATFORM_FEE / 10000;
        return _calculateTokensForEth(tokenInfo.currentSupply, ethAmount - fee);
    }
    
    function getSellPrice(address tokenAddress, uint256 tokenAmount) external view returns (uint256) {
        TokenInfo memory tokenInfo = tokens[tokenAddress];
        uint256 ethAmount = BondingCurveLib.calculateSellPrice(tokenInfo.currentSupply, tokenAmount);
        uint256 fee = ethAmount * PLATFORM_FEE / 10000;
        return ethAmount - fee;
    }
    
    function getCurrentPrice(address tokenAddress) external view returns (uint256) {
        TokenInfo memory tokenInfo = tokens[tokenAddress];
        return BondingCurveLib.getCurrentPrice(tokenInfo.currentSupply);
    }
    
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success);
    }
}