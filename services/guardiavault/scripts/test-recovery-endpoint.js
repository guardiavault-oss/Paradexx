#!/usr/bin/env node
/**
 * Recovery Endpoint Test Script
 * Tests the vault recovery endpoint with actual fragments generated using Shamir Secret Sharing
 */

const fetch = require('node-fetch');
const { splitSecret, combineShares } = require('../server/services/shamir');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_SECRET = process.env.TEST_SECRET || 'test recovery phrase with twelve words minimum length for secure vault access';

async function testRecovery(scheme, fragments, vaultId = null) {
  const url = `${BASE_URL}/api/vaults/recover`;
  
  console.log(`\n🧪 Testing ${scheme} recovery:`);
  console.log(`   URL: ${url}`);
  console.log(`   Fragments provided: ${fragments.length}`);
  console.log(`   Vault ID: ${vaultId || 'none (auto-detect)'}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fragments,
        vaultId,
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Success!`);
      console.log(`   Scheme detected: ${data.scheme}`);
      console.log(`   Fragments used: ${data.fragmentsUsed}`);
      console.log(`   Secret reconstructed: ${data.secret.substring(0, 50)}...`);
      
      // Verify the reconstructed secret matches
      if (data.secret === TEST_SECRET) {
        console.log(`   ✅ Secret verification: PASSED`);
        return { success: true, scheme: data.scheme };
      } else {
        console.log(`   ❌ Secret verification: FAILED`);
        console.log(`   Expected: ${TEST_SECRET.substring(0, 50)}...`);
        console.log(`   Got: ${data.secret.substring(0, 50)}...`);
        return { success: false, error: 'Secret mismatch' };
      }
    } else {
      console.log(`   ❌ Failed: ${response.status}`);
      console.log(`   Error: ${data.message || JSON.stringify(data)}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Recovery Endpoint Tests');
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log(`🔐 Test Secret: ${TEST_SECRET.substring(0, 30)}...`);
  
  const results = {
    '2-of-3': [],
    '3-of-5': [],
    errors: [],
  };
  
  // Test 1: 2-of-3 with exactly 2 fragments
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: 2-of-3 scheme with exactly 2 fragments');
  console.log('='.repeat(60));
  try {
    const result23 = splitSecret(TEST_SECRET, 2, 3);
    const fragments23 = result23.shares.slice(0, 2);
    const testResult = await testRecovery('2-of-3', fragments23);
    results['2-of-3'].push({ test: '2 fragments', ...testResult });
  } catch (error) {
    results.errors.push({ test: '2-of-3 (2 frags)', error: error.message });
  }
  
  // Test 2: 2-of-3 with 3 fragments (extra)
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: 2-of-3 scheme with 3 fragments (extra fragment)');
  console.log('='.repeat(60));
  try {
    const result23 = splitSecret(TEST_SECRET, 2, 3);
    const fragments23 = result23.shares; // All 3
    const testResult = await testRecovery('2-of-3', fragments23);
    results['2-of-3'].push({ test: '3 fragments (extra)', ...testResult });
  } catch (error) {
    results.errors.push({ test: '2-of-3 (3 frags)', error: error.message });
  }
  
  // Test 3: 2-of-3 with different combinations
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: 2-of-3 scheme with different fragment combinations');
  console.log('='.repeat(60));
  try {
    const result23 = splitSecret(TEST_SECRET, 2, 3);
    const combinations = [
      [result23.shares[0], result23.shares[1]], // First 2
      [result23.shares[0], result23.shares[2]], // First and last
      [result23.shares[1], result23.shares[2]], // Last 2
    ];
    
    for (let i = 0; i < combinations.length; i++) {
      console.log(`\n   Testing combination ${i + 1}/3...`);
      const testResult = await testRecovery('2-of-3', combinations[i]);
      results['2-of-3'].push({ test: `combination ${i + 1}`, ...testResult });
    }
  } catch (error) {
    results.errors.push({ test: '2-of-3 combinations', error: error.message });
  }
  
  // Test 4: Legacy 3-of-5 with exactly 3 fragments
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Legacy 3-of-5 scheme with exactly 3 fragments');
  console.log('='.repeat(60));
  try {
    const result35 = splitSecret(TEST_SECRET, 3, 5);
    const fragments35 = result35.shares.slice(0, 3);
    // Simulate 5 fragments (duplicate last 2 for testing)
    const fragments35Full = [...fragments35, fragments35[0], fragments35[1]];
    const testResult = await testRecovery('3-of-5', fragments35Full);
    results['3-of-5'].push({ test: '3 fragments (5 provided)', ...testResult });
  } catch (error) {
    results.errors.push({ test: '3-of-5 (3 frags)', error: error.message });
  }
  
  // Test 5: Legacy 3-of-5 with all 5 fragments
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: Legacy 3-of-5 scheme with all 5 fragments');
  console.log('='.repeat(60));
  try {
    const result35 = splitSecret(TEST_SECRET, 3, 5);
    const fragments35 = result35.shares; // All 5
    const testResult = await testRecovery('3-of-5', fragments35);
    results['3-of-5'].push({ test: '5 fragments', ...testResult });
  } catch (error) {
    results.errors.push({ test: '3-of-5 (5 frags)', error: error.message });
  }
  
  // Test 6: Error case - insufficient fragments (1 fragment for 2-of-3)
  console.log('\n' + '='.repeat(60));
  console.log('TEST 6: Error case - insufficient fragments (1 fragment for 2-of-3)');
  console.log('='.repeat(60));
  try {
    const result23 = splitSecret(TEST_SECRET, 2, 3);
    const fragments23 = [result23.shares[0]]; // Only 1
    const testResult = await testRecovery('2-of-3', fragments23);
    if (!testResult.success) {
      console.log(`   ✅ Correctly rejected insufficient fragments`);
      results['2-of-3'].push({ test: 'insufficient fragments (expected fail)', success: true });
    } else {
      console.log(`   ❌ Should have rejected but didn't`);
      results.errors.push({ test: 'insufficient fragments', error: 'Should have failed' });
    }
  } catch (error) {
    results.errors.push({ test: 'insufficient fragments', error: error.message });
  }
  
  // Test 7: Error case - invalid fragments
  console.log('\n' + '='.repeat(60));
  console.log('TEST 7: Error case - invalid fragments');
  console.log('='.repeat(60));
  try {
    const invalidFragments = ['invalid-fragment-1', 'invalid-fragment-2'];
    const testResult = await testRecovery('2-of-3', invalidFragments);
    if (!testResult.success) {
      console.log(`   ✅ Correctly rejected invalid fragments`);
      results['2-of-3'].push({ test: 'invalid fragments (expected fail)', success: true });
    } else {
      console.log(`   ❌ Should have rejected but didn't`);
      results.errors.push({ test: 'invalid fragments', error: 'Should have failed' });
    }
  } catch (error) {
    results.errors.push({ test: 'invalid fragments', error: error.message });
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const totalTests = results['2-of-3'].length + results['3-of-5'].length;
  const passedTests = [
    ...results['2-of-3'].filter(r => r.success),
    ...results['3-of-5'].filter(r => r.success),
  ].length;
  
  console.log(`\n📊 Results:`);
  console.log(`   Total tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${totalTests - passedTests}`);
  console.log(`   Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors:`);
    results.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.test}: ${err.error}`);
    });
  }
  
  console.log(`\n✅ 2-of-3 tests: ${results['2-of-3'].filter(r => r.success).length}/${results['2-of-3'].length} passed`);
  console.log(`✅ 3-of-5 tests: ${results['3-of-5'].filter(r => r.success).length}/${results['3-of-5'].length} passed`);
  
  if (passedTests === totalTests && results.errors.length === 0) {
    console.log(`\n🎉 All tests passed!`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  Some tests failed. Review the output above.`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

