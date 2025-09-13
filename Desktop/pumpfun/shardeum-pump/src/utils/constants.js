// Shardeum Network Configuration
export const SHARDEUM_CONFIG = {
  chainId: 8080,
  chainIdHex: '0x1F90',
  name: 'Shardeum Unstable',
  nativeCurrency: {
    name: 'SHM',
    symbol: 'SHM',
    decimals: 18,
  },
  rpcUrls: ['https://api-unstable.shardeum.org'],
  blockExplorerUrls: ['https://explorer-unstable.shardeum.org/'],
};

// Contract Configuration
export const CONTRACT_CONFIG = {
  FACTORY_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || '0x1D1E05567C5a9f115caE6666A8f659423A4aB559',
  SHARDEUM_RPC: import.meta.env.VITE_SHARDEUM_RPC_URL || 'https://api-unstable.shardeum.org',
  EXPLORER_URL: import.meta.env.VITE_SHARDEUM_EXPLORER || 'https://explorer-unstable.shardeum.org',
  IPFS_GATEWAY: import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
};

// Trading Constants
export const TRADING_CONFIG = {
  MAX_SLIPPAGE: 5, // 5% default slippage
  MIN_BUY_AMOUNT: '0.001', // 0.001 ETH minimum buy
  MAX_BUY_AMOUNT: '10', // 10 ETH maximum buy
  GAS_LIMIT: 500000,
  PRICE_IMPACT_WARNING: 10, // Warn at 10% price impact
};

// UI Constants
export const UI_CONFIG = {
  TOKENS_PER_PAGE: 20,
  CHART_INTERVALS: ['1m', '5m', '15m', '1h', '4h', '1d'],
  TRENDING_LIMIT: 10,
  NEW_TOKENS_LIMIT: 12,
};

// Contract ABIs - Back to TokenFactoryMinimal (your deployed contract)
export const TOKEN_FACTORY_ABI = [
  // Events
  "event TokenCreated(address indexed token, address indexed creator)",
  "event Trade(address indexed token, address indexed trader, uint256 amount, bool isBuy)",
  "event Listed(address indexed token)",
  
  // Read Functions  
  "function getToken(address addr) external view returns (tuple(address addr, address creator, uint256 supply, uint256 mcap, bool listed))",
  "function allTokens(uint256) external view returns (address)",
  "function getCount() external view returns (uint256)",
  "function getPrice(address addr) external view returns (uint256)",
  "function tokens(address) external view returns (address addr, address creator, uint256 supply, uint256 mcap, bool listed)",
  "function feeRecipient() external view returns (address)",
  
  // Write Functions
  "function createToken(string memory name, string memory symbol, string memory desc, string memory img) external payable returns (address)",
  "function buy(address tokenAddr) external payable",
  "function sell(address tokenAddr, uint256 amount) external",
  
  // Admin Functions
  "function setFee(address addr) external",
  "function withdraw() external",
];

export const MEME_TOKEN_ABI = [
  // Standard ERC20
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  
  // Custom Functions
  "function description() external view returns (string)",
  "function imageHash() external view returns (string)",
  "function tradingEnabled() external view returns (bool)",
  "function factory() external view returns (address)",
  "function burn(uint256 amount) external",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

// Helper functions
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatNumber = (num, decimals = 2) => {
  if (!num) return '0';
  const number = parseFloat(num);
  if (number < 1000) return number.toFixed(decimals);
  if (number < 1000000) return `${(number / 1000).toFixed(decimals)}K`;
  if (number < 1000000000) return `${(number / 1000000).toFixed(decimals)}M`;
  return `${(number / 1000000000).toFixed(decimals)}B`;
};

export const formatPrice = (price, decimals = 6) => {
  if (!price) return '0';
  const number = parseFloat(price);
  if (number < 0.000001) return number.toExponential(2);
  return number.toFixed(decimals);
};

export const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

// Get IPFS URL
export const getIPFSUrl = (hash, gateway = null) => {
  const ipfsGateway = gateway || CONTRACT_CONFIG.IPFS_GATEWAY;
  return `${ipfsGateway}${hash}`;
};

// Get time ago alias
export const getTimeAgo = formatTime;