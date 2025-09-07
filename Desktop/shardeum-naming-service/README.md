# Shardeum Naming Service (.shm)

A revolutionary decentralized naming service for the Shardeum blockchain, allowing users to register human-readable .shm domains. This DApp features a stunning glassmorphism UI with 3D animations and a seamless Web3 experience.

![Shardeum Naming Service](https://img.shields.io/badge/Shardeum-Naming%20Service-purple)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### Core Functionality
- **Domain Registration**: Register .shm domains with customizable lease periods (1-10 years)
- **Address Resolution**: Map .shm names to Shardeum wallet addresses
- **Reverse Resolution**: Map addresses back to primary .shm names
- **Domain Management**: Transfer, renew, and manage your domains
- **Dynamic Pricing**: Length-based pricing with premium name support
- **Subdomain Support**: Create and manage subdomains

### Advanced Features
- **Marketplace**: Buy and sell domains with built-in escrow
- **Auction System**: Bid on premium and expired domains
- **Profile System**: Rich profiles linked to .shm domains
- **Social Integration**: Link social media accounts to your domain
- **Bulk Operations**: Register multiple domains at once

### UI/UX Highlights
- **Glassmorphism Design**: Stunning translucent UI elements
- **3D Animations**: Floating cards and particle effects
- **Neon Accents**: Electric blue/purple highlights
- **Dark Theme**: Space-like aesthetic with constellation patterns
- **Responsive Design**: Perfect on desktop and mobile
- **Smooth Transitions**: Every interaction is carefully animated

## Tech Stack

- **Blockchain**: Shardeum Unstablenet
- **Smart Contracts**: Solidity 0.8.19
- **Frontend**: React.js with JavaScript
- **Styling**: Custom CSS with glassmorphism effects
- **Web3**: Ethers.js
- **Animations**: Framer Motion
- **State Management**: React Hooks
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites
- Node.js 14+ and npm
- MetaMask wallet
- Test SHM tokens on Shardeum Unstablenet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shardeum-naming-service.git
cd shardeum-naming-service
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Deploy Smart Contracts:
   - Follow the instructions in `contracts/DEPLOYMENT_INSTRUCTIONS.md`
   - Deploy using Remix IDE to Shardeum Unstablenet
   - Copy the contract address and ABI

4. Configure the frontend:
   - Open `frontend/src/config.js`
   - Add your contract address and ABI

5. Start the development server:
```bash
npm start
```

6. Open http://localhost:3000 in your browser

## Smart Contract Deployment

### Using Remix IDE

1. Open [Remix IDE](https://remix.ethereum.org)
2. Create new files and copy the contracts from the `contracts/` directory
3. Compile with Solidity 0.8.19
4. Connect MetaMask to Shardeum Unstablenet
5. Deploy ShardeumRegistry first
6. Deploy ShardeumMarketplace with the Registry address
7. Copy the deployed addresses and ABIs

### Network Configuration

Add Shardeum Unstablenet to MetaMask:
- **Network Name**: Shardeum Unstablenet
- **RPC URL**: https://api-unstable.shardeum.org
- **Chain ID**: 8080
- **Currency Symbol**: SHM
- **Explorer**: https://explorer-unstable.shardeum.org/

## Usage

### Registering a Domain

1. Connect your MetaMask wallet
2. Search for an available domain name
3. Select registration duration (1-10 years)
4. Confirm the transaction
5. Your domain is now registered!

### Managing Domains

- View all your domains in the dashboard
- Set records (wallet address, social links, etc.)
- Transfer domains to other addresses
- List domains for sale on the marketplace
- Renew domains before expiration

### Marketplace

- Browse domains for sale
- Make offers on domains
- Create auctions for your domains
- Participate in domain auctions

## Project Structure

```
shardeum-naming-service/
├── contracts/
│   ├── ShardeumRegistry.sol      # Main registry contract
│   ├── ShardeumMarketplace.sol   # Marketplace contract
│   └── DEPLOYMENT_INSTRUCTIONS.md # Deployment guide
├── frontend/
│   ├── public/                   # Static files
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Hero.js         # Landing section
│   │   │   ├── Navbar.js       # Navigation
│   │   │   ├── DomainCard.js   # Domain display
│   │   │   └── ...
│   │   ├── App.js              # Main app component
│   │   ├── config.js           # Contract configuration
│   │   └── index.css           # Global styles
│   └── package.json
└── README.md
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- Smart contracts should be audited before mainnet deployment
- Never commit private keys or sensitive data
- Use environment variables for configuration
- Test thoroughly on testnet before mainnet

## Roadmap

- [ ] Mobile app development
- [ ] Multi-chain support
- [ ] NFT avatar integration
- [ ] DAO governance
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Shardeum team for the amazing blockchain
- OpenZeppelin for secure contract libraries
- The Web3 community for inspiration

## Contact

- Website: [yourwebsite.com](https://yourwebsite.com)
- Twitter: [@yourhandle](https://twitter.com/yourhandle)
- Discord: [Join our server](https://discord.gg/yourserver)

---

Built with ❤️ for the Shardeum ecosystem