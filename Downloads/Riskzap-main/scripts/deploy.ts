import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🚀 Starting deployment check for Shardeum Liberty 1.X...');
  
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ Please set PRIVATE_KEY in your .env file');
    console.log('ℹ️  You can get your private key from MetaMask:');
    console.log('   1. Open MetaMask');
    console.log('   2. Click on Account Details');
    console.log('   3. Click Export Private Key');
    console.log('   4. Add it to .env file as: PRIVATE_KEY=your_key_without_0x');
    process.exit(1);
  }

  // Connect to Shardeum Liberty 1.X - try multiple RPC endpoints
  const rpcUrls = [
    process.env.SHARDEUM_RPC_URL || 'https://api-testnet.shardeum.org/',
    'https://api-testnet.shardeum.org/',
    'https://api-unstable.shardeum.org',
    'https://dapps.shardeum.org/'
  ];
  
  let provider;
  let connected = false;
  
  for (const rpcUrl of rpcUrls) {
    try {
      console.log(`🔗 Trying RPC: ${rpcUrl}`);
      provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // Test the connection
      const blockNumber = await provider.getBlockNumber();
      console.log(`✅ Connected! Latest block: ${blockNumber}`);
      connected = true;
      break;
    } catch (error) {
      console.log(`❌ Failed to connect to ${rpcUrl}`);
      continue;
    }
  }
  
  if (!connected) {
    console.error('❌ Could not connect to any Shardeum RPC endpoint');
    process.exit(1);
  }
  
  const wallet = new ethers.Wallet(`0x${process.env.PRIVATE_KEY}`, provider);
  
  console.log('📋 Deployer address:', wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Deployer balance:', ethers.utils.formatEther(balance), 'SHM');
  
  if (balance.isZero()) {
    console.error('❌ Insufficient balance! Please fund your wallet with SHM tokens');
    console.log('🚰 Get testnet SHM from: https://faucet.shardeum.org/');
    console.log('📋 Send SHM to this address:', wallet.address);
    process.exit(1);
  }

  // Check network
  const network = await provider.getNetwork();
  console.log('🌐 Connected to network:', network.name, 'Chain ID:', network.chainId);
  
  if (network.chainId !== 8080) {
    console.warn('⚠️  Warning: Expected Shardeum Unstablenet (Chain ID: 8080)');
  }

  console.log('\n✅ Deployment prerequisites check completed!');
  console.log('📝 Deployer wallet:', wallet.address);
  console.log('💳 Balance:', ethers.utils.formatEther(balance), 'SHM');
  console.log('🌐 Network: Shardeum Liberty 1.X');
  
  console.log('\n📋 Next steps to deploy contracts:');
  console.log('1. ✅ Wallet funded with SHM');
  console.log('2. ❌ Compile contracts: npx hardhat compile');
  console.log('3. ❌ Deploy contracts: npx hardhat run scripts/deploy.ts --network shardeum-unstablenet');
  
  console.log('\n� Alternative: Manual deployment without Hardhat (coming in next step)');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  });
