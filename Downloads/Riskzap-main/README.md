# RiskZap - Decentralized Insurance Platform

> Simplifying insurance through blockchain technology on Shardeum Network

## 🌟 Overview

RiskZap is a revolutionary decentralized insurance platform that makes purchasing and managing insurance policies as simple as sending a text message. Built on the Shardeum blockchain, we're transforming the traditional insurance industry by eliminating intermediaries, reducing costs, and providing instant policy activation.

### 🔄 Unique Time-Based Premium Model

Unlike traditional insurance that only pays out for claims, RiskZap rewards policy holders for maintaining coverage through our innovative time-based return system:

- **Early Claims**: Minimal returns (0.5-15%) to discourage frivolous claims
- **Medium-Term Holdings**: Moderate returns (25-50%) for quarterly commitments  
- **Long-Term Holdings**: Substantial returns (75-100%) for annual commitments
- **Loyalty Rewards**: Bonus percentages (up to 20%) for multi-year holdings

This model creates a **win-win scenario**:
- Users can earn returns even without filing claims
- The platform maintains lower claim rates
- Long-term policy holders are rewarded for their commitment
- Insurance becomes both protection AND investment

## 🚀 Why RiskZap?

**For Users:**
- **Instant Policy Activation** - No waiting periods, your coverage starts immediately
- **Transparent Pricing** - All fees clearly displayed (2% purchase fee, 0.5% withdrawal fee)
- **Wallet Integration** - Seamless MetaMask connection for easy payments
- **Real-time Analytics** - Track your policies and claims in one dashboard
- **Time-Based Returns** - Earn increasing rewards the longer you hold policies (5-365+ days)
- **Flexible Durations** - Choose from 5, 30, 120, or 365-day coverage options
- **Investment Opportunity** - Policies act as both insurance and potential investment vehicles

**For the Industry:**
- **Cost Reduction** - Eliminate traditional insurance overhead
- **Fraud Prevention** - Blockchain immutability ensures claim authenticity
- **Global Accessibility** - Anyone with a wallet can purchase insurance
- **Smart Contracts** - Automated claim processing and payouts
- **Innovative Pricing** - Time-based premium returns encourage policy retention
- **Reduced Claims** - Higher returns for longer holdings discourage early claims

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Blockchain**: Shardeum Shardeum Unstablenet  (Chain ID: 8080)
- **Smart Contracts**: Solidity with OpenZeppelin standards
- **Wallet Integration**: MetaMask with ethers.js
- **Styling**: Tailwind CSS for modern UI/UX
- **Development**: Hardhat for contract deployment

## 📱 Key Features

### 🔐 Secure Wallet Connection
Connect your MetaMask wallet to the Shardeum network with automatic network detection and switching.

### 📋 Policy Management
- Browse available insurance policies
- Purchase policies with SHM tokens
- Track policy status and coverage details
- View transaction history on blockchain explorer

### 💰 Transparent Fee Structure
- **Purchase Fee**: 2% (sent to company wallet)
- **Withdrawal Fee**: 0.5% (for contract maintenance)
- **Network Fees**: Standard Shardeum gas fees

### ⏰ Premium Rates & Duration Options

RiskZap offers flexible policy durations with time-based premium returns that reward long-term policy holders:

#### 📅 Available Policy Durations
- **5 Day Coverage**: Short-term protection for events, travel, or temporary needs
- **30 Day Coverage**: Monthly protection ideal for equipment rentals or short trips
- **120 Day Coverage**: Quarterly coverage for seasonal activities or extended projects
- **365 Day Coverage**: Annual protection with maximum benefits and loyalty rewards

#### 💎 Time-Based Premium Returns
Our unique system rewards policy holders based on how long they maintain their coverage:

**Immediate Claims (Day 1)**
- 0.5% of premium paid
- Minimal coverage for same-day incidents

**Weekly Holdings (Days 2-7)**
- 5% base rate + 0.5% per day held
- Additional 0.1 SHM bonus per day
- Encourages short-term commitment

**Monthly Holdings (Days 8-30)**
- 10% base rate + 1% per week held
- Additional 0.5 SHM bonus per week
- Rewards monthly planning

**Quarterly Holdings (Days 31-90)**
- 25% base rate + 2% per month held
- Additional 1.0 SHM bonus per month
- Substantial returns for quarterly commitment

**Semi-Annual Holdings (Days 91-180)**
- 50% base rate + 3% per month held
- Additional 1.5 SHM bonus per month
- Significant rewards for extended coverage

**Annual Holdings (Days 181-365)**
- 75% base rate + 2% per month held
- Additional 2.0 SHM bonus per month
- Premium returns for yearly commitment

**Loyalty Program (365+ Days)**
- 100% base rate guaranteed
- 5% loyalty bonus per year held
- Maximum 120% total return (100% + 20% bonus cap)

#### 🎯 Premium Calculation Examples

**Device Protection Policy (0.5 SHM Premium)**
- Day 5 claim: ~0.04 SHM (7.5% rate)
- Day 30 claim: ~0.08 SHM (15% rate) 
- Day 120 claim: ~0.20 SHM (40% rate)
- Day 365 claim: ~0.45 SHM (90% rate)

**Health Insurance Policy (1.2 SHM Premium)**
- Day 5 claim: ~0.09 SHM (7.5% rate)
- Day 30 claim: ~0.18 SHM (15% rate)
- Day 120 claim: ~0.48 SHM (40% rate)
- Day 365 claim: ~1.08 SHM (90% rate)

**Travel Insurance Policy (2.0 SHM Premium)**
- Day 5 claim: ~0.15 SHM (7.5% rate)
- Day 30 claim: ~0.30 SHM (15% rate)
- Day 120 claim: ~0.80 SHM (40% rate)
- Day 365 claim: ~1.80 SHM (90% rate)

💡 **Pro Tip**: The longer you hold your policy without claiming, the higher your potential return becomes, making RiskZap both insurance and investment!

### 📊 Real-time Analytics
Monitor your insurance portfolio with live data including:
- Active policies count
- Total coverage amount
- Recent transactions
- Policy performance metrics
- Time-based return calculations
- Potential claim amounts based on holding period

## 🌐 Network Configuration

**Shardeum Unstablenet**
```
Network Name: Shardeum Unstablenet
RPC URL: https://api-unstable.shardeum.org
Chain ID: 8080
Currency Symbol: SHM
Block Explorer: https://explorer-unstable.shardeum.org/
```

## 🔌 API Configuration

RiskZap integrates with multiple APIs and services to provide a seamless insurance experience:

### Environment Variables
```bash
# Frontend API Configuration
VITE_API_BASE_URL=http://localhost:3001    # Backend API endpoint
VITE_SHM_CHAIN_ID=8080                     # Target blockchain network
VITE_DEMO_MODE=false                       # Demo mode toggle

# Shardeum Network APIs
SHARDEUM_RPC_URL=https://api-unstable.shardeum.org  # Blockchain RPC endpoint
```

### Blockchain API Integration
- **Shardeum RPC**: Direct blockchain interaction for transactions
- **Block Explorer API**: Transaction verification and history
- **MetaMask Provider**: Wallet connectivity and signing
- **Ethers.js**: Web3 library for smart contract interaction

### Smart Contract APIs
```javascript
// Contract interaction endpoints
- PolicyManager.purchasePolicy()     // Create new insurance policy
- PolicyManager.claimPolicy()        // Process insurance claims  
- ERC20Token.transfer()              // Handle SHM token transfers
- ERC20Token.balanceOf()            // Check wallet balances
```

### Data Storage APIs
- **LocalStorage**: Client-side policy data persistence
- **ActivityService**: Transaction logging and history
- **Real-time Updates**: Live activity feed with WebSocket-like updates

### Third-party Integrations
- **MetaMask API**: Wallet connection and transaction signing
- **Shardeum Explorer API**: Transaction verification
- **Network Status API**: Real-time blockchain metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MetaMask browser extension
- SHM tokens for transactions

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yashbalpande/Riskzap.git
   cd Riskzap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Update .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

### MetaMask Setup

1. Add Shardeum network to MetaMask using the configuration above
2. Import or fund your wallet with SHM tokens
3. Connect wallet to the RiskZap DApp
4. Start purchasing insurance policies!

## 📄 Smart Contracts

### Deployed Contracts on Shardeum

**ERC20 Mock Token (Test SHM)**
- Address: `0xaa2b86e1f9de4cbdeaf177e61ce0e2fc091f9f9e`
- [View on Explorer](https://explorer-unstable.shardeum.org/account/0xaa2b86e1f9de4cbdeaf177e61ce0e2fc091f9f9e)

**PolicyManager Contract**
- Address: `0x055682a1a8fa88ed10a56724d29bcd44215e04d5`
- [View on Explorer](https://explorer-unstable.shardeum.org/account/0x055682a1a8fa88ed10a56724d29bcd44215e04d5)

### Contract Features
- **ERC20 Integration** - Uses standard token transfers
- **Ownable Pattern** - Admin controls for policy management
- **Fee Collection** - Automated fee distribution
- **Event Logging** - Full transaction transparency

## 🏗️ Development

### Project Structure
```
src/
├── components/          # React components
├── contracts/          # Contract ABIs and configs
├── pages/             # Main application pages
└── services/          # Web3 and API services

contracts/             # Solidity smart contracts
scripts/              # Deployment scripts
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run deploy       # Deploy smart contracts
```

## 🛡️ Security Features

- **OpenZeppelin Standards** - Battle-tested smart contract libraries
- **Access Control** - Owner-only administrative functions
- **Input Validation** - Comprehensive parameter checking
- **Event Logging** - Full audit trail for all transactions
- **Network Verification** - Ensures correct chain interaction

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.
