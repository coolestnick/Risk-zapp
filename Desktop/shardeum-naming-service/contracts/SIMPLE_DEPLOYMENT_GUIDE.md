# Simple Deployment Guide - Shardeum Naming Service

## Step-by-Step Deployment Instructions

### Prerequisites
1. Open [Remix IDE](https://remix.ethereum.org)
2. MetaMask connected to Shardeum Unstablenet
3. Some test SHM tokens

### Step 1: Deploy the Registry Contract

1. **Create the contract file:**
   - In Remix, create a new file: `ShardeumRegistry.sol`
   - Copy the entire contents of `ShardeumRegistry_Simple.sol`

2. **Compile:**
   - Select Solidity version: `0.8.19`
   - Click "Compile ShardeumRegistry.sol"
   - Should compile without errors

3. **Deploy:**
   - Go to "Deploy & Run Transactions" tab
   - Environment: "Injected Provider - MetaMask"
   - Contract: "ShardeumRegistry"
   - Click "Deploy"
   - Confirm transaction in MetaMask

4. **Save the address:**
   - Copy the deployed contract address
   - Example: `0x2F65232f7803A313B4E1761692B5189b76f0f6B7`

### Step 2: Test the Registry Contract

Test these functions to make sure it works:

1. **Register a domain:**
   ```
   Function: register
   Parameters: 
   - name: "test"
   - duration: 31536000 (1 year in seconds)
   Value: 0.1 SHM
   ```

2. **Check if available:**
   ```
   Function: isAvailable
   Parameters:
   - name: "test"
   Should return: false (after registration)
   ```

3. **Get domain info:**
   ```
   Function: getDomain
   Parameters:
   - name: "test"
   Returns: owner, expiry, isForSale, price, isPremium
   ```

### Step 3: Deploy the Marketplace Contract (Optional)

1. **Create the contract file:**
   - In Remix, create a new file: `ShardeumMarketplace.sol`
   - Copy the entire contents of `ShardeumMarketplace_Simple.sol`

2. **Compile and Deploy:**
   - Compile with Solidity 0.8.19
   - When deploying, provide the Registry contract address as parameter
   - Example: `0x1234...5678` (your registry address)

### Step 4: Configure Frontend

1. Update `frontend/src/config.js`:
```javascript
export const CONTRACT_ADDRESS = '0xYourRegistryAddress';

export const CONTRACT_ABI = [
  // Copy the ABI from Remix compilation details
  // Go to your compiled contract > Compilation Details > Copy ABI
];
```

### Step 5: Get Contract ABI

1. In Remix, go to your compiled contract
2. Scroll down to "Compilation Details"
3. Click on your contract name
4. Copy the ABI section
5. Paste it into the frontend config

### Troubleshooting

**If deployment fails:**
- Make sure you're on Shardeum Unstablenet (Chain ID: 8080)
- Ensure you have enough SHM for gas
- Try increasing gas limit manually

**If contract doesn't work:**
- Check the deployed address is correct
- Verify the ABI is properly copied
- Make sure MetaMask is connected

### Contract Features

**Registry Contract includes:**
- Domain registration (1-10 years)
- Domain transfer
- Simple record storage
- Domain marketplace (buy/sell)
- Premium names
- Domain renewal

**Marketplace Contract includes:**
- Domain auctions
- Offer system
- Fee collection
- Bid management

### Important Notes

1. **Deploy Registry FIRST** - It's completely independent
2. **Registry contract address** is needed for Marketplace deployment
3. **Base price** is set to 0.1 SHM per year
4. **Premium domains** cost 10x more
5. **Short domains** cost more (1 char = 1000x, 2 char = 500x, etc.)

### Frontend Integration

After deployment, your frontend will be able to:
- Search and register domains
- Display user's domains
- Handle transfers and renewals
- Show domain marketplace

The contracts are now simplified and should deploy without any "abstract contract" errors!