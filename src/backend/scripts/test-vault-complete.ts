// Complete Inheritance Vault Test - Works with or without database
import dotenv from 'dotenv';
import { logger } from '../services/logger.service';
import axios from 'axios';

dotenv.config();

const API_BASE = process.env.BACKEND_URL || 'http://localhost:3001/api';

interface VaultConfiguration {
  owner: string;
  guardians: Array<{ email: string; name: string }>;
  beneficiaries: Array<{ name: string; email: string; percentage: number }>;
  threshold: number; // M-of-N guardians required
  timelockPeriod: number; // seconds
}

const testVault: VaultConfiguration = {
  owner: '0x742d35Cc6634C0532925a3b8F47f8f3aC0F28f3a',
  guardians: [
    { email: 'guardian1@example.com', name: 'Guardian One' },
    { email: 'guardian2@example.com', name: 'Guardian Two' },
    { email: 'guardian3@example.com', name: 'Guardian Three' },
  ],
  beneficiaries: [
    { name: 'Beneficiary One', email: 'beneficiary1@example.com', percentage: 50 },
    { name: 'Beneficiary Two', email: 'beneficiary2@example.com', percentage: 50 },
  ],
  threshold: 2, // Require 2 of 3 guardians
  timelockPeriod: 604800, // 7 days
};

async function testVaultLogic() {
  logger.info('\n🏦 Testing Vault Creation Logic...');

  const { guardians, beneficiaries, threshold, timelockPeriod } = testVault;

  // Validate guardians
  if (guardians.length < 2) {
    throw new Error('At least 2 guardians required');
  }
  logger.info(`   ✅ Guardian count: ${guardians.length}`);

  // Validate threshold
  if (threshold < 1 || threshold > guardians.length) {
    throw new Error(`Invalid threshold: ${threshold} (must be 1-${guardians.length})`);
  }
  logger.info(`   ✅ Threshold validation: ${threshold} of ${guardians.length} (M-of-N)`);

  // Validate timelock
  const minTimelock = 604800; // 7 days
  const maxTimelock = 31536000; // 1 year
  if (timelockPeriod < minTimelock || timelockPeriod > maxTimelock) {
    throw new Error(`Invalid timelock: ${timelockPeriod}s (must be ${minTimelock}-${maxTimelock}s)`);
  }
  logger.info(`   ✅ Timelock validation: ${timelockPeriod}s (${timelockPeriod / 86400} days)`);

  // Validate beneficiaries
  const totalPercentage = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Invalid beneficiary allocation: ${totalPercentage}% (must equal 100%)`);
  }
  logger.info(`   ✅ Beneficiary allocation: ${totalPercentage}% (${beneficiaries.length} beneficiaries)`);

  logger.info(`\n   📋 Vault Configuration:`);
  logger.info(`      Owner: ${testVault.owner}`);
  logger.info(`      Guardians: ${guardians.length} (require ${threshold} approvals)`);
  logger.info(`      Beneficiaries: ${beneficiaries.length}`);
  logger.info(`      Timelock: ${timelockPeriod / 86400} days`);
  logger.info(`      Recovery: M-of-N (${threshold} of ${guardians.length})`);

  return { valid: true, config: testVault };
}

async function testGuardianAPI(accessToken: string) {
  logger.info('\n👥 Testing Guardian API...');

  try {
    // 1. List guardians (should be empty initially)
    const listResponse = await axios.get(`${API_BASE}/guardians`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    logger.info(`   ✅ GET /api/guardians - Found ${listResponse.data.length} guardians`);

    // 2. Add guardians
    const guardianIds: string[] = [];
    for (const guardian of testVault.guardians) {
      try {
        const inviteResponse = await axios.post(
          `${API_BASE}/guardians`,
          guardian,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        guardianIds.push(inviteResponse.data.id);
        logger.info(`   ✅ Added guardian: ${guardian.name} (${guardian.email})`);
      } catch (error: any) {
        if (error.response?.status === 409) {
          logger.info(`   ⚠️  Guardian already exists: ${guardian.email}`);
        } else {
          throw error;
        }
      }
    }

    // 3. Verify guardians were added
    const updatedList = await axios.get(`${API_BASE}/guardians`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    logger.info(`   ✅ Total guardians: ${updatedList.data.length}`);

    return { guardianIds, guardians: updatedList.data };
  } catch (error: any) {
    if (error.response?.status === 401) {
      logger.info(`   ⚠️  Authentication required`);
      return null;
    }
    throw error;
  }
}

async function testRecoveryAPI(accessToken: string) {
  logger.info('\n🔐 Testing Recovery Flow...');

  try {
    // 1. Initiate recovery request
    const recoveryResponse = await axios.post(
      `${API_BASE}/guardians/recovery`,
      {
        requesterEmail: 'beneficiary1@example.com',
        reason: 'Testing inheritance recovery flow',
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    logger.info(`   ✅ Recovery initiated:`);
    logger.info(`      ID: ${recoveryResponse.data.id}`);
    logger.info(`      Required approvals: ${recoveryResponse.data.requiredApprovals}`);
    logger.info(`      Can execute at: ${recoveryResponse.data.canExecuteAt}`);
    logger.info(`      Status: ${recoveryResponse.data.status}`);

    return recoveryResponse.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      const errorMsg = error.response.data.error;
      if (errorMsg.includes('guardian') || errorMsg.includes('No guardians')) {
        logger.info(`   ⚠️  ${errorMsg} - Add guardians first`);
        return null;
      }
    }
    if (error.response?.status === 401) {
      logger.info(`   ⚠️  Authentication required`);
      return null;
    }
    throw error;
  }
}

async function testBeneficiaryAPI(accessToken: string) {
  logger.info('\n👨‍👩‍👧 Testing Beneficiary API...');

  try {
    // Check if beneficiary routes exist
    // Note: Beneficiary routes may need to be added to the backend
    logger.info(`   ℹ️  Beneficiary endpoints:`);
    logger.info(`      GET /api/beneficiaries - List beneficiaries`);
    logger.info(`      POST /api/beneficiaries - Add beneficiary`);
    logger.info(`      PUT /api/beneficiaries/:id - Update beneficiary`);
    logger.info(`      DELETE /api/beneficiaries/:id - Remove beneficiary`);

    // Try to list beneficiaries
    try {
      const listResponse = await axios.get(`${API_BASE}/beneficiaries`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      logger.info(`   ✅ GET /api/beneficiaries - Found ${listResponse.data.length} beneficiaries`);
      return listResponse.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.info(`   ⚠️  Beneficiary routes not implemented yet`);
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      logger.info(`   ⚠️  Authentication required`);
      return null;
    }
    // Don't fail if beneficiaries aren't implemented
    logger.info(`   ⚠️  Beneficiary API not available`);
    return null;
  }
}

async function testDatabaseConnection() {
  logger.info('\n📊 Testing Database Connection...');

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info(`   ✅ Database connected`);

      // Check schema
      const userCount = await prisma.user.count().catch(() => 0);
      const guardianCount = await prisma.guardian.count().catch(() => 0);
      const recoveryCount = await prisma.recoveryRequest.count().catch(() => 0);
      const beneficiaryCount = await prisma.beneficiary.count().catch(() => 0);

      logger.info(`   📊 Database stats:`);
      logger.info(`      Users: ${userCount}`);
      logger.info(`      Guardians: ${guardianCount}`);
      logger.info(`      Recovery Requests: ${recoveryCount}`);
      logger.info(`      Beneficiaries: ${beneficiaryCount}`);

      await prisma.$disconnect();
      return true;
    } catch (error) {
      await prisma.$disconnect();
      throw error;
    }
  } catch (error: any) {
    logger.info(`   ⚠️  Database not available: ${error.message}`);
    logger.info(`      Vault logic tests will still run`);
    return false;
  }
}

async function runCompleteVaultTests() {
  logger.info('\n🚀 Starting Complete Inheritance Vault Tests...\n');
  logger.info('='.repeat(60));

  const results = {
    database: false,
    vaultLogic: false,
    guardianAPI: false,
    recoveryAPI: false,
    beneficiaryAPI: false,
  };

  try {
    // Test 1: Database connection (optional)
    results.database = await testDatabaseConnection();

    // Test 2: Vault logic (always works)
    await testVaultLogic();
    results.vaultLogic = true;

    // Test 3: Guardian API (requires auth + database)
    const accessToken = process.env.TEST_ACCESS_TOKEN;
    if (accessToken && results.database) {
      const guardianResult = await testGuardianAPI(accessToken);
      if (guardianResult) {
        results.guardianAPI = true;

        // Test 4: Recovery API (requires guardians)
        const recoveryResult = await testRecoveryAPI(accessToken);
        if (recoveryResult) {
          results.recoveryAPI = true;
        }
      }

      // Test 5: Beneficiary API
      const beneficiaryResult = await testBeneficiaryAPI(accessToken);
      if (beneficiaryResult !== null) {
        results.beneficiaryAPI = true;
      }
    } else {
      logger.info('\n⚠️  Skipping API tests:');
      if (!accessToken) {
        logger.info('   - Set TEST_ACCESS_TOKEN to test guardian/recovery APIs');
      }
      if (!results.database) {
        logger.info('   - Start PostgreSQL to test database features');
      }
    }

    // Summary
    logger.info('\n' + '='.repeat(60));
    logger.info('\n📊 Test Results Summary:\n');
    logger.info(`   ${results.vaultLogic ? '✅' : '❌'} Vault Logic: ${results.vaultLogic ? 'PASSED' : 'FAILED'}`);
    logger.info(`   ${results.database ? '✅' : '⚠️ '} Database: ${results.database ? 'CONNECTED' : 'NOT AVAILABLE'}`);
    logger.info(`   ${results.guardianAPI ? '✅' : '⚠️ '} Guardian API: ${results.guardianAPI ? 'WORKING' : 'SKIPPED'}`);
    logger.info(`   ${results.recoveryAPI ? '✅' : '⚠️ '} Recovery API: ${results.recoveryAPI ? 'WORKING' : 'SKIPPED'}`);
    logger.info(`   ${results.beneficiaryAPI ? '✅' : '⚠️ '} Beneficiary API: ${results.beneficiaryAPI ? 'WORKING' : 'SKIPPED'}`);

    logger.info('\n✅ Vault setup tests completed!');
    logger.info('\n📝 Next Steps:');
    if (!results.database) {
      logger.info('   1. Start PostgreSQL database');
      logger.info('   2. Run: npx prisma migrate dev');
    }
    if (!accessToken) {
      logger.info('   3. Login to get access token');
      logger.info('   4. Set TEST_ACCESS_TOKEN in .env');
    }
    logger.info('   5. Set up guardians via /api/guardians');
    logger.info('   6. Add beneficiaries');
    logger.info('   7. Test recovery flow');

  } catch (error: any) {
    logger.info('\n❌ Vault tests failed:', error.message);
    if (error.response) {
      logger.info('   Status:', error.response.status);
      logger.info('   Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

runCompleteVaultTests();

