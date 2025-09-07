const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Advanced Shardeum Marketplace...");

  // Get the registry contract address (update this with your actual registry address)
  const REGISTRY_ADDRESS = "0x2F65232f7803A313B4E1761692B5189b76f0f6B7"; // Update this

  // Deploy the marketplace contract
  const ShardeumMarketplaceAdvanced = await ethers.getContractFactory("ShardeumMarketplaceAdvanced");
  const marketplace = await ShardeumMarketplaceAdvanced.deploy(REGISTRY_ADDRESS);
  await marketplace.deployed();

  console.log("✅ Advanced Marketplace deployed to:", marketplace.address);
  console.log("📋 Registry contract:", REGISTRY_ADDRESS);
  console.log("💰 Marketplace fee:", await marketplace.marketplaceFee(), "basis points (2.5%)");
  console.log("👤 Fee recipient:", await marketplace.feeRecipient());

  // Verify contract on block explorer (if available)
  console.log("\n🔍 To verify on block explorer:");
  console.log(`npx hardhat verify --network shardeum-unstable ${marketplace.address} ${REGISTRY_ADDRESS}`);

  console.log("\n📝 Update your frontend config with:");
  console.log("MARKETPLACE_ADDRESS =", `"${marketplace.address}"`);
  
  return marketplace.address;
}

main()
  .then((address) => {
    console.log("🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });