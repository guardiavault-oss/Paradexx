// Get Auth Token and Run Full Vault Test
import dotenv from 'dotenv';
import { logger } from '../services/logger.service';
import axios from 'axios';

dotenv.config();

const API_BASE = process.env.BACKEND_URL || 'http://localhost:3001/api';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123!';

async function getAuthToken() {
  logger.info('\n🔐 Getting auth token...\n');

  // Check if backend is running
  try {
    await axios.get(`${API_BASE}/auth/login`, {
      validateStatus: () => true, // Don't throw on any status
    });
    logger.info('✅ Backend is running\n');
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      logger.info('⚠️  Backend not running. Start it with: npm run dev\n');
      logger.info('   Then run this script again.\n');
      process.exit(1);
    }
    // Other errors are OK, backend might be running
  }

  // Try to register user
  try {
    await axios.post(`${API_BASE}/auth/register`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: 'Test User',
    });
    logger.info('✅ User registered\n');
  } catch (error: any) {
    if (error.response?.status === 409) {
      logger.info('⚠️  User already exists, using login...\n');
    } else if (error.response?.status === 404) {
      logger.info('❌ Route not found. Check that backend is running and routes are correct.\n');
      logger.info('   Expected: POST ' + `${API_BASE}/auth/register` + '\n');
      throw error;
    } else {
      logger.info('❌ Registration failed:', error.message);
      if (error.response?.data) {
        logger.info('   Response:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  // Login to get token
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    const token = response.data.accessToken;

    if (!token) {
      logger.info('❌ No token received');
      process.exit(1);
    }

    logger.info('✅ Login successful!\n');
    logger.info('📝 Token obtained:', token.substring(0, 20) + '...\n');

    // Set in environment for test
    process.env.TEST_ACCESS_TOKEN = token;

    logger.info('🚀 Running full vault test with token...\n');
    logger.info('='.repeat(60) + '\n');

    // Import and run the vault test
    const { execSync } = require('child_process');
    execSync('npx tsx scripts/test-vault-complete.ts', {
      stdio: 'inherit',
      env: { ...process.env, TEST_ACCESS_TOKEN: token },
    });

  } catch (error: any) {
    logger.info('❌ Login failed:', error.message);
    if (error.response) {
      logger.info('   Status:', error.response.status);
      logger.info('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

getAuthToken();

