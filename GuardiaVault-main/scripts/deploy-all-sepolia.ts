/**
 * Complete Sepolia Deployment Script
 * Deploys all GuardiaVault contracts to Sepolia testnet
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { ethers } from 'ethers';

function exec(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error: any) {
    console.error(`Command failed: ${command}`);
    console.error(error.stdout || error.message);
    throw error;
  }
}

async function checkSetup() {
  console.log('\n🔍 Checking deployment prerequisites...\n');

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || rpcUrl.includes('YOUR_')) {
    console.error('❌ SEPOLIA_RPC_URL not configured');
    console.log('   Run: npx tsx scripts/setup-sepolia.ts');
    process.exit(1);
  }

  if (!privateKey || privateKey === '0x' + '0'.repeat(64)) {
    console.error('❌ PRIVATE_KEY not configured');
    console.log('   Run: npx tsx scripts/setup-sepolia.ts');
    process.exit(1);
  }

  // Check wallet balance
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    const balanceInEth = ethers.formatEther(balance);

    console.log(`✅ Deployer address: ${wallet.address}`);
    console.log(`✅ Balance: ${balanceInEth} ETH`);

    if (parseFloat(balanceInEth) < 0.01) {
      console.warn('\n⚠️  WARNING: Low balance. You need at least 0.1 ETH for deployments');
      console.log('   Get Sepolia ETH: https://sepoliafaucet.com');
      console.log(`   Your address: ${wallet.address}\n`);

      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise((resolve) => {
        rl.question('Continue anyway? (yes/no): ', (answer: string) => {
          rl.close();
          if (answer.toLowerCase() !== 'yes') {
            console.log('Deployment cancelled.');
            process.exit(0);
          }
          resolve(true);
        });
      });
    }
  } catch (error: any) {
    console.error(`❌ Failed to connect to Sepolia: ${error.message}`);
    process.exit(1);
  }

  console.log('✅ Prerequisites check passed\n');
}

async function deployContracts() {
  console.log('📦 STEP 1: Compiling contracts...\n');

  try {
    exec('npx hardhat compile');
    console.log('✅ Contracts compiled successfully\n');
  } catch (error) {
    console.error('❌ Compilation failed');
    process.exit(1);
  }

  console.log('🚀 STEP 2: Deploying GuardiaVault to Sepolia...\n');

  let guardiaVaultAddress = '';
  try {
    const output = exec('npx hardhat ignition deploy ignition/modules/GuardiaVault.ts --network sepolia');
    console.log(output);

    // Extract address from output
    const match = output.match(/GuardiaVault#GuardiaVault - (0x[a-fA-F0-9]{40})/);
    if (match) {
      guardiaVaultAddress = match[1];
      console.log(`\n✅ GuardiaVault deployed: ${guardiaVaultAddress}\n`);
    }
  } catch (error: any) {
    console.error('❌ GuardiaVault deployment failed');
    console.log('   Check your balance and RPC connection');
    process.exit(1);
  }

  console.log('🚀 STEP 3: Deploying YieldVault with adapters...\n');

  let yieldVaultAddress = '';
  let lidoAdapterAddress = '';
  let aaveAdapterAddress = '';

  try {
    const output = exec('npx hardhat ignition deploy ignition/modules/YieldVault.ts --network sepolia');
    console.log(output);

    // Extract addresses
    const yieldMatch = output.match(/YieldVault#YieldVault - (0x[a-fA-F0-9]{40})/);
    const lidoMatch = output.match(/LidoAdapter#LidoAdapter - (0x[a-fA-F0-9]{40})/);
    const aaveMatch = output.match(/AaveAdapter#AaveAdapter - (0x[a-fA-F0-9]{40})/);

    if (yieldMatch) yieldVaultAddress = yieldMatch[1];
    if (lidoMatch) lidoAdapterAddress = lidoMatch[1];
    if (aaveMatch) aaveAdapterAddress = aaveMatch[1];

    console.log(`\n✅ YieldVault deployed: ${yieldVaultAddress}`);
    console.log(`✅ LidoAdapter deployed: ${lidoAdapterAddress}`);
    console.log(`✅ AaveAdapter deployed: ${aaveAdapterAddress}\n`);
  } catch (error: any) {
    console.error('❌ YieldVault deployment failed');
    console.log('   This is optional - GuardiaVault can work without yield features');
  }

  // Update .env file
  console.log('📝 STEP 4: Updating .env file...\n');

  let envContent = readFileSync('.env', 'utf-8');

  if (guardiaVaultAddress) {
    envContent = envContent.replace(
      /VITE_GUARDIA_VAULT_ADDRESS=.*/g,
      `VITE_GUARDIA_VAULT_ADDRESS=${guardiaVaultAddress}`
    );
  }

  if (yieldVaultAddress) {
    envContent = envContent.replace(
      /YIELD_VAULT_ADDRESS=.*/g,
      `YIELD_VAULT_ADDRESS=${yieldVaultAddress}`
    );
  }

  if (lidoAdapterAddress) {
    envContent = envContent.replace(
      /LIDO_ADAPTER_ADDRESS=.*/g,
      `LIDO_ADAPTER_ADDRESS=${lidoAdapterAddress}`
    );
  }

  if (aaveAdapterAddress) {
    envContent = envContent.replace(
      /AAVE_ADAPTER_ADDRESS=.*/g,
      `AAVE_ADAPTER_ADDRESS=${aaveAdapterAddress}`
    );
  }

  writeFileSync('.env', envContent);
  console.log('✅ Environment variables updated\n');

  // Save deployment info
  const deploymentInfo = `
# Sepolia Deployment - ${new Date().toISOString()}

## Contract Addresses

- **GuardiaVault**: ${guardiaVaultAddress || 'Not deployed'}
- **YieldVault**: ${yieldVaultAddress || 'Not deployed'}
- **LidoAdapter**: ${lidoAdapterAddress || 'Not deployed'}
- **AaveAdapter**: ${aaveAdapterAddress || 'Not deployed'}

## Verification Commands

\`\`\`bash
# Verify GuardiaVault
npx hardhat verify --network sepolia ${guardiaVaultAddress}

# Verify YieldVault
npx hardhat verify --network sepolia ${yieldVaultAddress}

# Verify LidoAdapter
npx hardhat verify --network sepolia ${lidoAdapterAddress}

# Verify AaveAdapter
npx hardhat verify --network sepolia ${aaveAdapterAddress}
\`\`\`

## View on Etherscan

- GuardiaVault: https://sepolia.etherscan.io/address/${guardiaVaultAddress}
- YieldVault: https://sepolia.etherscan.io/address/${yieldVaultAddress}
- LidoAdapter: https://sepolia.etherscan.io/address/${lidoAdapterAddress}
- AaveAdapter: https://sepolia.etherscan.io/address/${aaveAdapterAddress}
`;

  writeFileSync('SEPOLIA_DEPLOYMENT.md', deploymentInfo);

  console.log('\n🎉 Deployment Complete!\n');
  console.log('📋 Contract addresses saved to:');
  console.log('   - .env (for your application)');
  console.log('   - SEPOLIA_DEPLOYMENT.md (for reference)\n');

  console.log('📝 Next steps:');
  console.log('   1. Verify contracts: See SEPOLIA_DEPLOYMENT.md');
  console.log('   2. Test on Sepolia: https://sepolia.etherscan.io');
  console.log('   3. Deploy frontend with updated addresses\n');

  // Verify contracts if Etherscan API key is set
  if (process.env.ETHERSCAN_API_KEY && !process.env.ETHERSCAN_API_KEY.includes('your_')) {
    console.log('🔍 Verifying contracts on Etherscan...\n');

    const contracts = [
      { name: 'GuardiaVault', address: guardiaVaultAddress },
      { name: 'YieldVault', address: yieldVaultAddress },
      { name: 'LidoAdapter', address: lidoAdapterAddress },
      { name: 'AaveAdapter', address: aaveAdapterAddress },
    ];

    for (const contract of contracts) {
      if (!contract.address) continue;

      try {
        console.log(`Verifying ${contract.name}...`);
        exec(`npx hardhat verify --network sepolia ${contract.address}`);
        console.log(`✅ ${contract.name} verified\n`);
      } catch (error) {
        console.log(`⚠️  ${contract.name} verification failed (try manually later)\n`);
      }
    }
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   GuardiaVault Sepolia Deployment      ║');
  console.log('╚══════════════════════════════════════════╝');

  await checkSetup();
  await deployContracts();
}

main().catch((error) => {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
});
