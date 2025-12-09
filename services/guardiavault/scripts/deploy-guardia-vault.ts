const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { ethers } = hre;

/**
 * Deploy GuardiaVault smart contract
 * 
 * This script:
 * 1. Validates required environment variables
 * 2. Deploys the GuardiaVault contract (no constructor args)
 * 3. Logs deployment information including actual gas used
 * 4. Automatically verifies on Etherscan (if API key is set)
 * 5. Saves deployment data to deployments/sepolia-guardia-vault.json
 * 
 * Usage: npx hardhat run scripts/deploy-guardia-vault.ts --network sepolia
 * Or use: npm run deploy:vault
 */
async function main() {
  console.log("🚀 Starting GuardiaVault deployment...\n");

  try {
    // Check required environment variables
    const network = await ethers.provider.getNetwork();
    const networkName = network.name === "unknown" ? "sepolia" : network.name;
    
    if (networkName === "sepolia") {
      if (!process.env.SEPOLIA_RPC_URL) {
        console.error("❌ Error: SEPOLIA_RPC_URL not set in environment variables");
        console.log("Please add to your .env file:");
        console.log("SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY");
        process.exit(1);
      }
      
      if (!process.env.PRIVATE_KEY) {
        console.error("❌ Error: PRIVATE_KEY not set in environment variables");
        console.log("Please add to your .env file:");
        console.log("PRIVATE_KEY=your_wallet_private_key");
        process.exit(1);
      }
    }

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deploying with account:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    if (balance === 0n) {
      console.error("\n❌ Error: Deployer account has 0 ETH");
      console.log("Please fund your wallet with Sepolia ETH from a faucet:");
      console.log("- https://sepoliafaucet.com/");
      console.log("- https://www.alchemy.com/faucets/ethereum-sepolia");
      process.exit(1);
    }

    console.log("\n📦 Constructor Parameters:");
    console.log("   (None - GuardiaVault has no constructor arguments)\n");

    // Deploy contract
    console.log("🚀 Deploying GuardiaVault...");
    const GuardiaVault = await ethers.getContractFactory("GuardiaVault");
    const guardiaVault = await GuardiaVault.deploy();
    
    console.log("⏳ Waiting for deployment transaction...");
    await guardiaVault.waitForDeployment();
    const contractAddress = await guardiaVault.getAddress();
    const deployTx = guardiaVault.deploymentTransaction();
    
    const receipt = await deployTx?.wait();
    const gasUsed = receipt?.gasUsed || 0n;

    console.log("\n✅ GuardiaVault deployed successfully!");
    console.log("📍 Contract address:", contractAddress);
    console.log("🔗 Transaction hash:", deployTx?.hash);
    console.log("⛽ Gas used:", gasUsed.toString());
    
    if (deployTx?.blockNumber) {
      console.log("📦 Block number:", deployTx.blockNumber);
    }

    // Get network information
    const chainId = network.chainId.toString();

    // Prepare deployment data
    const deploymentInfo = {
      contractName: "GuardiaVault",
      contractAddress: contractAddress,
      network: networkName,
      chainId: chainId,
      deployer: deployer.address,
      transactionHash: deployTx?.hash,
      blockNumber: deployTx?.blockNumber,
      timestamp: new Date().toISOString(),
      constructorArgs: {},
      gasUsed: gasUsed.toString(),
      verified: false
    };

    // Save deployment info to network-specific file
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `${networkName}-guardia-vault.json`);
    fs.writeFileSync(
      deploymentFile,
      JSON.stringify(deploymentInfo, null, 2),
      "utf8"
    );

    console.log("\n💾 Deployment info saved to:", deploymentFile);

    // Verify on Etherscan if API key is set
    if (process.env.ETHERSCAN_API_KEY && networkName !== "hardhat" && networkName !== "localhost") {
      console.log("\n🔍 Verifying contract on Etherscan...");
      console.log("⏳ Waiting for 5 block confirmations...");
      
      try {
        // Wait for 5 confirmations
        await guardiaVault.deploymentTransaction()?.wait(5);
        
        console.log("⏳ Running verification...");
        await hre.run("verify:verify", {
          address: contractAddress,
          constructorArguments: [],
        });
        
        deploymentInfo.verified = true;
        fs.writeFileSync(
          deploymentFile,
          JSON.stringify(deploymentInfo, null, 2),
          "utf8"
        );
        
        console.log("✅ Contract verified on Etherscan!");
        console.log(`🔗 View at: https://${networkName}.etherscan.io/address/${contractAddress}`);
      } catch (error: any) {
        if (error.message.includes("Already Verified")) {
          console.log("ℹ️  Contract already verified on Etherscan");
          deploymentInfo.verified = true;
          fs.writeFileSync(
            deploymentFile,
            JSON.stringify(deploymentInfo, null, 2),
            "utf8"
          );
        } else {
          console.log("⚠️  Verification failed:", error.message);
          console.log("\nYou can manually verify later with:");
          console.log(`npx hardhat verify --network ${networkName} ${contractAddress}`);
        }
      }
    } else if (!process.env.ETHERSCAN_API_KEY) {
      console.log("\nℹ️  Skipping Etherscan verification (ETHERSCAN_API_KEY not set)");
      console.log("To enable automatic verification, add to your .env file:");
      console.log("ETHERSCAN_API_KEY=your_etherscan_api_key");
    }

    // Print summary
    console.log("\n" + "=".repeat(70));
    console.log("🎉 DEPLOYMENT SUMMARY");
    console.log("=".repeat(70));
    console.log("Contract:           GuardiaVault");
    console.log("Network:            " + networkName);
    console.log("Chain ID:           " + chainId);
    console.log("Contract Address:   " + contractAddress);
    console.log("Deployer:           " + deployer.address);
    console.log("Transaction Hash:   " + deployTx?.hash);
    console.log("Block Number:       " + deployTx?.blockNumber);
    console.log("Verified:           " + (deploymentInfo.verified ? "Yes" : "No"));
    console.log("=".repeat(70));

    // Frontend configuration instructions
    console.log("\n📋 FRONTEND CONFIGURATION:");
    console.log("=".repeat(70));
    console.log("Add to your .env file:");
    console.log(`VITE_VAULT_CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`VITE_CHAIN_ID=${chainId}`);
    console.log("=".repeat(70));

    // Next steps
    console.log("\n📝 NEXT STEPS:");
    console.log("=".repeat(70));
    console.log("1. Update frontend configuration with the contract address above");
    console.log("\n2. Test the deployment:");
    console.log("   - Create a vault with beneficiaries");
    console.log("   - Perform check-ins");
    console.log("   - Test vault status transitions");
    console.log("   - Add guardians and test attestations");
    console.log("\n3. Consider deploying SubscriptionEscrow:");
    console.log("   npm run deploy:escrow");
    console.log("=".repeat(70));

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exitCode = 1;
  }
}

// Execute deployment
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
