/**
 * Test Resend Email Configuration
 * Run this to verify your Resend API key is working
 */

require('dotenv').config();
const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TEST_EMAIL = process.argv[2] || process.env.TEST_EMAIL || 'your-email@example.com';

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not found in .env file');
  process.exit(1);
}

console.log('🔍 Testing Resend email configuration...\n');
console.log(`API Key: ${RESEND_API_KEY.substring(0, 10)}...`);
console.log(`Test Email: ${TEST_EMAIL}\n`);

const resend = new Resend(RESEND_API_KEY);

async function testEmail() {
  try {
    console.log('📧 Sending test email...\n');
    
    const result = await resend.emails.send({
      from: 'Paradex <noreply@aldvra.resend.app>',
      to: TEST_EMAIL,
      subject: 'Test Email from Paradex',
      html: `
        <h1>Test Email</h1>
        <p>If you received this, your Resend configuration is working!</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    });

    if (result.error) {
      console.error('❌ Error sending email:');
      console.error(JSON.stringify(result.error, null, 2));
      process.exit(1);
    }

    console.log('✅ Email sent successfully!');
    console.log(`Email ID: ${result.data?.id || 'N/A'}`);
    console.log(`\n📬 Check your inbox at: ${TEST_EMAIL}`);
    console.log('   (Also check spam folder)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testEmail();

