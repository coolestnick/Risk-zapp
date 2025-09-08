# How to Create Domain Listings for Sale

## Method 1: Using Remix IDE (Recommended)

1. **Go to Remix**: https://remix.ethereum.org
2. **Connect to Shardeum**: 
   - Add Shardeum network to MetaMask if not already added
   - Network Name: Shardeum Unstablenet
   - RPC URL: https://dapps.shardeum.org/
   - Chain ID: 8080
   - Currency Symbol: SHM

3. **Load Contract**:
   - Create new file: `ShardeumMarketplaceAdvanced.sol`
   - Paste the contract code from your contracts folder
   - Compile it

4. **Connect to Deployed Contract**:
   - Go to "Deploy & Run" tab
   - Select "Injected Provider - MetaMask" 
   - In "At Address" field, enter: `0x79DE87692Db8E9037a62de9a5beD988C3F15B045`
   - Click "At Address"

5. **Create Listing**:
   - Find `createListing` function
   - Parameters:
     - `name`: Your domain name (e.g., "crypto-king")
     - `price`: Price in Wei (e.g., "1000000000000000000" = 1 SHM)
   - Click "transact"
   - Confirm in MetaMask

## Method 2: Using Web3 Console (Advanced)

```javascript
// In browser console on your app
const price = ethers.utils.parseEther("5"); // 5 SHM
const tx = await window.marketplaceContract.createListing("crypto-king", price);
await tx.wait();
console.log("Listing created!");
```

## Price Conversion Helper

- 1 SHM = 1000000000000000000 Wei
- 0.1 SHM = 100000000000000000 Wei  
- 5 SHM = 5000000000000000000 Wei
- 10 SHM = 10000000000000000000 Wei

## After Creating Listing

1. Your domain will appear in the "Buy Now" tab
2. Other users can purchase it instantly
3. You'll receive payment (minus 2.5% marketplace fee)
4. Domain transfers automatically to buyer