// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// IERC20 not needed - using direct token transfers
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
    
    uint256 public constant LISTING_THRESHOLD = 50 ether; // 50 ETH market cap for listing
    uint256 public constant PLATFORM_FEE = 100; // 1% platform fee (100 basis points)
    uint256 public constant MAX_BUY_PERCENTAGE = 200; // 2% max buy per transaction
    uint256 public constant INITIAL_VIRTUAL_LIQUIDITY = 10 ether;
    
    address public feeRecipient;
    uint256 public totalFeesCollected;
    
    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        string description,
        string imageHash
    );
    
    event TokenPurchased(
        address indexed buyer,
        address indexed tokenAddress,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 newPrice,
        uint256 marketCap
    );
    
    event TokenSold(
        address indexed seller,
        address indexed tokenAddress,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 newPrice,
        uint256 marketCap
    );
    
    event TokenListed(
        address indexed tokenAddress,
        uint256 marketCap,
        uint256 liquidityAdded
    );
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }
    
    function createToken(
        string memory name,
        string memory symbol,
        string memory description,
        string memory imageHash
    ) external payable nonReentrant returns (address) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        
        // Deploy new token
        MemeToken token = new MemeToken(
            name,
            symbol,
            description,
            imageHash,
            msg.sender
        );
        
        address tokenAddress = address(token);
        
        // Initialize token info
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
        
        // If ETH sent with creation, use it to buy tokens
        if (msg.value > 0) {
            _buyTokens(tokenAddress, msg.sender, msg.value);
        }
        
        return tokenAddress;
    }
    
    function buyTokens(address tokenAddress) external payable nonReentrant {
        require(msg.value > 0, "Must send ETH to buy tokens");
        require(tokens[tokenAddress].tokenAddress != address(0), "Token does not exist");
        require(!tokens[tokenAddress].isListed, "Token already listed on DEX");
        
        _buyTokens(tokenAddress, msg.sender, msg.value);
    }
    
    function sellTokens(address tokenAddress, uint256 tokenAmount) external nonReentrant {
        require(tokenAmount > 0, "Must specify token amount to sell");
        require(tokens[tokenAddress].tokenAddress != address(0), "Token does not exist");
        require(!tokens[tokenAddress].isListed, "Token already listed on DEX");
        
        MemeToken token = MemeToken(tokenAddress);
        require(token.balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        
        TokenInfo storage tokenInfo = tokens[tokenAddress];
        uint256 ethAmount = BondingCurveLib.calculateSellPrice(tokenInfo.currentSupply, tokenAmount);
        require(ethAmount > 0, "Invalid sell amount");
        
        // Calculate platform fee
        uint256 fee = ethAmount * PLATFORM_FEE / 10000;
        uint256 sellerAmount = ethAmount - fee;
        
        // Update token info
        tokenInfo.currentSupply = tokenInfo.currentSupply - tokenAmount;
        tokenInfo.marketCap = BondingCurveLib.getMarketCap(tokenInfo.currentSupply);
        tokenInfo.totalRaised = tokenInfo.totalRaised - ethAmount;
        
        // Transfer tokens from seller to factory
        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");
        
        // Transfer ETH to seller
        require(address(this).balance >= sellerAmount, "Insufficient ETH balance");
        (bool success, ) = payable(msg.sender).call{value: sellerAmount}("");
        require(success, "ETH transfer failed");
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            totalFeesCollected = totalFeesCollected + fee;
            (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        uint256 newPrice = BondingCurveLib.getCurrentPrice(tokenInfo.currentSupply);
        
        emit TokenSold(msg.sender, tokenAddress, tokenAmount, sellerAmount, newPrice, tokenInfo.marketCap);
    }
    
    function _buyTokens(address tokenAddress, address buyer, uint256 ethAmount) internal {
        TokenInfo storage tokenInfo = tokens[tokenAddress];
        MemeToken token = MemeToken(tokenAddress);
        
        // Calculate platform fee
        uint256 fee = ethAmount * PLATFORM_FEE / 10000;
        uint256 buyAmount = ethAmount - fee;
        
        // Calculate token amount based on bonding curve
        uint256 tokenAmount = _calculateTokensForEth(tokenInfo.currentSupply, buyAmount);
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
            totalFeesCollected = totalFeesCollected + fee;
            (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        uint256 newPrice = BondingCurveLib.getCurrentPrice(tokenInfo.currentSupply);
        
        emit TokenPurchased(buyer, tokenAddress, ethAmount, tokenAmount, newPrice, tokenInfo.marketCap);
        
        // Check if token should be listed on DEX
        if (tokenInfo.marketCap >= LISTING_THRESHOLD && !tokenInfo.isListed) {
            _listToken(tokenAddress);
        }
    }
    
    function _calculateTokensForEth(uint256 currentSupply, uint256 ethAmount) internal pure returns (uint256) {
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
    
    function _listToken(address tokenAddress) internal {
        TokenInfo storage tokenInfo = tokens[tokenAddress];
        require(!tokenInfo.isListed, "Token already listed");
        
        tokenInfo.isListed = true;
        
        MemeToken token = MemeToken(tokenAddress);
        token.enableTrading();
        
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
        uint256 buyAmount = ethAmount - fee;
        return _calculateTokensForEth(tokenInfo.currentSupply, buyAmount);
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
    
    // Admin functions
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }
}