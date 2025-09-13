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
    }
    
    mapping(address => Token) public tokens;
    address[] public allTokens;
    
    uint256 constant THRESHOLD = 50 ether;
    uint256 constant FEE = 100; // 1%
    
    address public feeRecipient;
    
    event TokenCreated(address indexed token, address indexed creator);
    event Trade(address indexed token, address indexed trader, uint256 amount, bool isBuy);
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
        
        tokens[addr] = Token(addr, msg.sender, 0, 0, false);
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
        
        token.supply -= amount;
        token.mcap = BondingCurveLib.getMarketCap(token.supply);
        
        require(MemeToken(tokenAddr).transferFrom(msg.sender, address(this), amount));
        require(net <= address(this).balance);
        
        payable(msg.sender).transfer(net);
        if (fee > 0) payable(feeRecipient).transfer(fee);
        
        emit Trade(tokenAddr, msg.sender, amount, false);
    }
    
    function _buy(address tokenAddr, address buyer, uint256 ethIn) internal {
        Token storage token = tokens[tokenAddr];
        uint256 fee = ethIn * FEE / 10000;
        uint256 net = ethIn - fee;
        
        uint256 tokenOut = _calcTokens(token.supply, net);
        require(tokenOut > 0);
        
        token.supply += tokenOut;
        token.mcap = BondingCurveLib.getMarketCap(token.supply);
        
        require(MemeToken(tokenAddr).transfer(buyer, tokenOut));
        if (fee > 0) payable(feeRecipient).transfer(fee);
        
        emit Trade(tokenAddr, buyer, tokenOut, true);
        
        if (token.mcap >= THRESHOLD && !token.listed) {
            token.listed = true;
            MemeToken(tokenAddr).enableTrading();
            emit Listed(tokenAddr);
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
    
    // Admin
    function setFee(address addr) external onlyOwner {
        feeRecipient = addr;
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}