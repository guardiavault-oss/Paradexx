#!/usr/bin/env node
/**
 * Update Treasury Address for Deployed YieldVault
 * 
 * Usage:
 *   Sepolia: npx tsx scripts/update-treasury.ts --network sepolia --treasury 0xYourWalletAddress
 *   Mainnet: npx tsx scripts/update-treasury.ts --network mainnet --treasury 0xYourWalletAddress
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

async function updateTreasury() {
  // Parse command line arguments (handle both --key=value and --key value formats)
  let network = 'sepolia';
  let treasuryArg: string | undefined;
  
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg.startsWith('--network=')) {
      network = arg.split('=')[1];
    } else if (arg === '--network' && i + 1 < process.argv.length) {
      network = process.argv[i + 1];
    } else if (arg.startsWith('--treasury=')) {
      treasuryArg = arg.split('=')[1];
    } else if (arg === '--treasury' && i + 1 < process.argv.length) {
      treasuryArg = process.argv[i + 1];
    }
  }
  
  if (!treasuryArg) {
    console.error('❌ Error: Treasury address is required');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/update-treasury.ts --network sepolia --treasury 0xYourWalletAddress');
    console.log('  or');
    console.log('  npx tsx scripts/update-treasury.ts --network=sepolia --treasury=0xYourWalletAddress');
    process.exit(1);
  }

  const newTreasuryAddress = treasuryArg;
  
  // Validate address
  if (!ethers.isAddress(newTreasuryAddress)) {
    console.error(`❌ Error: Invalid address: ${newTreasuryAddress}`);
    process.exit(1);
  }

  console.log(`🔧 Updating Treasury Address on ${network}...\n`);
  console.log(`📋 New Treasury Address: ${newTreasuryAddress}\n`);

  // Get RPC URL based on network
  let rpcUrl: string;
  let chainId: number;
  
  switch (network) {
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
    case 'hardhat':
    case 'localhost':
      rpcUrl = 'http://localhost:8545';
      chainId = 31337;
      break;
    default:
      throw new Error(`Unknown network: ${network}`);
  }

  // Get contract address
  const contractAddress = process.env.YIELD_VAULT_ADDRESS;
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    console.error('❌ Error: YIELD_VAULT_ADDRESS not set in .env or invalid');
    console.log('\nPlease set YIELD_VAULT_ADDRESS in your .env file:');
    console.log('YIELD_VAULT_ADDRESS=0xYourDeployedContractAddress');
    process.exit(1);
  }

  // Get deployer private key (must be contract owner)
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey || privateKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('PRIVATE_KEY not set in .env (must be contract owner)');
  }

  // Initialize provider and signer
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const balance = await provider.getBalance(signer.address);
  console.log(`👤 Contract Owner: ${signer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH\n`);

  if (balance === 0n && network !== 'hardhat' && network !== 'localhost') {
    throw new Error('❌ Owner wallet has no ETH for gas fees');
  }

  // Load contract ABI
  const contractABI = [
    "function setTreasury(address _treasury) external",
    "function treasury() public view returns (address)",
    "function owner() public view returns (address)",
  ];

  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  // Verify we're the owner
  try {
    const owner = await contract.owner();
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.error(`❌ Error: Signer ${signer.address} is not the contract owner`);
      console.log(`   Contract owner is: ${owner}`);
      process.exit(1);
    }
    console.log(`✅ Verified: You are the contract owner\n`);
  } catch (error: any) {
    console.error('❌ Error verifying ownership:', error.message);
    process.exit(1);
  }

  // Get current treasury address
  try {
    const currentTreasury = await contract.treasury();
    console.log(`📊 Current Treasury: ${currentTreasury}`);
    if (currentTreasury.toLowerCase() === newTreasuryAddress.toLowerCase()) {
      console.log('\n⚠️  Treasury address is already set to this address');
      process.exit(0);
    }
    console.log(`🎯 New Treasury: ${newTreasuryAddress}\n`);
  } catch (error: any) {
    console.warn('⚠️  Could not read current treasury address:', error.message);
  }

  // Confirm update
  console.log('📝 Ready to update treasury address...');
  console.log('   This will send a transaction to update the treasury address.\n');

  try {
    // Estimate gas
    const gasEstimate = await contract.setTreasury.estimateGas(newTreasuryAddress);
    const gasPrice = await provider.getFeeData();
    const estimatedCost = gasEstimate * (gasPrice.gasPrice || 0n);
    
    console.log(`⛽ Estimated Gas: ${gasEstimate.toString()}`);
    console.log(`💰 Estimated Cost: ${ethers.formatEther(estimatedCost)} ETH\n`);

    // Send transaction
    console.log('🚀 Sending transaction...\n');
    const tx = await contract.setTreasury(newTreasuryAddress, {
      gasLimit: gasEstimate * 120n / 100n, // Add 20% buffer
    });

    console.log(`📡 Transaction Hash: ${tx.hash}`);
    console.log(`⏳ Waiting for confirmation...\n`);

    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log('✅ Treasury address updated successfully!\n');
    console.log('📋 Transaction Details:');
    console.log(`   Block Number: ${receipt.blockNumber}`);
    console.log(`   Transaction Hash: ${receipt.hash}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`   Treasury Address: ${newTreasuryAddress}\n`);

    // Verify the update
    const updatedTreasury = await contract.treasury();
    if (updatedTreasury.toLowerCase() === newTreasuryAddress.toLowerCase()) {
      console.log('✅ Verification: Treasury address successfully updated!');
    } else {
      console.error('❌ Verification failed: Treasury address mismatch');
      console.log(`   Expected: ${newTreasuryAddress}`);
      console.log(`   Got: ${updatedTreasury}`);
    }

    console.log('\n📝 Update your .env file:');
    console.log(`TREASURY_ADDRESS=${newTreasuryAddress}`);

  } catch (error: any) {
    console.error('\n❌ Transaction failed:', error.message);
    
    if (error.reason) {
      console.error(`   Reason: ${error.reason}`);
    }
    
    if (error.code === 'CALL_EXCEPTION') {
      console.error('\n💡 Possible causes:');
      console.error('   - You are not the contract owner');
      console.error('   - Contract address is incorrect');
      console.error('   - Network mismatch');
    }
    
    process.exit(1);
  }
}

updateTreasury().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
