// Generate secure random secrets for production
const crypto = require('crypto');

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('\n🔐 Generate Production Secrets\n');
console.log('='.repeat(60));
console.log('\nCopy these to your Railway environment variables:\n');

console.log('JWT_SECRET=' + generateSecret(32));
console.log('SESSION_SECRET=' + generateSecret(32));
console.log('HMAC_SECRET=' + generateSecret(32));
console.log('ENCRYPTION_KEY=' + generateSecret(32));

console.log('\n' + '='.repeat(60));
console.log('\n✅ Secrets generated! Keep these secure!\n');

