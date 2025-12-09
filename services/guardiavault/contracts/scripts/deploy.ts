/**
 * Smart Contract Deployment Script
 * Deploys GuardiaVault contract to specified network
 */

import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

interface DeploymentConfig {
  network: string;
  rpcUrl: string;
  privateKey: string;
  contractAddress?: string;
}

async function deployContract(config: DeploymentConfig) {
  console.log(`🚀 Deploying to ${config.network}...`);

  // Initialize provider and wallet
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);

  console.log(`📝 Deployer address: ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance for deployment");
  }

  // Load contract ABI and bytecode
  // In production, compile contracts first using Hardhat/Truffle
  const contractArtifact = loadContractArtifact("GuardiaVault");
  
  if (!contractArtifact) {
    throw new Error("Contract artifact not found. Run 'pnpm run compile' first.");
  }

  // Deploy contract
  const factory = new ethers.ContractFactory(
    contractArtifact.abi,
    contractArtifact.bytecode,
    wallet
  );

  console.log("📦 Deploying contract...");
  const contract = await factory.deploy();

  console.log(`⏳ Transaction hash: ${contract.deploymentTransaction()?.hash}`);
  console.log("⏳ Waiting for deployment...");

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(`✅ Contract deployed at: ${address}`);

  // Save deployment info
  saveDeploymentInfo(config.network, {
    address,
    txHash: contract.deploymentTransaction()?.hash || "",
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
  });

  return address;
}

function loadContractArtifact(name: string) {
  try {
    const artifactPath = path.join(
      __dirname,
      "../artifacts/contracts",
      `${name}.sol`,
      `${name}.json`
    );
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    return {
      abi: artifact.abi,
      bytecode: artifact.bytecode,
    };
  } catch (error) {
    console.warn(`⚠️ Contract artifact not found: ${name}`);
    return null;
  }
}

function saveDeploymentInfo(network: string, info: any) {
  const deploymentsPath = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsPath)) {
    fs.mkdirSync(deploymentsPath, { recursive: true });
  }

  const filePath = path.join(deploymentsPath, `${network}.json`);
  fs.writeFileSync(filePath, JSON.stringify(info, null, 2));
  
  console.log(`💾 Deployment info saved to ${filePath}`);
}

// Main execution
async function main() {
  const network = process.env.NETWORK || "sepolia";
  const rpcUrl = process.env.ETHEREUM_RPC_URL || `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("DEPLOYER_PRIVATE_KEY environment variable is required");
  }

  try {
    const address = await deployContract({
      network,
      rpcUrl,
      privateKey,
    });

    console.log("\n✅ Deployment complete!");
    console.log(`📍 Contract address: ${address}`);
    console.log(`\n📝 Update your .env file:`);
    console.log(`VITE_GUARDIA_VAULT_ADDRESS=${address}`);
    console.log(`GUARDIAVAULT_CONTRACT_ADDRESS=${address}`);

    // Verify on Etherscan (optional)
    if (process.env.ETHERSCAN_API_KEY && network !== "localhost") {
      console.log(`\n🔍 Verifying contract on Etherscan...`);
      // In production, use hardhat verify plugin
      console.log(`Run: npx hardhat verify --network ${network} ${address}`);
    }
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { deployContract };

