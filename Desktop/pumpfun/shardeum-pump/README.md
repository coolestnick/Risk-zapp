# ShardeumPump 🚀

A complete pump.fun clone built on the Shardeum Unstable Network. Create, trade, and discover meme tokens with fair launch mechanics and bonding curve pricing.

## 🌟 Features

- **Token Creation**: Launch meme tokens with custom names, symbols, descriptions, and images
- **Bonding Curve Trading**: Automated market maker with exponential price curves
- **Fair Launch Mechanics**: Equal opportunity for all participants
- **IPFS Integration**: Decentralized image and metadata storage
- **Real-time Updates**: Live price feeds and transaction tracking
- **Portfolio Management**: Track your token holdings and created tokens
- **Automatic DEX Listing**: Tokens graduate to Uniswap V2 when market cap threshold is reached
- **Mobile Responsive**: Works seamlessly across all devices

## 🛠 Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **ethers.js v6** for Web3 integration
- **Axios** for HTTP requests

### Backend
- **Solidity 0.8.19** smart contracts
- **Hardhat** for development and deployment
- **OpenZeppelin** for secure contract templates
- **IPFS/Pinata** for decentralized storage

### Blockchain
- **Shardeum Unstable Network**
- **Chain ID**: 8080
- **RPC**: https://api-unstable.shardeum.org
- **Explorer**: https://explorer-unstable.shardeum.org

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MetaMask wallet
- Some SHM tokens for gas fees

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Required for deployment
   PRIVATE_KEY=your_wallet_private_key_here
   
   # Optional IPFS configuration (for image uploads)
   VITE_PINATA_JWT=your_pinata_jwt_here
   VITE_PINATA_API_KEY=your_pinata_api_key_here
   VITE_PINATA_SECRET_KEY=your_pinata_secret_key_here
   ```

3. **Compile smart contracts**
   ```bash
   npm run compile
   ```

4. **Deploy to Shardeum Unstable**
   ```bash
   npm run deploy
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📋 Smart Contracts

### TokenFactory.sol
Main factory contract that handles:
- Token creation with bonding curve mechanics
- Buy/sell functionality
- Fee collection (1% platform fee)
- Automatic DEX listing at 50 ETH market cap threshold

### MemeToken.sol
ERC-20 token contract with:
- Standard ERC-20 functionality
- Metadata storage (IPFS hash)
- Trading restrictions during bonding curve phase
- Burn functionality

### BondingCurve.sol
Library for bonding curve calculations:
- Exponential pricing formula: `price = basePrice * (supply^2)`
- Buy/sell price calculations with slippage protection
- Market cap calculations

## 🔧 Usage

### Creating a Token
1. Connect your MetaMask wallet to Shardeum network
2. Navigate to "Create Token"
3. Fill in token details (name, symbol, description)
4. Upload an image (PNG, JPG, GIF up to 5MB)
5. Optionally set an initial buy amount
6. Review and deploy

### Trading Tokens
1. Browse tokens on the homepage
2. Click on a token to view details
3. Use the buy/sell interface to trade
4. Transactions are processed through the bonding curve until DEX listing

### Portfolio Management
1. View your token holdings in the Portfolio section
2. Track tokens you've created
3. Monitor performance and market caps

## 🔐 Security Features

- **Reentrancy Protection**: All state-changing functions protected
- **Access Controls**: Owner and factory restrictions
- **Input Validation**: Comprehensive validation on all inputs
- **Slippage Protection**: Maximum buy limits and price impact warnings
- **Audited Libraries**: Uses OpenZeppelin contracts

## ⚠️ Disclaimer

This software is provided "as is" for educational and demonstration purposes. Always conduct thorough testing and security audits before using in production. Cryptocurrency trading involves significant risks.

---

**Built with ❤️ on Shardeum Network**
