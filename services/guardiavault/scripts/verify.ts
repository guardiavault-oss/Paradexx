import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Verify deployed GuardiaVault contract on Etherscan
 * 
 * This script:
 * 1. Reads deployment address from deployments.json
 * 2. Verifies the contract on Etherscan using hardhat-etherscan
 * 3. Handles verification errors gracefully
 * 
 * Usage: npx hardhat run scripts/verify.ts --network <network-name>
 * 
 * Requirements:
 * - Contract must be deployed (deployments.json must exist)
 * - ETHERSCAN_API_KEY must be set in .env
 * - Network must be supported by Etherscan
 */
async function main() {
  console.log("🔍 Starting contract verification...\n");

  try {
    // Get network name from hardhat config
    const network = await run("network", { quiet: true });
    const networkName = network.name;

    console.log("📋 Network:", networkName);

    // Read deployments.json
    const deploymentsFile = path.join(__dirname, "..", "deployments.json");

    if (!fs.existsSync(deploymentsFile)) {
      console.error("❌ Error: deployments.json not found!");
      console.error("   Please deploy the contract first using:");
      console.error(`   npx hardhat run scripts/deploy.ts --network ${networkName}`);
      process.exitCode = 1;
      return;
    }

    const deploymentsData = fs.readFileSync(deploymentsFile, "utf8");
    const deployments = JSON.parse(deploymentsData);

    // Check if deployment exists for this network
    if (!deployments[networkName]) {
      console.error(`❌ Error: No deployment found for network "${networkName}"`);
      console.error("   Available networks:", Object.keys(deployments).join(", "));
      process.exitCode = 1;
      return;
    }

    if (!deployments[networkName].GuardiaVault) {
      console.error(`❌ Error: GuardiaVault contract not deployed on "${networkName}"`);
      process.exitCode = 1;
      return;
    }

    const contractAddress = deployments[networkName].GuardiaVault.contractAddress;
    console.log("📍 Contract address:", contractAddress);
    console.log("\n⏳ Verifying contract on Etherscan...\n");

    // Verify the contract
    // GuardiaVault has no constructor arguments, so we pass an empty array
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });

    console.log("\n✅ Contract verified successfully!");
    console.log("🔗 View on Etherscan:");
    
    // Generate Etherscan URL based on network
    let etherscanUrl = "";
    switch (networkName) {
      case "mainnet":
        etherscanUrl = `https://etherscan.io/address/${contractAddress}`;
        break;
      case "sepolia":
        etherscanUrl = `https://sepolia.etherscan.io/address/${contractAddress}`;
        break;
      case "goerli":
        etherscanUrl = `https://goerli.etherscan.io/address/${contractAddress}`;
        break;
      case "polygon":
        etherscanUrl = `https://polygonscan.com/address/${contractAddress}`;
        break;
      case "polygonMumbai":
        etherscanUrl = `https://mumbai.polygonscan.com/address/${contractAddress}`;
        break;
      default:
        etherscanUrl = `Contract verified on network: ${networkName}`;
    }

    console.log("   ", etherscanUrl);

  } catch (error: any) {
    // Handle specific verification errors
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  Contract is already verified!");
    } else if (error.message.includes("ETHERSCAN_API_KEY")) {
      console.error("\n❌ Error: ETHERSCAN_API_KEY not set");
      console.error("   Please add your Etherscan API key to .env:");
      console.error("   ETHERSCAN_API_KEY=your_api_key_here");
      console.error("\n   Get your API key from: https://etherscan.io/myapikey");
    } else if (error.message.includes("does not support verify")) {
      console.error("\n❌ Error: This network does not support Etherscan verification");
      console.error("   Verification is only available for public networks like:");
      console.error("   - Ethereum Mainnet");
      console.error("   - Sepolia");
      console.error("   - Polygon");
      console.error("   - etc.");
    } else {
      console.error("\n❌ Verification failed:");
      console.error(error.message);
      
      if (error.message.includes("Reason: Already Verified")) {
        console.log("\nℹ️  Note: Contract is already verified");
      } else {
        console.error("\n💡 Troubleshooting tips:");
        console.error("   1. Wait a few minutes after deployment before verifying");
        console.error("   2. Ensure ETHERSCAN_API_KEY is set in .env");
        console.error("   3. Check that the network is supported by Etherscan");
        console.error("   4. Verify the contract was deployed successfully");
      }
    }
    
    process.exitCode = 1;
  }
}

// Execute verification
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
