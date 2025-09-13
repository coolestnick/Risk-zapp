import hre from "hardhat";
import fs from 'fs';

async function main() {
  console.log("Deploying ShardeumPump contracts to Shardeum Unstable Network...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy TokenFactory
  console.log("\n1. Deploying TokenFactory...");
  const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
  const tokenFactory = await TokenFactory.deploy(deployer.address); // Fee recipient is deployer
  await tokenFactory.deployed();
  
  console.log("TokenFactory deployed to:", tokenFactory.address);
  console.log("Fee recipient set to:", deployer.address);
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    tokenFactory: tokenFactory.address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };
  
  console.log("\n📋 Deployment Summary:");
  console.log("========================");
  console.log(`Network: ${deploymentInfo.network}`);
  console.log(`Chain ID: ${deploymentInfo.chainId}`);
  console.log(`TokenFactory: ${deploymentInfo.tokenFactory}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log(`Block Number: ${deploymentInfo.blockNumber}`);
  
  // Create .env file with deployment info
  const envContent = `
# Shardeum Pump Deployment Configuration
VITE_SHARDEUM_RPC_URL=https://api-unstable.shardeum.org
VITE_SHARDEUM_CHAIN_ID=8080
VITE_SHARDEUM_EXPLORER=https://explorer-unstable.shardeum.org
VITE_CONTRACT_ADDRESS=${deploymentInfo.tokenFactory}
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
VITE_WEBSOCKET_URL=wss://api-unstable.shardeum.org

# Private key for deployment (DO NOT COMMIT TO GIT)
PRIVATE_KEY=your_private_key_here
`;
  
  fs.writeFileSync('.env.example', envContent);
  
  console.log("\n✅ Deployment completed successfully!");
  console.log("📝 Environment file created: .env.example");
  console.log("🚀 You can now start the frontend with: npm run dev");
  
  // Verify contracts on explorer (if supported)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Verifying contracts on explorer...");
    try {
      await hre.run("verify:verify", {
        address: tokenFactory.address,
        constructorArguments: [deployer.address],
      });
      console.log("✅ TokenFactory verified successfully!");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });