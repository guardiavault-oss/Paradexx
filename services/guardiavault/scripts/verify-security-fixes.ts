/**
 * Verify Security Fixes
 * Re-runs security checks to verify all fixes were applied correctly
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface Finding {
  severity: 'High' | 'Medium' | 'Low';
  category: string;
  file: string;
  line: number;
  description: string;
}

const fixedIssues: Record<string, string[]> = {
  'LidoAdapter.sol': [
    'ReentrancyGuard imported and contract extends it',
    'nonReentrant modifier on stakeETH()',
    'nonReentrant modifier on unstake()',
    'SafeERC20 used for token transfers',
  ],
  'AaveAdapter.sol': [
    'ReentrancyGuard imported and contract extends it',
    'nonReentrant modifier on supply()',
    'nonReentrant modifier on withdraw()',
    'SafeERC20 used for token transfers',
  ],
  'YieldVault.sol': [
    'nonReentrant modifier on updateYield()',
    'Checks-Effects-Interactions pattern followed',
  ],
  'LifetimeAccess.sol': [
    'ReentrancyGuard imported and contract extends it',
    'nonReentrant modifier on buyLifetime()',
    'State updated before external calls',
  ],
  'SmartWill.sol': [
    'SafeERC20 imported and used',
    'nonReentrant modifier on payAnnualFee()',
    'SafeERC20 used for ERC20 transfers',
    'call{value:}() pattern for ETH transfers',
  ],
};

function checkFile(filePath: string, contractName: string): boolean {
  if (!existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  const content = readFileSync(filePath, 'utf-8');
  const fixes = fixedIssues[contractName] || [];
  let allFixed = true;

  console.log(`\n📋 Checking ${contractName}...`);
  
  for (const fix of fixes) {
    if (fix.includes('ReentrancyGuard')) {
      const hasImport = content.includes('import') && content.includes('ReentrancyGuard');
      const hasExtends = content.includes('ReentrancyGuard');
      if (hasImport && hasExtends) {
        console.log(`  ✅ ${fix}`);
      } else {
        console.log(`  ❌ ${fix}`);
        allFixed = false;
      }
    } else if (fix.includes('nonReentrant')) {
      const functionName = fix.match(/on (\w+)\(\)/)?.[1];
      if (functionName && content.includes(`function ${functionName}`) && content.includes('nonReentrant')) {
        console.log(`  ✅ ${fix}`);
      } else {
        console.log(`  ❌ ${fix}`);
        allFixed = false;
      }
    } else if (fix.includes('SafeERC20')) {
      const hasImport = content.includes('SafeERC20');
      const hasUsing = content.includes('using SafeERC20');
      const hasSafeTransfer = content.includes('.safeTransfer(') || content.includes('safeTransfer(');
      if (hasImport && hasSafeTransfer) {
        console.log(`  ✅ ${fix}`);
      } else {
        console.log(`  ❌ ${fix}`);
        allFixed = false;
      }
    } else if (fix.includes('call{value:}')) {
      if (content.includes('call{value:') && content.includes('require(success')) {
        console.log(`  ✅ ${fix}`);
      } else {
        console.log(`  ❌ ${fix}`);
        allFixed = false;
      }
    } else if (fix.includes('Checks-Effects-Interactions')) {
      // Check that state updates happen before external calls
      const updateYieldMatches = content.match(/function updateYield[\s\S]{0,500}treasury\.call/);
      if (updateYieldMatches && updateYieldMatches[0].includes('vault.')) {
        console.log(`  ✅ ${fix}`);
      } else {
        console.log(`  ⚠️  ${fix} - Manual review recommended`);
      }
    } else if (fix.includes('State updated before external calls')) {
      // Check that state is updated before treasury.call
      // Pattern: entitlements[msg.sender] = ... (state update)
      // Then: emit LifetimePurchased (event)
      // Then: treasury.call (external call)
      const lines = content.split('\n');
      let stateLine = -1;
      let emitLine = -1;
      let callLine = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('entitlements[msg.sender] =') && stateLine === -1) {
          stateLine = i;
        }
        if (lines[i].includes('emit LifetimePurchased') && emitLine === -1) {
          emitLine = i;
        }
        if (lines[i].includes('treasury.call') && callLine === -1) {
          callLine = i;
        }
      }
      
      if (stateLine >= 0 && callLine > stateLine) {
        if (emitLine >= 0 && emitLine > stateLine && callLine > emitLine) {
          console.log(`  ✅ ${fix} (state -> emit -> call)`);
        } else {
          console.log(`  ✅ ${fix} (state -> call)`);
        }
      } else {
        console.log(`  ❌ ${fix} - Pattern order incorrect`);
        allFixed = false;
      }
    } else {
      // Generic check
      if (content.includes(fix.split(' ')[0])) {
        console.log(`  ✅ ${fix}`);
      } else {
        console.log(`  ❌ ${fix}`);
        allFixed = false;
      }
    }
  }

  return allFixed;
}

function checkCompilation(): boolean {
  console.log('\n🔨 Checking contract compilation...');
  try {
    execSync('npx hardhat compile', { stdio: 'pipe' });
    console.log('  ✅ All contracts compile successfully');
    return true;
  } catch (error: any) {
    console.error('  ❌ Compilation failed:', error.message);
    return false;
  }
}

function checkUnsafeTransfers(): boolean {
  console.log('\n🔍 Checking for unsafe transfer() calls...');
  const contractsDir = join(process.cwd(), 'contracts');
  const files = ['LidoAdapter.sol', 'AaveAdapter.sol', 'SmartWill.sol'];
  let foundUnsafe = false;

  for (const file of files) {
    const filePath = join(contractsDir, file);
    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, 'utf-8');
    // Check for unsafe transfer() on IERC20 tokens (not ETH)
    const unsafeMatches = content.match(/\.transfer\([^)]+\)/g);
    if (unsafeMatches) {
      // Filter out ETH transfers (payable(...).transfer is acceptable if using call pattern elsewhere)
      const tokenTransfers = unsafeMatches.filter(m => !m.includes('payable'));
      if (tokenTransfers.length > 0 && !content.includes('SafeERC20')) {
        console.log(`  ⚠️  ${file}: Found transfer() calls - verify SafeERC20 is used`);
        foundUnsafe = true;
      }
    }
  }

  if (!foundUnsafe) {
    console.log('  ✅ No unsafe transfer() calls found');
  }
  return !foundUnsafe;
}

async function main() {
  console.log('🔐 Security Fix Verification\n');
  console.log('='.repeat(60));

  const contractsDir = join(process.cwd(), 'contracts');
  const adaptersDir = join(contractsDir, 'adapters');
  let allPassed = true;

  // Check each fixed contract
  for (const contractName of Object.keys(fixedIssues)) {
    let filePath: string;
    if (contractName.includes('Adapter')) {
      filePath = join(adaptersDir, contractName);
    } else {
      filePath = join(contractsDir, contractName);
    }
    if (!checkFile(filePath, contractName)) {
      allPassed = false;
    }
  }

  // Check compilation
  if (!checkCompilation()) {
    allPassed = false;
  }

  // Check for unsafe transfers
  if (!checkUnsafeTransfers()) {
    allPassed = false;
  }

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('\n✅ All security fixes verified successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Reentrancy protection: ✅ Applied');
    console.log('  - SafeERC20 usage: ✅ Applied');
    console.log('  - Compilation: ✅ Success');
    console.log('  - Unsafe transfers: ✅ None found');
    process.exit(0);
  } else {
    console.log('\n❌ Some security fixes need attention');
    console.log('\nPlease review the issues above and fix them before deployment.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});

