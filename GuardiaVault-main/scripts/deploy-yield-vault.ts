#!/usr/bin/env node
/**
 * Deploy YieldVault with Adapters
 * 
 * Usage:
 *   Local: npx tsx scripts/deploy-yield-vault.ts --network hardhat
 *   Sepolia: npx tsx scripts/deploy-yield-vault.ts --network sepolia
 *   Mainnet: npx tsx scripts/deploy-yield-vault.ts --network mainnet
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function deployYieldVault() {
  const network = process.argv.find(arg => arg.startsWith('--network'))?.split('=')[1] || 'hardhat';
  
  console.log(`🚀 Deploying YieldVault to ${network}...\n`);

  // Get RPC URL based on network
  let rpcUrl: string;
  let chainId: number;
  
  switch (network) {
    case 'hardhat':
    case 'localhost':
      rpcUrl = 'http://localhost:8545';
      chainId = 31337;
      break;
    case 'sepolia':
      rpcUrl = process.env.SEPOLIA_RPC_URL || '';
      chainId = 11155111;
      if (!rpcUrl) throw new Error('SEPOLIA_RPC_URL not set in .env');
      break;
    case 'mainnet':
      rpcUrl = process.env.MAINNET_RPC_URL || '';
      chainId = 1;
      if (!rpcUrl) throw new Error('MAINNET_RPC_URL not set in .env');
      break;
    default:
      throw new Error(`Unknown network: ${network}`);
  }

  // Get deployer private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('PRIVATE_KEY not set in .env');
  }

  // Get treasury address
  const treasury = process.env.TREASURY_ADDRESS || process.env.VITE_TREASURY_ADDRESS || '0x0000000000000000000000000000000000000000';
  if (treasury === '0x0000000000000000000000000000000000000000') {
    console.warn('⚠️  TREASURY_ADDRESS not set - using zero address (update after deployment)');
  }

  // Initialize provider and signer
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const balance = await provider.getBalance(signer.address);
  console.log(`💰 Deployer: ${signer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n && network !== 'hardhat' && network !== 'localhost') {
    throw new Error('Deployer wallet has no ETH');
  }

  // Deploy using Hardhat Ignition
  console.log('📦 Using Hardhat Ignition for deployment...\n');
  
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  const ignitionCommand = `npx hardhat ignition deploy ignition/modules/YieldVault.ts --network ${network} --parameters '{"YieldVaultModule":{"treasury":"${treasury}"}}'`;
  
  console.log(`Running: ${ignitionCommand}\n`);
  
  try {
    const { stdout, stderr } = await execAsync(ignitionCommand, {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    console.log(stdout);
    if (stderr) console.error(stderr);

    // Parse deployment addresses from output
    const addressRegex = /0x[a-fA-F0-9]{40}/g;
    const addresses = stdout.match(addressRegex);

    if (addresses && addresses.length >= 3) {
      console.log('\n✅ Deployment Complete!\n');
      console.log('📋 Contract Addresses:');
      console.log(`   YieldVault: ${addresses[0]}`);
      console.log(`   LidoAdapter: ${addresses[1]}`);
      console.log(`   AaveAdapter: ${addresses[2]}\n`);
      
      console.log('📝 Add to .env:');
      console.log(`YIELD_VAULT_ADDRESS=${addresses[0]}`);
      console.log(`LIDO_ADAPTER_ADDRESS=${addresses[1]}`);
      console.log(`AAVE_ADAPTER_ADDRESS=${addresses[2]}\n`);
    }
  } catch (error: any) {
    console.error('❌ Deployment failed:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    process.exit(1);
  }
}

deployYieldVault().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

