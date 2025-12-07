// Test Inheritance Vault Setup
import dotenv from 'dotenv';
import { logger } from '../services/logger.service';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const API_BASE = process.env.BACKEND_URL || 'http://localhost:3001/api';
const prisma = new PrismaClient();

interface VaultTest {
  name: string;
  owner: string;
  guardians: string[];
  threshold: number;
  timelockPeriod: number; // seconds
}

const testVault: VaultTest = {
  name: 'Test Inheritance Vault',
  owner: '0x742d35Cc6634C0532925a3b8F47f8f3aC0F28f3a',
  guardians: [
    '0x1234567890123456789012345678901234567890',
    '0x2345678901234567890123456789012345678901',
    '0x3456789012345678901234567890123456789012',
  ],
  threshold: 2, // Require 2 of 3 guardians
  timelockPeriod: 604800, // 7 days
};

async function testDatabaseSchema() {
  logger.info('\n📊 Testing Database Schema...');

  try {
    // Check if User model exists
    const userCount = await prisma.user.count();
    logger.info(`   ✅ User model: ${userCount} users`);

    // Check if Guardian model exists
    const guardianCount = await prisma.guardian.count();
    logger.info(`   ✅ Guardian model: ${guardianCount} guardians`);

    // Check if RecoveryRequest model exists
    const recoveryCount = await prisma.recoveryRequest.count();
    logger.info(`   ✅ RecoveryRequest model: ${recoveryCount} recovery requests`);

    // Check if Beneficiary model exists
    const beneficiaryCount = await prisma.beneficiary.count();
    logger.info(`   ✅ Beneficiary model: ${beneficiaryCount} beneficiaries`);

    return { success: true };
  } catch (error: any) {
    logger.info(`   ❌ Database schema error: ${error.message}`);
    throw error;
  }
}

async function testGuardianRoutes(accessToken: string) {
  logger.info('\n👥 Testing Guardian Routes...');

  try {
    // Test listing guardians
    const listResponse = await axios.get(`${API_BASE}/guardians`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    logger.info(`   ✅ GET /api/guardians - Found ${listResponse.data.length} guardians`);

    // Test inviting guardian
    const inviteResponse = await axios.post(
      `${API_BASE}/guardians`,
      {
        email: 'test-guardian@example.com',
        name: 'Test Guardian',
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    logger.info(`   ✅ POST /api/guardians - Guardian invited: ${inviteResponse.data.id}`);

    return { guardians: listResponse.data, newGuardian: inviteResponse.data };
  } catch (error: any) {
    if (error.response?.status === 401) {
      logger.info(`   ⚠️  Authentication required - run with valid access token`);
    } else {
      logger.info(`   ❌ Guardian routes error: ${error.message}`);
    }
    throw error;
  }
}

async function testRecoveryFlow(accessToken: string) {
  logger.info('\n🔐 Testing Recovery Flow...');

  try {
    // Test initiating recovery
    const recoveryResponse = await axios.post(
      `${API_BASE}/guardians/recovery`,
      {
        requesterEmail: 'recovery@example.com',
        reason: 'Test recovery request',
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    logger.info(`   ✅ Recovery initiated: ${recoveryResponse.data.id}`);
    logger.info(`      Required approvals: ${recoveryResponse.data.requiredApprovals}`);
    logger.info(`      Can execute at: ${recoveryResponse.data.canExecuteAt}`);

    return recoveryResponse.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      logger.info(`   ⚠️  Authentication required`);
    } else if (error.response?.status === 400) {
      logger.info(`   ⚠️  ${error.response.data.error}`);
    } else {
      logger.info(`   ❌ Recovery flow error: ${error.message}`);
    }
    throw error;
  }
}

async function testVaultCreation() {
  logger.info('\n🏦 Testing Vault Creation Logic...');

  // This tests the logic without actually creating a vault
  // Real vault creation requires smart contract deployment

  const guardians = testVault.guardians;
  const threshold = testVault.threshold;

  // Validate threshold
  if (threshold < 1 || threshold > guardians.length) {
    throw new Error(`Invalid threshold: ${threshold} (must be 1-${guardians.length})`);
  }
  logger.info(`   ✅ Threshold validation: ${threshold} of ${guardians.length}`);

  // Validate timelock
  const minTimelock = 604800; // 7 days
  const maxTimelock = 31536000; // 1 year
  if (testVault.timelockPeriod < minTimelock || testVault.timelockPeriod > maxTimelock) {
    throw new Error(`Invalid timelock: ${testVault.timelockPeriod}s (must be ${minTimelock}-${maxTimelock}s)`);
  }
  logger.info(`   ✅ Timelock validation: ${testVault.timelockPeriod}s (${testVault.timelockPeriod / 86400} days)`);

  // Validate guardians
  if (guardians.length < 2) {
    throw new Error('At least 2 guardians required');
  }
  logger.info(`   ✅ Guardian count: ${guardians.length}`);

  logger.info(`\n   📋 Vault Configuration:`);
  logger.info(`      Owner: ${testVault.owner}`);
  logger.info(`      Guardians: ${guardians.length}`);
  logger.info(`      Threshold: ${threshold}`);
  logger.info(`      Timelock: ${testVault.timelockPeriod / 86400} days`);

  return { valid: true, config: testVault };
}

async function runVaultTests() {
  logger.info('\n🚀 Starting Inheritance Vault Tests...\n');
  logger.info('='.repeat(60));

  try {
    // Test database schema
    await testDatabaseSchema();

    // Test vault creation logic
    await testVaultCreation();

    // Test guardian routes (requires authentication)
    const accessToken = process.env.TEST_ACCESS_TOKEN;
    if (accessToken) {
      await testGuardianRoutes(accessToken);
      await testRecoveryFlow(accessToken);
    } else {
      logger.info('\n⚠️  Skipping authenticated tests - set TEST_ACCESS_TOKEN');
    }

    logger.info('\n' + '='.repeat(60));
    logger.info('\n✅ Vault setup tests completed!');
    logger.info('\n📝 Next steps:');
    logger.info('   1. Set up guardians via /api/guardians endpoint');
    logger.info('   2. Create vault smart contract (requires contract deployment)');
    logger.info('   3. Test recovery flow with guardians');
    logger.info('   4. Test timelock execution');

  } catch (error: any) {
    logger.info('\n❌ Vault tests failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runVaultTests();

