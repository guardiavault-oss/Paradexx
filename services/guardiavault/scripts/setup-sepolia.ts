/**
 * Interactive Sepolia Deployment Setup
 * Helps configure environment variables for Sepolia deployment
 */

import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { ethers } from 'ethers';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setupSepolia() {
  console.log('\n🚀 Sepolia Deployment Setup\n');
  console.log('This script will help you configure your .env file for Sepolia deployment.\n');

  // Read current .env
  let envContent = readFileSync('.env', 'utf-8');

  // 1. Sepolia RPC URL
  console.log('📡 STEP 1: Sepolia RPC URL');
  console.log('   Get a free RPC from:');
  console.log('   - Infura: https://infura.io');
  console.log('   - Alchemy: https://www.alchemy.com');
  console.log('   - QuickNode: https://www.quicknode.com\n');

  const rpcUrl = await question('Enter your Sepolia RPC URL: ');

  if (rpcUrl && rpcUrl.startsWith('http')) {
    envContent = envContent.replace(
      /SEPOLIA_RPC_URL=.*/g,
      `SEPOLIA_RPC_URL=${rpcUrl}`
    );
    envContent = envContent.replace(
      /VITE_SEPOLIA_RPC_URL=.*/g,
      `VITE_SEPOLIA_RPC_URL=${rpcUrl}`
    );
    console.log('✅ RPC URL configured\n');
  } else {
    console.log('⚠️  Skipping RPC URL (you can set it later)\n');
  }

  // 2. Private Key
  console.log('🔑 STEP 2: Private Key');
  console.log('   Export from MetaMask: Account Details > Export Private Key');
  console.log('   ⚠️  This wallet needs Sepolia ETH (~0.1 ETH)');
  console.log('   Get Sepolia ETH: https://sepoliafaucet.com\n');

  const privateKey = await question('Enter your private key (starts with 0x): ');

  if (privateKey && privateKey.startsWith('0x') && privateKey.length === 66) {
    // Validate private key
    try {
      const wallet = new ethers.Wallet(privateKey);
      const address = wallet.address;

      envContent = envContent.replace(
        /PRIVATE_KEY=.*/g,
        `PRIVATE_KEY=${privateKey}`
      );
      console.log(`✅ Private key configured for address: ${address}`);
      console.log(`   Check balance: https://sepolia.etherscan.io/address/${address}\n`);
    } catch (error) {
      console.log('❌ Invalid private key format\n');
    }
  } else {
    console.log('⚠️  Skipping private key (you can set it later)\n');
  }

  // 3. Etherscan API Key
  console.log('🔍 STEP 3: Etherscan API Key (optional - for contract verification)');
  console.log('   Get free key: https://etherscan.io/apis\n');

  const etherscanKey = await question('Enter your Etherscan API key (or press Enter to skip): ');

  if (etherscanKey && etherscanKey.length > 10) {
    envContent = envContent.replace(
      /ETHERSCAN_API_KEY=.*/g,
      `ETHERSCAN_API_KEY=${etherscanKey}`
    );
    console.log('✅ Etherscan API key configured\n');
  } else {
    console.log('⚠️  Skipping Etherscan API (you can verify contracts manually)\n');
  }

  // 4. Update Chain ID
  envContent = envContent.replace(
    /VITE_CHAIN_ID=.*/g,
    `VITE_CHAIN_ID=11155111`
  );

  // Save updated .env
  writeFileSync('.env', envContent);

  console.log('\n✅ Configuration saved to .env\n');
  console.log('📋 Next steps:');
  console.log('   1. Compile contracts: npm run compile');
  console.log('   2. Deploy GuardiaVault: npm run deploy:sepolia');
  console.log('   3. Deploy YieldVault: npm run deploy:yield:sepolia');
  console.log('\n📖 Full guide: See SEPOLIA_DEPLOYMENT_GUIDE.md\n');

  rl.close();
}

setupSepolia().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
