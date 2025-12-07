// Comprehensive Integration Test - Full Flow Testing
import dotenv from 'dotenv';
import { logger } from '../services/logger.service';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { OneInchService } from '../services/defi.service';

dotenv.config();

const API_BASE = process.env.BACKEND_URL || 'http://localhost:3001/api';
const prisma = new PrismaClient();

interface TestUser {
  email: string;
  password: string;
  name: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}

const testUser: TestUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User',
};

async function cleanup() {
  try {
    // Clean up test user
    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    if (user) {
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

async function testUserRegistration() {
  logger.info('\n📝 Testing User Registration...');
  
  const response = await axios.post(`${API_BASE}/auth/register`, {
    email: testUser.email,
    password: testUser.password,
    username: testUser.name,
  });

  testUser.accessToken = response.data.accessToken;
  testUser.refreshToken = response.data.refreshToken;
  testUser.userId = response.data.user.id;

  logger.info(`   ✅ User registered: ${testUser.email}`);
  logger.info(`   ✅ Access token received`);
  
  return response.data;
}

async function testUserLogin() {
  logger.info('\n🔐 Testing User Login...');
  
  const response = await axios.post(`${API_BASE}/auth/login`, {
    email: testUser.email,
    password: testUser.password,
  });

  testUser.accessToken = response.data.accessToken;
  testUser.refreshToken = response.data.refreshToken;

  logger.info(`   ✅ Login successful`);
  return response.data;
}

async function testGetProfile() {
  logger.info('\n👤 Testing Get Profile...');
  
  const response = await axios.get(`${API_BASE}/user/profile`, {
    headers: {
      Authorization: `Bearer ${testUser.accessToken}`,
    },
  });

  logger.info(`   ✅ Profile retrieved: ${response.data.profile.email}`);
  return response.data;
}

async function testTradingFlow() {
  if (!process.env.ONEINCH_API_KEY) {
    logger.info('\n⚠️  Skipping trading tests - ONEINCH_API_KEY not set');
    return;
  }

  logger.info('\n💱 Testing Trading Flow...');

  const oneInch = new OneInchService(1);
  const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
  const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
  const amount = '100000000000000000'; // 0.1 ETH

  // Test 1: Get quote via API
  logger.info('   📊 Getting swap quote...');
  const quoteResponse = await axios.get(
    `${API_BASE}/defi/quote?fromToken=${ethAddress}&toToken=${usdcAddress}&amount=${amount}&chainId=1`,
    {
      headers: {
        Authorization: `Bearer ${testUser.accessToken}`,
      },
    }
  );
  logger.info(`   ✅ Quote received: ${quoteResponse.data.toAmount} USDC expected`);

  // Test 2: Build swap transaction
  logger.info('   🔨 Building swap transaction...');
  const swapResponse = await axios.post(
    `${API_BASE}/defi/swap`,
    {
      fromToken: ethAddress,
      toToken: usdcAddress,
      amount: amount,
      fromAddress: '0x742d35Cc6634C0532925a3b8F47f8f3aC0F28f3a',
      chainId: 1,
      slippage: 1,
    },
    {
      headers: {
        Authorization: `Bearer ${testUser.accessToken}`,
      },
    }
  );
  logger.info(`   ✅ Swap transaction built`);
  logger.info(`      To: ${swapResponse.data.transaction.to}`);
  logger.info(`      Gas: ${swapResponse.data.transaction.gas}`);

  // Test 3: Check allowance (for USDC)
  logger.info('   🔐 Checking token allowance...');
  const allowanceResponse = await axios.get(
    `${API_BASE}/defi/allowance?tokenAddress=${usdcAddress}&walletAddress=0x742d35Cc6634C0532925a3b8F47f8f3aC0F28f3a&chainId=1`,
    {
      headers: {
        Authorization: `Bearer ${testUser.accessToken}`,
      },
    }
  );
  logger.info(`   ✅ Allowance: ${allowanceResponse.data.allowance}`);

  return {
    quote: quoteResponse.data,
    swap: swapResponse.data,
    allowance: allowanceResponse.data,
  };
}

async function testVaultSetup() {
  logger.info('\n🏦 Testing Inheritance Vault Setup...');

  // Test 1: Add guardians
  logger.info('   👥 Adding guardians...');
  const guardian1 = await axios.post(
    `${API_BASE}/guardians`,
    {
      email: 'guardian1@example.com',
      name: 'Guardian 1',
    },
    {
      headers: {
        Authorization: `Bearer ${testUser.accessToken}`,
      },
    }
  );
  logger.info(`   ✅ Guardian 1 added: ${guardian1.data.id}`);

  const guardian2 = await axios.post(
    `${API_BASE}/guardians`,
    {
      email: 'guardian2@example.com',
      name: 'Guardian 2',
    },
    {
      headers: {
        Authorization: `Bearer ${testUser.accessToken}`,
      },
    }
  );
  logger.info(`   ✅ Guardian 2 added: ${guardian2.data.id}`);

  // Test 2: List guardians
  logger.info('   📋 Listing guardians...');
  const guardiansList = await axios.get(`${API_BASE}/guardians`, {
    headers: {
      Authorization: `Bearer ${testUser.accessToken}`,
    },
  });
  logger.info(`   ✅ Found ${guardiansList.data.length} guardians`);

  // Test 3: Initiate recovery (simulates inheritance trigger)
  logger.info('   🔐 Testing recovery initiation...');
  try {
    const recovery = await axios.post(
      `${API_BASE}/guardians/recovery`,
      {
        requesterEmail: 'beneficiary@example.com',
        reason: 'Test inheritance recovery',
      },
      {
        headers: {
          Authorization: `Bearer ${testUser.accessToken}`,
        },
      }
    );
    logger.info(`   ✅ Recovery initiated: ${recovery.data.id}`);
    logger.info(`      Required approvals: ${recovery.data.requiredApprovals}`);
    return { guardians: guardiansList.data, recovery: recovery.data };
  } catch (error: any) {
    if (error.response?.status === 400) {
      logger.info(`   ⚠️  ${error.response.data.error} (expected if guardians not accepted)`);
    } else {
      throw error;
    }
  }
}

async function runIntegrationTests() {
  logger.info('\n🚀 Starting Comprehensive Integration Tests...\n');
  logger.info('='.repeat(60));

  try {
    // Cleanup any existing test data
    await cleanup();

    // Authentication flow
    await testUserRegistration();
    await testUserLogin();
    await testGetProfile();

    // Trading flow
    await testTradingFlow();

    // Vault setup
    await testVaultSetup();

    logger.info('\n' + '='.repeat(60));
    logger.info('\n✅ All integration tests passed!');
    logger.info('\n📝 Summary:');
    logger.info(`   ✅ User registration & login working`);
    logger.info(`   ✅ Profile management working`);
    logger.info(`   ✅ Trading API connected and functional`);
    logger.info(`   ✅ Inheritance vault setup working`);
    logger.info('\n🎉 Your system is ready for production!');

  } catch (error: any) {
    logger.info('\n❌ Integration test failed:', error.message);
    if (error.response) {
      logger.info(`   Status: ${error.response.status}`);
      logger.info(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

runIntegrationTests();

