const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { ethers } = hre;

/**
 * Deploy all GuardiaVault smart contracts
 * 
 * This script:
 * 1. Validates required environment variables
 * 2. Deploys SubscriptionEscrow (with deployer as initial platform address)
 * 3. Deploys GuardiaVault
 * 4. Automatically verifies both contracts on Etherscan (if API key is set)
 * 5. Saves combined deployment data to deployments/sepolia-all-contracts.json
 * 6. Displays summary table with addresses
 * 
 * Usage: npx hardhat run scripts/deploy-all.ts --network sepolia
 * Or use: npm run deploy:sepolia
 */
async function main() {
  console.log("🚀 Starting full GuardiaVault platform deployment...\n");
  console.log("This will deploy:");
  console.log("  1. SubscriptionEscrow");
  console.log("  2. GuardiaVault\n");

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
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");
    
    if (balance === 0n) {
      console.error("❌ Error: Deployer account has 0 ETH");
      console.log("Please fund your wallet with Sepolia ETH from a faucet:");
      console.log("- https://sepoliafaucet.com/");
      console.log("- https://www.alchemy.com/faucets/ethereum-sepolia");
      process.exit(1);
    }

    const chainId = network.chainId.toString();
    const deployments: any = {
      network: networkName,
      chainId: chainId,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {}
    };

    // ============================================================
    // 1. Deploy SubscriptionEscrow
    // ============================================================
    console.log("=".repeat(70));
    console.log("📦 STEP 1/2: Deploying SubscriptionEscrow");
    console.log("=".repeat(70));
    
    const platformAddress = deployer.address;
    console.log("Platform Address (initial):", platformAddress);
    console.log("(Set to deployer - update later via setPlatform() if needed)\n");

    console.log("🚀 Deploying SubscriptionEscrow...");
    const SubscriptionEscrow = await ethers.getContractFactory("SubscriptionEscrow");
    const subscriptionEscrow = await SubscriptionEscrow.deploy(platformAddress);
    
    console.log("⏳ Waiting for deployment...");
    await subscriptionEscrow.waitForDeployment();
    const escrowAddress = await subscriptionEscrow.getAddress();
    const escrowTx = subscriptionEscrow.deploymentTransaction();
    
    const escrowReceipt = await escrowTx?.wait();
    const escrowGasUsed = escrowReceipt?.gasUsed || 0n;

    console.log("✅ SubscriptionEscrow deployed!");
    console.log("   Address:", escrowAddress);
    console.log("   TX Hash:", escrowTx?.hash);
    console.log("   Block:", escrowTx?.blockNumber);
    console.log("   Gas Used:", escrowGasUsed.toString());

    deployments.contracts.SubscriptionEscrow = {
      contractName: "SubscriptionEscrow",
      contractAddress: escrowAddress,
      transactionHash: escrowTx?.hash,
      blockNumber: escrowTx?.blockNumber,
      constructorArgs: {
        platformAddress: platformAddress
      },
      gasUsed: escrowGasUsed.toString(),
      verified: false
    };

    // ============================================================
    // 2. Deploy GuardiaVault
    // ============================================================
    console.log("\n" + "=".repeat(70));
    console.log("📦 STEP 2/2: Deploying GuardiaVault");
    console.log("=".repeat(70));

    console.log("🚀 Deploying GuardiaVault...");
    const GuardiaVault = await ethers.getContractFactory("GuardiaVault");
    const guardiaVault = await GuardiaVault.deploy();
    
    console.log("⏳ Waiting for deployment...");
    await guardiaVault.waitForDeployment();
    const vaultAddress = await guardiaVault.getAddress();
    const vaultTx = guardiaVault.deploymentTransaction();
    
    const vaultReceipt = await vaultTx?.wait();
    const vaultGasUsed = vaultReceipt?.gasUsed || 0n;

    console.log("✅ GuardiaVault deployed!");
    console.log("   Address:", vaultAddress);
    console.log("   TX Hash:", vaultTx?.hash);
    console.log("   Block:", vaultTx?.blockNumber);
    console.log("   Gas Used:", vaultGasUsed.toString());

    deployments.contracts.GuardiaVault = {
      contractName: "GuardiaVault",
      contractAddress: vaultAddress,
      transactionHash: vaultTx?.hash,
      blockNumber: vaultTx?.blockNumber,
      constructorArgs: {},
      gasUsed: vaultGasUsed.toString(),
      verified: false
    };

    // ============================================================
    // Save deployment info
    // ============================================================
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `${networkName}-all-contracts.json`);
    fs.writeFileSync(
      deploymentFile,
      JSON.stringify(deployments, null, 2),
      "utf8"
    );

    console.log("\n💾 Combined deployment info saved to:", deploymentFile);

    // ============================================================
    // Verify contracts on Etherscan
    // ============================================================
    if (process.env.ETHERSCAN_API_KEY && networkName !== "hardhat" && networkName !== "localhost") {
      console.log("\n" + "=".repeat(70));
      console.log("🔍 Verifying contracts on Etherscan");
      console.log("=".repeat(70));
      console.log("⏳ Waiting for 5 block confirmations...\n");
      
      try {
        // Verify SubscriptionEscrow
        console.log("1. Verifying SubscriptionEscrow...");
        await subscriptionEscrow.deploymentTransaction()?.wait(5);
        
        try {
          await hre.run("verify:verify", {
            address: escrowAddress,
            constructorArguments: [platformAddress],
          });
          deployments.contracts.SubscriptionEscrow.verified = true;
          console.log("   ✅ SubscriptionEscrow verified!");
        } catch (error: any) {
          if (error.message.includes("Already Verified")) {
            console.log("   ℹ️  Already verified");
            deployments.contracts.SubscriptionEscrow.verified = true;
          } else {
            console.log("   ⚠️  Verification failed:", error.message);
          }
        }

        // Verify GuardiaVault
        console.log("\n2. Verifying GuardiaVault...");
        await guardiaVault.deploymentTransaction()?.wait(5);
        
        try {
          await hre.run("verify:verify", {
            address: vaultAddress,
            constructorArguments: [],
          });
          deployments.contracts.GuardiaVault.verified = true;
          console.log("   ✅ GuardiaVault verified!");
        } catch (error: any) {
          if (error.message.includes("Already Verified")) {
            console.log("   ℹ️  Already verified");
            deployments.contracts.GuardiaVault.verified = true;
          } else {
            console.log("   ⚠️  Verification failed:", error.message);
          }
        }

        // Update deployment file with verification status
        fs.writeFileSync(
          deploymentFile,
          JSON.stringify(deployments, null, 2),
          "utf8"
        );
        
      } catch (error) {
        console.log("⚠️  Verification process encountered errors");
        console.log("\nYou can manually verify later:");
        console.log(`npx hardhat verify --network ${networkName} ${escrowAddress} "${platformAddress}"`);
        console.log(`npx hardhat verify --network ${networkName} ${vaultAddress}`);
      }
    } else if (!process.env.ETHERSCAN_API_KEY) {
      console.log("\nℹ️  Skipping Etherscan verification (ETHERSCAN_API_KEY not set)");
    }

    // ============================================================
    // Print Summary Table
    // ============================================================
    console.log("\n" + "=".repeat(70));
    console.log("🎉 DEPLOYMENT COMPLETE - SUMMARY");
    console.log("=".repeat(70));
    console.log(`Network:          ${networkName}`);
    console.log(`Chain ID:         ${chainId}`);
    console.log(`Deployer:         ${deployer.address}`);
    console.log(`Timestamp:        ${deployments.timestamp}`);
    console.log("=".repeat(70));
    console.log("\n📋 CONTRACT ADDRESSES:");
    console.log("=".repeat(70));
    
    const contracts = [
      {
        name: "SubscriptionEscrow",
        address: escrowAddress,
        verified: deployments.contracts.SubscriptionEscrow.verified ? "✅" : "⏳"
      },
      {
        name: "GuardiaVault",
        address: vaultAddress,
        verified: deployments.contracts.GuardiaVault.verified ? "✅" : "⏳"
      }
    ];

    contracts.forEach((contract, i) => {
      console.log(`${i + 1}. ${contract.name}`);
      console.log(`   Address:   ${contract.address}`);
      console.log(`   Verified:  ${contract.verified}`);
      if (networkName === "sepolia") {
        console.log(`   Etherscan: https://sepolia.etherscan.io/address/${contract.address}`);
      }
      console.log("");
    });

    console.log("=".repeat(70));

    // ============================================================
    // Frontend Configuration
    // ============================================================
    console.log("\n📋 FRONTEND CONFIGURATION:");
    console.log("=".repeat(70));
    console.log("Add these to your .env file:\n");
    console.log(`VITE_ESCROW_CONTRACT_ADDRESS=${escrowAddress}`);
    console.log(`VITE_VAULT_CONTRACT_ADDRESS=${vaultAddress}`);
    console.log(`VITE_CHAIN_ID=${chainId}`);
    console.log(`VITE_NETWORK_NAME=${networkName}`);
    console.log("=".repeat(70));

    // ============================================================
    // Next Steps
    // ============================================================
    console.log("\n📝 NEXT STEPS:");
    console.log("=".repeat(70));
    console.log("1. Update your frontend .env with the addresses above");
    console.log("\n2. Update platform address in SubscriptionEscrow (if needed):");
    console.log(`   - Current platform address: ${platformAddress}`);
    console.log("   - Call setPlatform() if you need a different address");
    console.log("\n3. Test the contracts:");
    console.log("   - Create a subscription in SubscriptionEscrow");
    console.log("   - Create a vault in GuardiaVault");
    console.log("   - Test check-ins and status transitions");
    console.log("\n4. Configure your frontend to interact with both contracts");
    console.log("=".repeat(70));

    console.log("\n✨ Deployment successful! All contracts are ready to use.\n");

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
