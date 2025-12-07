/**
 * Deployment Script for GuardianAttestationRegistry
 */

const hre = require('hardhat');

async function main() {
  console.log('🚀 Deploying GuardianAttestationRegistry...');

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'ETH');

  // Deploy contract
  const GuardianAttestationRegistry = await hre.ethers.getContractFactory(
    'GuardianAttestationRegistry'
  );
  const registry = await GuardianAttestationRegistry.deploy();

  await registry.waitForDeployment();
  const address = await registry.getAddress();

  console.log('✅ GuardianAttestationRegistry deployed to:', address);

  // Verify contract (optional, requires Etherscan API key)
  if (hre.network.name !== 'hardhat' && process.env.ETHERSCAN_API_KEY) {
    console.log('⏳ Waiting for block confirmations...');
    await registry.deploymentTransaction()?.wait(5);

    console.log('🔍 Verifying contract...');
    try {
      await hre.run('verify:verify', {
        address: address,
        constructorArguments: [],
      });
      console.log('✅ Contract verified on Etherscan');
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
    }
  }

  console.log('');
  console.log('📋 Deployment Summary:');
  console.log('  Contract: GuardianAttestationRegistry');
  console.log('  Address:', address);
  console.log('  Network:', hre.network.name);
  console.log('  Deployer:', deployer.address);

  // Save deployment info
  const deploymentInfo = {
    contract: 'GuardianAttestationRegistry',
    address: address,
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const fs = require('fs');
  const deploymentsDir = 'deployments';
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = `${deploymentsDir}/${hre.network.name}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log('💾 Deployment info saved to:', deploymentFile);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });

