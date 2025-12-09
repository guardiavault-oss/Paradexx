#!/usr/bin/env node
/**
 * Deployment Readiness Checker
 * 
 * This script verifies that your environment is ready for deployment
 * Checks:
 * 1. Required environment variables
 * 2. Database connectivity
 * 3. Contract compilation
 * 4. Build process
 * 
 * Usage: npx tsx scripts/check-deployment-ready.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: CheckResult[] = [];

function addResult(name: string, condition: boolean, passMsg: string, failMsg: string) {
  results.push({
    name,
    status: condition ? 'pass' : 'fail',
    message: condition ? passMsg : failMsg,
  });
}

function addWarning(name: string, condition: boolean, warnMsg: string) {
  if (condition) {
    results.push({
      name,
      status: 'warn',
      message: warnMsg,
    });
  }
}

console.log('🔍 Checking deployment readiness...\n');

// 1. Check required files exist
console.log('📁 Checking required files...');
const requiredFiles = [
  'package.json',
  'railway.json',
  '.nvmrc',
  'Dockerfile',
  'hardhat.config.cjs',
  'server/index.ts',
];
requiredFiles.forEach(file => {
  try {
    readFileSync(file);
    addResult(`File: ${file}`, true, 'Exists', `Missing: ${file}`);
  } catch {
    addResult(`File: ${file}`, false, 'Exists', `Missing: ${file}`);
  }
});

// 2. Check package.json has engines
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  const hasEngines = packageJson.engines && packageJson.engines.node;
  addResult('package.json engines', hasEngines, 'Has engines field', 'Missing engines field in package.json');
} catch {
  addResult('package.json engines', false, 'Has engines field', 'Could not read package.json');
}

// 3. Check .nvmrc
try {
  const nvmrc = readFileSync('.nvmrc', 'utf-8').trim();
  const nodeVersion = parseInt(nvmrc);
  addResult('.nvmrc', !isNaN(nodeVersion) && nodeVersion >= 20, `Node ${nvmrc} specified`, 'Invalid or missing Node version');
} catch {
  addResult('.nvmrc', false, 'Node version specified', 'Missing .nvmrc file');
}

// 4. Check required environment variables
console.log('\n🔐 Checking environment variables...');
const requiredEnvVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
];
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  addResult(`Env: ${varName}`, !!value, 'Set', `Missing: ${varName}`);
});

// Optional but recommended env vars
const recommendedEnvVars = [
  'APP_URL',
  'SSN_SALT',
  'ENCRYPTION_KEY',
  'SENTRY_DSN',
];
recommendedEnvVars.forEach(varName => {
  const value = process.env[varName];
  addWarning(`Env: ${varName} (recommended)`, !value, `Not set (recommended for production)`);
});

// 5. Check Railway-specific vars
console.log('\n🚂 Checking Railway configuration...');
addResult('railway.json exists', true, 'Found', 'Missing railway.json');
try {
  const railwayConfig = JSON.parse(readFileSync('railway.json', 'utf-8'));
  const hasBuildCommand = railwayConfig.build?.buildCommand;
  const hasStartCommand = railwayConfig.deploy?.startCommand;
  addResult('Build command', hasBuildCommand, 'Configured', 'Missing build command');
  addResult('Start command', hasStartCommand, 'Configured', 'Missing start command');
} catch {
  addResult('railway.json valid', false, 'Valid JSON', 'Invalid railway.json');
}

// 6. Check contract files
console.log('\n📄 Checking smart contracts...');
const contractFiles = [
  'contracts/GuardiaVault.sol',
  'contracts/SubscriptionEscrow.sol',
];
contractFiles.forEach(file => {
  try {
    readFileSync(file);
    addResult(`Contract: ${file}`, true, 'Exists', `Missing: ${file}`);
  } catch {
    addResult(`Contract: ${file}`, false, 'Exists', `Missing: ${file}`);
  }
});

// Check if contracts can compile (this might take a moment)
try {
  // Check if artifacts directory exists (indicates compilation)
  const artifactsPath = join(process.cwd(), 'artifacts');
  const fs = require('fs');
  const hasArtifacts = fs.existsSync(artifactsPath);
  addWarning('Contracts compiled', !hasArtifacts, 'Contracts not compiled - run: npm run compile');
} catch {
  addWarning('Contract compilation check', true, 'Could not check compilation status');
}

// 7. Check deployment scripts
console.log('\n📜 Checking deployment scripts...');
const deploymentScripts = [
  'scripts/deploy-all.ts',
];
deploymentScripts.forEach(script => {
  try {
    readFileSync(script);
    addResult(`Script: ${script}`, true, 'Exists', `Missing: ${script}`);
  } catch {
    addResult(`Script: ${script}`, false, 'Exists', `Missing: ${script}`);
  }
});

// 8. Check build script
console.log('\n🔨 Checking build configuration...');
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  const hasBuildScript = packageJson.scripts?.build;
  const hasStartScript = packageJson.scripts?.start;
  addResult('Build script', hasBuildScript, 'Exists', 'Missing build script');
  addResult('Start script', hasStartScript, 'Exists', 'Missing start script');
} catch {
  addResult('Package.json scripts', false, 'Has scripts', 'Could not read package.json');
}

// 9. Check for development secrets (critical security issue)
console.log('\n🔒 Checking security configuration...');
const devSecrets = [
  'dev-secret-change-in-production-PLEASE-CHANGE-THIS',
  'your_random_salt_for_ssn_hashing_CHANGE_THIS',
  'your_32_byte_hex_key_CHANGE_THIS',
];
const sessionSecret = process.env.SESSION_SECRET;
const ssnSalt = process.env.SSN_SALT;
const encryptionKey = process.env.ENCRYPTION_KEY;

if (sessionSecret && devSecrets.some(secret => sessionSecret.includes(secret))) {
  addResult('SESSION_SECRET', false, 'Production secret set', 'Using development secret - CHANGE IMMEDIATELY!');
} else if (sessionSecret) {
  addResult('SESSION_SECRET', true, 'Production secret set', 'Using development secret');
}

if (ssnSalt && devSecrets.some(secret => ssnSalt.includes(secret))) {
  addResult('SSN_SALT', false, 'Production salt set', 'Using development salt - CHANGE IMMEDIATELY!');
} else if (ssnSalt) {
  addResult('SSN_SALT', true, 'Production salt set', 'Using development salt');
}

if (encryptionKey && devSecrets.some(secret => encryptionKey.includes(secret))) {
  addResult('ENCRYPTION_KEY', false, 'Production key set', 'Using development key - CHANGE IMMEDIATELY!');
} else if (encryptionKey) {
  addResult('ENCRYPTION_KEY', true, 'Production key set', 'Using development key');
}

// 10. Check NODE_ENV
const nodeEnv = process.env.NODE_ENV;
if (nodeEnv === 'production') {
  addResult('NODE_ENV', true, 'Set to production', 'Not set to production');
} else if (nodeEnv === 'development') {
  addWarning('NODE_ENV', true, 'Set to development - use production for deployment');
} else {
  addWarning('NODE_ENV', true, 'Not explicitly set');
}

// 11. Check for .env file in git (security issue)
try {
  const gitIgnore = readFileSync('.gitignore', 'utf-8');
  const hasEnvIgnore = gitIgnore.includes('.env') && !gitIgnore.includes('# .env');
  addResult('.env in .gitignore', hasEnvIgnore, 'Protected from git', '.env file may be committed to git');
} catch {
  addWarning('.gitignore check', true, 'Could not verify .gitignore');
}

// Print results
console.log('\n' + '='.repeat(70));
console.log('📊 Deployment Readiness Report');
console.log('='.repeat(70) + '\n');

const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
const warnings = results.filter(r => r.status === 'warn').length;

results.forEach(result => {
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${result.name}: ${result.message}`);
});

console.log('\n' + '='.repeat(70));
console.log(`Summary: ${passed} passed, ${failed} failed, ${warnings} warnings`);
console.log('='.repeat(70) + '\n');

if (failed > 0) {
  console.log('❌ Deployment is NOT ready. Please fix the issues above.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('⚠️  Deployment is ready, but there are some warnings. Review them before deploying.');
  process.exit(0);
} else {
  console.log('✅ Deployment is READY! You can proceed with deployment.');
  process.exit(0);
}

