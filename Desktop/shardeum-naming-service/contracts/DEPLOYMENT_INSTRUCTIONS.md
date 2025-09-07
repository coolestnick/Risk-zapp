# Shardeum Naming Service - Smart Contract Deployment Instructions

## Prerequisites
- Remix IDE (https://remix.ethereum.org)
- MetaMask wallet configured for Shardeum Unstablenet
- Some test SHM tokens for deployment

## Shardeum Unstablenet Configuration
Add this network to MetaMask:
- Network Name: Shardeum Unstablenet
- RPC URL: https://api-unstable.shardeum.org
- Chain ID: 8080
- Currency Symbol: SHM
- Block Explorer URL: https://explorer-unstable.shardeum.org/

## Deployment Steps

### 1. Deploy ShardeumRegistry Contract
1. Open Remix IDE
2. Create a new file called `ShardeumRegistry.sol`
3. Copy the entire contents of `contracts/ShardeumRegistry.sol`
4. Compile with Solidity version 0.8.19
5. In the Deploy tab:
   - Environment: "Injected Provider - MetaMask"
   - Ensure you're on Shardeum Unstablenet
   - Deploy the contract
6. Save the deployed contract address

### 2. Deploy ShardeumMarketplace Contract
1. Create a new file called `ShardeumMarketplace.sol`
2. Copy the entire contents of `contracts/ShardeumMarketplace.sol`
3. Compile with Solidity version 0.8.19
4. In the Deploy tab:
   - Constructor parameter: Enter the ShardeumRegistry contract address
   - Deploy the contract
5. Save the deployed contract address

### 3. After Deployment
1. Copy the contract addresses
2. In Remix, go to each deployed contract and copy:
   - The ABI (under Compilation Details)
   - The Bytecode (under Compilation Details)
3. Provide these to configure the frontend:
   - ShardeumRegistry address
   - ShardeumRegistry ABI
   - ShardeumMarketplace address
   - ShardeumMarketplace ABI

## Contract Interaction (Testing)
After deployment, you can test the contracts:

1. **Register a domain:**
   - Call `register("yourname", 31536000)` with 0.1 SHM value (1 year = 31536000 seconds)

2. **Set records:**
   - Call `setRecord("yourname", "website", "https://example.com")`

3. **Check domain:**
   - Call `getDomain("yourname")` to verify ownership

## Important Notes
- The base price is set to 0.1 SHM per year
- Premium names cost 10x more
- Single character domains cost 1000x base price
- Marketplace fee is 2.5% of sale price