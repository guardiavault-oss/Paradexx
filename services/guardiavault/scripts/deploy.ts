const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { ethers } = hre;

/**
 * Deploy GuardiaVault smart contract
 * 
 * This script:
 * 1. Deploys the GuardiaVault contract
 * 2. Logs deployment information
 * 3. Saves deployment data to deployments.json for frontend integration
 * 
 * Usage: npx hardhat run scripts/deploy.ts --network <network-name>
 */
async function main() {
  console.log("🚀 Starting GuardiaVault deployment...\n");

  try {
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📋 Deploying contracts with account:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

    // Deploy GuardiaVault contract
    console.log("📦 Deploying GuardiaVault contract...");
    const GuardiaVault = await ethers.getContractFactory("GuardiaVault");
    const guardiaVault = await GuardiaVault.deploy();
    
    await guardiaVault.waitForDeployment();
    const contractAddress = await guardiaVault.getAddress();

    console.log("✅ GuardiaVault deployed successfully!");
    console.log("📍 Contract address:", contractAddress);
    console.log("🔗 Transaction hash:", guardiaVault.deploymentTransaction()?.hash);
    console.log("⛽ Gas used:", guardiaVault.deploymentTransaction()?.gasLimit.toString());

    // Get network information
    const network = await ethers.provider.getNetwork();
    const networkName = network.name;
    const chainId = network.chainId.toString();

    // Prepare deployment data
    const deploymentData = {
      network: networkName,
      chainId: chainId,
      contractAddress: contractAddress,
      transactionHash: guardiaVault.deploymentTransaction()?.hash,
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      contractName: "GuardiaVault",
      blockNumber: guardiaVault.deploymentTransaction()?.blockNumber,
    };

    // Save deployment info to deployments.json
    const deploymentsDir = path.join(__dirname, "..");
    const deploymentsFile = path.join(deploymentsDir, "deployments.json");

    let allDeployments: Record<string, any> = {};
    
    // Read existing deployments if file exists
    if (fs.existsSync(deploymentsFile)) {
      const existingData = fs.readFileSync(deploymentsFile, "utf8");
      allDeployments = JSON.parse(existingData);
    }

    // Add or update deployment for this network
    if (!allDeployments[networkName]) {
      allDeployments[networkName] = {};
    }
    allDeployments[networkName].GuardiaVault = deploymentData;

    // Write updated deployments back to file
    fs.writeFileSync(
      deploymentsFile,
      JSON.stringify(allDeployments, null, 2),
      "utf8"
    );

    console.log("\n💾 Deployment info saved to deployments.json");
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Deployment Summary");
    console.log("=".repeat(60));
    console.log("Network:", networkName);
    console.log("Chain ID:", chainId);
    console.log("Contract:", contractAddress);
    console.log("Deployer:", deployer.address);
    console.log("=".repeat(60));

    // Verification instructions
    console.log("\n📝 Next Steps:");
    console.log("=".repeat(60));
    console.log("\n1. Verify contract on Etherscan (if on mainnet/testnet):");
    console.log(`   npx hardhat verify --network ${networkName} ${contractAddress}`);
    console.log("\n   Or use the verify script:");
    console.log(`   npx hardhat run scripts/verify.ts --network ${networkName}`);
    
    console.log("\n2. Update frontend .env with contract address:");
    console.log(`   VITE_GUARDIA_VAULT_ADDRESS=${contractAddress}`);
    
    console.log("\n3. Test the deployment:");
    console.log("   - Create a vault");
    console.log("   - Perform check-in");
    console.log("   - Test status transitions");
    console.log("\n" + "=".repeat(60));

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
