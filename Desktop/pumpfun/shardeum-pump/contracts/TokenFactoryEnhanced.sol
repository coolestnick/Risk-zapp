// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MemeToken.sol";
import "./BondingCurve.sol";

contract TokenFactory is ReentrancyGuard, Ownable {
    using BondingCurveLib for uint256;
    
    struct Token {
        address addr;
        address creator;
        uint256 supply;
        uint256 mcap;
        bool listed;
        uint256 createdAt;
        uint256 volume24h;
        uint256 lastVolumeReset;
        uint256 totalVolume;
        uint256 holders;
    }
    
    mapping(address => Token) public tokens;
    mapping(address => mapping(address => uint256)) public balances; // token => holder => balance
    mapping(address => address[]) public tokenHolders; // token => holders array
    address[] public allTokens;
    
    uint256 constant THRESHOLD = 50 ether;
    uint256 constant FEE = 100; // 1%
    uint256 constant DAY_SECONDS = 86400;
    
    address public feeRecipient;
    uint256 public totalPlatformVolume;
    
    event TokenCreated(address indexed token, address indexed creator);
    event Trade(address indexed token, address indexed trader, uint256 amount, bool isBuy, uint256 volume);
    event Listed(address indexed token);
    
    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }
    
    function createToken(
        string memory name,
        string memory symbol,
        string memory desc,
        string memory img
    ) external payable nonReentrant returns (address) {
        require(bytes(name).length > 0);
        
        MemeToken token = new MemeToken(name, symbol, desc, img, msg.sender);
        address addr = address(token);
        
        tokens[addr] = Token({
            addr: addr,
            creator: msg.sender,
            supply: 0,
            mcap: 0,
            listed: false,
            createdAt: block.timestamp,
            volume24h: 0,
            lastVolumeReset: block.timestamp,
            totalVolume: 0,
            holders: 0
        });
        
        allTokens.push(addr);
        
        emit TokenCreated(addr, msg.sender);
        
        if (msg.value > 0) {
            _buy(addr, msg.sender, msg.value);
        }
        
        return addr;
    }
    
    function buy(address tokenAddr) external payable nonReentrant {
        require(msg.value > 0 && !tokens[tokenAddr].listed);
        _buy(tokenAddr, msg.sender, msg.value);
    }
    
    function sell(address tokenAddr, uint256 amount) external nonReentrant {
        require(amount > 0 && !tokens[tokenAddr].listed);
        
        Token storage token = tokens[tokenAddr];
        uint256 ethOut = BondingCurveLib.calculateSellPrice(token.supply, amount);
        uint256 fee = ethOut * FEE / 10000;
        uint256 net = ethOut - fee;
        
        // Update volume tracking
        _updateVolume(tokenAddr, ethOut);
        
        // Update holder tracking
        _updateHolder(tokenAddr, msg.sender, false, amount);
        
        token.supply -= amount;
        token.mcap = BondingCurveLib.getMarketCap(token.supply);
        
        require(MemeToken(tokenAddr).transferFrom(msg.sender, address(this), amount));
        require(net <= address(this).balance);
        
        payable(msg.sender).transfer(net);
        if (fee > 0) payable(feeRecipient).transfer(fee);
        
        emit Trade(tokenAddr, msg.sender, amount, false, ethOut);
    }
    
    function _buy(address tokenAddr, address buyer, uint256 ethIn) internal {
        Token storage token = tokens[tokenAddr];
        uint256 fee = ethIn * FEE / 10000;
        uint256 net = ethIn - fee;
        
        uint256 tokenOut = _calcTokens(token.supply, net);
        require(tokenOut > 0);
        
        // Update volume tracking
        _updateVolume(tokenAddr, ethIn);
        
        // Update holder tracking  
        _updateHolder(tokenAddr, buyer, true, tokenOut);
        
        token.supply += tokenOut;
        token.mcap = BondingCurveLib.getMarketCap(token.supply);
        
        require(MemeToken(tokenAddr).transfer(buyer, tokenOut));
        if (fee > 0) payable(feeRecipient).transfer(fee);
        
        emit Trade(tokenAddr, buyer, tokenOut, true, ethIn);
        
        if (token.mcap >= THRESHOLD && !token.listed) {
            token.listed = true;
            MemeToken(tokenAddr).enableTrading();
            emit Listed(tokenAddr);
        }
    }
    
    function _updateVolume(address tokenAddr, uint256 volume) internal {
        Token storage token = tokens[tokenAddr];
        
        // Reset 24h volume if more than 24 hours passed
        if (block.timestamp > token.lastVolumeReset + DAY_SECONDS) {
            token.volume24h = volume;
            token.lastVolumeReset = block.timestamp;
        } else {
            token.volume24h += volume;
        }
        
        token.totalVolume += volume;
        totalPlatformVolume += volume;
    }
    
    function _updateHolder(address tokenAddr, address holder, bool isBuy, uint256 amount) internal {
        uint256 previousBalance = balances[tokenAddr][holder];
        
        if (isBuy) {
            balances[tokenAddr][holder] += amount;
            // If first time holding, add to holders
            if (previousBalance == 0) {
                tokenHolders[tokenAddr].push(holder);
                tokens[tokenAddr].holders++;
            }
        } else {
            balances[tokenAddr][holder] -= amount;
            // If balance becomes 0, remove from holders
            if (balances[tokenAddr][holder] == 0 && previousBalance > 0) {
                tokens[tokenAddr].holders--;
                // Remove from holders array (expensive but for accuracy)
                _removeFromHolders(tokenAddr, holder);
            }
        }
    }
    
    function _removeFromHolders(address tokenAddr, address holder) internal {
        address[] storage holders = tokenHolders[tokenAddr];
        for (uint i = 0; i < holders.length; i++) {
            if (holders[i] == holder) {
                holders[i] = holders[holders.length - 1];
                holders.pop();
                break;
            }
        }
    }
    
    function _calcTokens(uint256 supply, uint256 eth) internal pure returns (uint256) {
        uint256 low = 0;
        uint256 high = 1000000 * 1e18;
        
        while (high - low > 1) {
            uint256 mid = (low + high) / 2;
            uint256 cost = BondingCurveLib.calculateBuyPrice(supply, mid);
            
            if (cost <= eth) low = mid;
            else high = mid;
        }
        return low;
    }
    
    // View functions
    function getToken(address addr) external view returns (Token memory) {
        return tokens[addr];
    }
    
    function getCount() external view returns (uint256) {
        return allTokens.length;
    }
    
    function getPrice(address addr) external view returns (uint256) {
        return BondingCurveLib.getCurrentPrice(tokens[addr].supply);
    }
    
    function getHolders(address tokenAddr) external view returns (address[] memory) {
        return tokenHolders[tokenAddr];
    }
    
    function getHolderBalance(address tokenAddr, address holder) external view returns (uint256) {
        return balances[tokenAddr][holder];
    }
    
    function getPlatformStats() external view returns (uint256 totalTokens, uint256 totalVolume, uint256 totalMcap) {
        totalTokens = allTokens.length;
        totalVolume = totalPlatformVolume;
        
        for (uint i = 0; i < allTokens.length; i++) {
            totalMcap += tokens[allTokens[i]].mcap;
        }
    }
    
    // Admin
    function setFee(address addr) external onlyOwner {
        feeRecipient = addr;
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}