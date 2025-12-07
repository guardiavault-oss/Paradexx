/**
 * Generate Production Security Secrets
 * Generates secure random keys for production deployment
 */

import crypto from 'crypto';

console.log('\n🔐 GuardiaVault - Production Security Keys\n');
console.log('Copy these values to your Railway environment variables:\n');
console.log('=' .repeat(70));

// Generate SESSION_SECRET
const sessionSecret = crypto.randomBytes(32).toString('base64');
console.log('\nSESSION_SECRET (for Express sessions):');
console.log(sessionSecret);

// Generate SSN_SALT
const ssnSalt = crypto.randomBytes(16).toString('hex');
console.log('\nSSN_SALT (for SSN hashing):');
console.log(ssnSalt);

// Generate ENCRYPTION_KEY
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('\nENCRYPTION_KEY (for AES-256-GCM encryption):');
console.log(encryptionKey);

// Generate NOTIFY_HMAC_SECRET
const notifyHmac = crypto.randomBytes(32).toString('base64');
console.log('\nNOTIFY_HMAC_SECRET (for notification tokens):');
console.log(notifyHmac);

console.log('\n' + '='.repeat(70));
console.log('\n⚠️  IMPORTANT:');
console.log('1. Save these values securely - you won\'t see them again!');
console.log('2. Add them to Railway: Project > Variables');
console.log('3. Never commit these to git');
console.log('4. Use different values for staging and production\n');

// Also output as Railway CLI commands
console.log('📋 Railway CLI commands (copy and run):');
console.log('=' .repeat(70));
console.log(`\nrailway variables --set SESSION_SECRET="${sessionSecret}"`);
console.log(`railway variables --set SSN_SALT="${ssnSalt}"`);
console.log(`railway variables --set ENCRYPTION_KEY="${encryptionKey}"`);
console.log(`railway variables --set NOTIFY_HMAC_SECRET="${notifyHmac}"`);
console.log();
