/**
 * Test Email Verification Code Validation
 * Run this to verify the backend is properly rejecting invalid codes
 */

const API_BASE = 'http://localhost:3001/api';

async function testVerification() {
  console.log('🧪 Testing Email Verification Code Validation\n');
  
  // Step 1: Send verification code
  console.log('Step 1: Sending verification code...');
  const sendResponse = await fetch(`${API_BASE}/auth/send-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: 'test@example.com',
      name: 'Test User'
    })
  });
  
  const sendData = await sendResponse.json();
  console.log('Response:', sendData);
  
  if (!sendData.verificationToken) {
    console.error('❌ Failed to get verification token');
    return;
  }
  
  const token = sendData.verificationToken;
  console.log(`✅ Got token: ${token.substring(0, 8)}...\n`);
  
  // Step 2: Try WRONG code
  console.log('Step 2: Testing with WRONG code (should fail)...');
  const wrongCode = '000000';
  const wrongResponse = await fetch(`${API_BASE}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      verificationToken: token,
      code: wrongCode
    })
  });
  
  const wrongData = await wrongResponse.json();
  console.log(`Status: ${wrongResponse.status}`);
  console.log('Response:', wrongData);
  
  if (wrongResponse.ok && wrongData.success) {
    console.error('❌ SECURITY ISSUE: Wrong code was accepted!');
    console.error('   This should NOT happen!');
  } else {
    console.log('✅ Correctly rejected wrong code');
  }
  
  console.log('\n');
  
  // Step 3: Try correct code (we need to get it from logs)
  console.log('Step 3: Check backend logs for the actual code');
  console.log('   The code should be logged in the backend window');
  console.log('   Then test with the correct code manually\n');
  
  // Step 4: Test format validation
  console.log('Step 4: Testing format validation...');
  const invalidCodes = ['12345', '1234567', 'abc123', '  123456  '];
  
  for (const invalidCode of invalidCodes) {
    const formatResponse = await fetch(`${API_BASE}/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationToken: token,
        code: invalidCode
      })
    });
    
    const formatData = await formatResponse.json();
    if (formatResponse.ok && formatData.success) {
      console.error(`❌ Invalid format accepted: "${invalidCode}"`);
    } else {
      console.log(`✅ Correctly rejected invalid format: "${invalidCode}"`);
    }
  }
  
  console.log('\n✅ Test complete!');
}

testVerification().catch(console.error);

