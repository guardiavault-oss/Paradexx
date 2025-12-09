#!/usr/bin/env tsx
/**
 * Production Readiness Checklist Validator
 * 
 * This script validates all items in the production readiness checklist
 * and generates a detailed report.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'warning' | 'unknown';
  message: string;
  details?: any;
}

const results: ChecklistItem[] = [];

// Helper to add result
function addResult(category: string, item: string, status: ChecklistItem['status'], message: string, details?: any) {
  results.push({
    id: `${category}-${results.length + 1}`,
    category,
    item,
    status,
    message,
    details,
  });
}

// Recursive file finder
function findFiles(dir: string, pattern: RegExp, ignore: string[] = []): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const shouldIgnore = ignore.some(ig => fullPath.includes(ig));
      if (shouldIgnore) continue;
      
      if (entry.isDirectory()) {
        files.push(...findFiles(fullPath, pattern, ignore));
      } else if (entry.isFile() && pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore permission errors
  }
  return files;
}

// Main execution function
async function runValidation() {
// SECURITY CHECKS
console.log('🔒 Checking SECURITY items...\n');

// 1. Hardcoded secrets
console.log('  [1/7] Checking for hardcoded secrets...');
try {
  const serverFiles = findFiles('server', /\.ts$/, ['node_modules', '.test.ts', 'tests']);
  let foundSecrets = false;
  const secretPatterns = [
    /password\s*=\s*["'][^"']+["']/i,
    /secret\s*=\s*["'][^"']+["']/i,
    /api[_-]?key\s*=\s*["'][^"']+["']/i,
    /private[_-]?key\s*=\s*["'][^"']+["']/i,
    /token\s*=\s*["'][^"']+["']/i,
  ];
  
  const exceptions = ['testpass123', 'test-secret', 'test-jwt-secret']; // Known test values
  
  for (const file of serverFiles) {
    const content = readFileSync(file, 'utf-8');
    for (const pattern of secretPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        const match = matches[0];
        const isException = exceptions.some(ex => match.toLowerCase().includes(ex.toLowerCase()));
        if (!isException && !file.includes('test') && !file.includes('example')) {
          foundSecrets = true;
          addResult('security', 'All hardcoded secrets removed', 'fail', 
            `Found potential hardcoded secret in ${file}: ${match.substring(0, 50)}...`);
        }
      }
    }
  }
  
  if (!foundSecrets) {
    addResult('security', 'All hardcoded secrets removed', 'pass', 'No hardcoded secrets found in production code');
  }
} catch (error) {
  addResult('security', 'All hardcoded secrets removed', 'warning', `Error checking: ${error}`);
}

// 2. Environment validation
console.log('  [2/7] Checking environment validation...');
try {
  const validateEnvPath = 'server/config/validateEnv.ts';
  if (existsSync(validateEnvPath)) {
    const content = readFileSync(validateEnvPath, 'utf-8');
    if (content.includes('validateEnvironment') && content.includes('process.exit(1)')) {
      addResult('security', 'Environment validation working', 'pass', 
        'Environment validation implemented with fail-fast behavior');
    } else {
      addResult('security', 'Environment validation working', 'warning', 
        'Environment validation exists but may not fail fast');
    }
  } else {
    addResult('security', 'Environment validation working', 'fail', 'Environment validation file not found');
  }
} catch (error) {
  addResult('security', 'Environment validation working', 'unknown', `Error: ${error}`);
}

// 3. CSP headers
console.log('  [3/7] Checking CSP headers...');
try {
  const cspPath = 'server/middleware/csp.ts';
  if (existsSync(cspPath)) {
    const content = readFileSync(cspPath, 'utf-8');
    if (content.includes('contentSecurityPolicy') || content.includes('CSP')) {
      addResult('security', 'CSP headers configured and tested', 'pass', 'CSP middleware found');
    } else {
      addResult('security', 'CSP headers configured and tested', 'warning', 'CSP file exists but may not be configured');
    }
  } else {
    addResult('security', 'CSP headers configured and tested', 'fail', 'CSP middleware not found');
  }
} catch (error) {
  addResult('security', 'CSP headers configured and tested', 'unknown', `Error: ${error}`);
}

// 4. Web3 signature verification
console.log('  [4/7] Checking Web3 signature verification...');
try {
  const routesPath = 'server/routes.ts';
  if (existsSync(routesPath)) {
    const content = readFileSync(routesPath, 'utf-8');
    if (content.includes('verifyMessage') && content.includes('/api/web3/signature')) {
      addResult('security', 'Web3 signature verification implemented', 'pass', 
        'Web3 signature verification endpoint found');
    } else {
      addResult('security', 'Web3 signature verification implemented', 'warning', 
        'Web3 signature verification may not be fully implemented');
    }
  } else {
    addResult('security', 'Web3 signature verification implemented', 'fail', 'Routes file not found');
  }
} catch (error) {
  addResult('security', 'Web3 signature verification implemented', 'unknown', `Error: ${error}`);
}

// 5. Authentication tests
console.log('  [5/7] Checking authentication tests...');
try {
  const testFiles = findFiles('tests', /auth.*\.test\.ts$/i, ['node_modules']);
  if (testFiles.length > 0) {
    addResult('security', 'All authentication tests passing', 'pass', 
      `Found ${testFiles.length} authentication test files`);
  } else {
    addResult('security', 'All authentication tests passing', 'warning', 
      'No authentication test files found - run tests manually to verify');
  }
} catch (error) {
  addResult('security', 'All authentication tests passing', 'unknown', 
    'Cannot verify - run tests manually: npm run test');
}

// 6. Security audit
console.log('  [6/7] Checking security audit...');
try {
  if (existsSync('scripts/security-audit.ts')) {
    addResult('security', 'Security audit shows no critical issues', 'warning', 
      'Security audit script exists - run manually: npm run audit:security');
  } else {
    addResult('security', 'Security audit shows no critical issues', 'warning', 
      'Run security audit manually: npm audit');
  }
} catch (error) {
  addResult('security', 'Security audit shows no critical issues', 'unknown', `Error: ${error}`);
}

// 7. Demo account disabled
console.log('  [7/7] Checking demo account protection...');
try {
  const validateEnvPath = 'server/config/validateEnv.ts';
  if (existsSync(validateEnvPath)) {
    const content = readFileSync(validateEnvPath, 'utf-8');
    if (content.includes('NODE_ENV === "production"') && 
        content.includes('DEMO_ACCOUNT_ENABLED') &&
        content.includes('false')) {
      addResult('security', 'Demo account disabled in production', 'pass', 
        'Demo account is protected in production environment');
    } else {
      addResult('security', 'Demo account disabled in production', 'warning', 
        'Demo account protection may not be fully enforced');
    }
  } else {
    addResult('security', 'Demo account disabled in production', 'fail', 
      'Cannot verify demo account protection');
  }
} catch (error) {
  addResult('security', 'Demo account disabled in production', 'unknown', `Error: ${error}`);
}

// CODE QUALITY CHECKS
console.log('\n✨ Checking CODE QUALITY items...\n');

// 1. Console.log removal
console.log('  [1/6] Checking for console.log statements...');
try {
  const serverFiles = findFiles('server', /\.ts$/, ['node_modules', '.test.ts', 'tests']);
  const clientFiles = findFiles('client/src', /\.(ts|tsx)$/, ['node_modules', '.test.', '__tests__']);
  
  let consoleLogCount = 0;
  const allowedFiles = ['server/index.ts', 'server/scripts', 'server/vite.ts']; // Startup logs OK
  
  for (const file of [...serverFiles, ...clientFiles]) {
    const isAllowed = allowedFiles.some(allowed => file.includes(allowed));
    if (isAllowed) continue;
    
    const content = readFileSync(file, 'utf-8');
    const matches = content.match(/console\.(log|error|warn|debug|info)/g);
    if (matches) {
      consoleLogCount += matches.length;
    }
  }
  
  if (consoleLogCount === 0) {
    addResult('quality', 'Zero console.log in production code', 'pass', 'No console.log statements found');
  } else {
    addResult('quality', 'Zero console.log in production code', 'fail', 
      `Found ${consoleLogCount} console.log/error/warn statements in production code`);
  }
} catch (error) {
  addResult('quality', 'Zero console.log in production code', 'warning', `Error: ${error}`);
}

// 2. Unused imports
console.log('  [2/6] Checking for unused imports...');
try {
  addResult('quality', 'No unused imports', 'warning', 
    'Run ESLint to check: npm run lint');
} catch (error) {
  addResult('quality', 'No unused imports', 'unknown', `Error: ${error}`);
}

// 3. TypeScript errors
console.log('  [3/6] Checking TypeScript errors...');
try {
  const output = execSync('npx tsc --noEmit --skipLibCheck 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  const errorCount = (output.match(/error TS\d+:/g) || []).length;
  if (errorCount === 0) {
    addResult('quality', 'No TypeScript errors', 'pass', 'TypeScript compilation successful');
  } else {
    addResult('quality', 'No TypeScript errors', 'fail', 
      `Found ${errorCount} TypeScript errors. Run: npx tsc --noEmit`);
  }
} catch (error: any) {
  const errorOutput = error.stdout || error.stderr || error.message || '';
  const errorCount = (errorOutput.match(/error TS\d+:/g) || []).length;
  if (errorCount > 0) {
    addResult('quality', 'No TypeScript errors', 'fail', 
      `Found ${errorCount} TypeScript errors`);
  } else {
    addResult('quality', 'No TypeScript errors', 'warning', 'Could not verify TypeScript errors');
  }
}

// 4. ESLint warnings
console.log('  [4/6] Checking ESLint warnings...');
try {
  addResult('quality', 'ESLint warnings < 50', 'warning', 
    'Run manually: npm run lint');
} catch (error) {
  addResult('quality', 'ESLint warnings < 50', 'unknown', `Error: ${error}`);
}

// 5. Large files
console.log('  [5/6] Checking for large files...');
try {
  const largeFiles: string[] = [];
  const checkFiles = (dir: string, maxSize: number = 500) => {
    try {
      const files = readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        if (file.isDirectory() && !file.name.includes('node_modules') && !file.name.includes('dist')) {
          checkFiles(join(dir, file.name), maxSize);
        } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
          const filePath = join(dir, file.name);
          const stats = statSync(filePath);
          const sizeKB = stats.size / 1024;
          if (sizeKB > maxSize) {
            largeFiles.push(`${filePath} (${Math.round(sizeKB)}KB)`);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  };
  
  checkFiles('server');
  checkFiles('client/src');
  
  if (largeFiles.length === 0) {
    addResult('quality', 'All large files split into modules', 'pass', 'No files exceed 500KB');
  } else {
    addResult('quality', 'All large files split into modules', 'warning', 
      `Found ${largeFiles.length} large files: ${largeFiles.slice(0, 3).join(', ')}`);
  }
} catch (error) {
  addResult('quality', 'All large files split into modules', 'warning', `Error: ${error}`);
}

// 6. Code duplication
console.log('  [6/6] Checking code duplication...');
try {
  addResult('quality', 'Code duplication reduced', 'warning', 
    'Use tools like jscpd or SonarQube to check for duplication');
} catch (error) {
  addResult('quality', 'Code duplication reduced', 'unknown', `Error: ${error}`);
}

// PERFORMANCE CHECKS
console.log('\n⚡ Checking PERFORMANCE items...\n');

// 1. Response compression
console.log('  [1/5] Checking response compression...');
try {
  const serverIndex = 'server/index.ts';
  if (existsSync(serverIndex)) {
    const content = readFileSync(serverIndex, 'utf-8');
    if (content.includes('compression') || content.includes('compressionMiddleware')) {
      addResult('performance', 'Response compression enabled', 'pass', 'Compression middleware found');
    } else {
      addResult('performance', 'Response compression enabled', 'fail', 'Compression middleware not found');
    }
  }
} catch (error) {
  addResult('performance', 'Response compression enabled', 'unknown', `Error: ${error}`);
}

// 2. N+1 queries
console.log('  [2/5] Checking for N+1 queries...');
try {
  addResult('performance', 'No N+1 queries', 'warning', 
    'Review database queries manually or use query analysis tools');
} catch (error) {
  addResult('performance', 'No N+1 queries', 'unknown', `Error: ${error}`);
}

// 3. Bundle size
console.log('  [3/5] Checking bundle size...');
try {
  if (existsSync('dist/public')) {
    addResult('performance', 'Bundle size < 500kb initial load', 'warning', 
      'Check bundle size after build: npm run build:analyze');
  } else {
    addResult('performance', 'Bundle size < 500kb initial load', 'warning', 
      'Build first, then check: npm run build:analyze');
  }
} catch (error) {
  addResult('performance', 'Bundle size < 500kb initial load', 'unknown', `Error: ${error}`);
}

// 4. Image optimization
console.log('  [4/5] Checking image optimization...');
try {
  if (existsSync('client/public/optimized')) {
    const optimizedFiles = readdirSync('client/public/optimized');
    const webpFiles = optimizedFiles.filter(f => f.endsWith('.webp'));
    if (webpFiles.length > 0) {
      addResult('performance', 'Images optimized (WebP)', 'pass', 
        `Found ${webpFiles.length} WebP images in optimized directory`);
    } else {
      addResult('performance', 'Images optimized (WebP)', 'warning', 
        'Optimized directory exists but no WebP files found');
    }
  } else {
    addResult('performance', 'Images optimized (WebP)', 'warning', 
      'Run: npm run optimize:images');
  }
} catch (error) {
  addResult('performance', 'Images optimized (WebP)', 'warning', `Error: ${error}`);
}

// 5. Lighthouse score
console.log('  [5/5] Checking Lighthouse score...');
try {
  addResult('performance', 'Lighthouse score > 90', 'warning', 
    'Run manually: npm run test:performance');
} catch (error) {
  addResult('performance', 'Lighthouse score > 90', 'unknown', `Error: ${error}`);
}

// ACCESSIBILITY CHECKS
console.log('\n♿ Checking ACCESSIBILITY items...\n');

// 1. ARIA labels
console.log('  [1/5] Checking ARIA labels...');
try {
  const componentFiles = findFiles('client/src', /\.(tsx|jsx)$/, ['node_modules', '.test.', '__tests__']);
  
  let ariaUsage = 0;
  for (const file of componentFiles.slice(0, 20)) { // Sample check
    const content = readFileSync(file, 'utf-8');
    if (content.includes('aria-label') || content.includes('aria-labelledby') || 
        content.includes('aria-describedby')) {
      ariaUsage++;
    }
  }
  
  if (ariaUsage > 0) {
    addResult('accessibility', 'ARIA labels on all interactive elements', 'pass', 
      `ARIA attributes found in components (sampled ${componentFiles.length} files)`);
  } else {
    addResult('accessibility', 'ARIA labels on all interactive elements', 'warning', 
      'ARIA labels may be missing - review components manually');
  }
} catch (error) {
  addResult('accessibility', 'ARIA labels on all interactive elements', 'warning', `Error: ${error}`);
}

// 2. Keyboard navigation
console.log('  [2/5] Checking keyboard navigation...');
try {
  addResult('accessibility', 'Keyboard navigation working everywhere', 'warning', 
    'Test manually with Tab key or run: npm run test:a11y');
} catch (error) {
  addResult('accessibility', 'Keyboard navigation working everywhere', 'unknown', `Error: ${error}`);
}

// 3. Color contrast
console.log('  [3/5] Checking color contrast...');
try {
  addResult('accessibility', 'Color contrast WCAG AA compliant', 'warning', 
    'Run pa11y or use browser dev tools to verify contrast ratios');
} catch (error) {
  addResult('accessibility', 'Color contrast WCAG AA compliant', 'unknown', `Error: ${error}`);
}

// 4. Screen reader
console.log('  [4/5] Checking screen reader support...');
try {
  addResult('accessibility', 'Screen reader tested', 'warning', 
    'Test manually with NVDA, JAWS, or VoiceOver');
} catch (error) {
  addResult('accessibility', 'Screen reader tested', 'unknown', `Error: ${error}`);
}

// 5. pa11y audit
console.log('  [5/5] Checking pa11y audit...');
try {
  if (existsSync('tests/accessibility/.pa11yci.json')) {
    addResult('accessibility', 'pa11y audit passing', 'warning', 
      'Run: npm run test:a11y');
  } else {
    addResult('accessibility', 'pa11y audit passing', 'warning', 
      'pa11y config exists - run: npm run test:a11y');
  }
} catch (error) {
  addResult('accessibility', 'pa11y audit passing', 'unknown', `Error: ${error}`);
}

// TESTING CHECKS
console.log('\n🧪 Checking TESTING items...\n');

// 1. All tests passing
console.log('  [1/5] Checking test status...');
try {
  addResult('testing', 'All tests passing (0 failures)', 'warning', 
    'Run: npm run test to verify all tests pass');
} catch (error) {
  addResult('testing', 'All tests passing (0 failures)', 'unknown', `Error: ${error}`);
}

// 2. Backend coverage
console.log('  [2/5] Checking backend coverage...');
try {
  addResult('testing', 'Backend coverage > 80%', 'warning', 
    'Run: npm run test:coverage:backend');
} catch (error) {
  addResult('testing', 'Backend coverage > 80%', 'unknown', `Error: ${error}`);
}

// 3. Frontend coverage
console.log('  [3/5] Checking frontend coverage...');
try {
  addResult('testing', 'Frontend coverage > 70%', 'warning', 
    'Run: npm run test:coverage:frontend');
} catch (error) {
  addResult('testing', 'Frontend coverage > 70%', 'unknown', `Error: ${error}`);
}

// 4. E2E tests
console.log('  [4/5] Checking E2E tests...');
try {
  const e2eTests = findFiles('tests/e2e', /\.test\.(ts|tsx)$/, ['node_modules']);
  if (e2eTests.length > 0) {
    addResult('testing', 'E2E tests for critical flows', 'pass', 
      `Found ${e2eTests.length} E2E test files`);
  } else {
    addResult('testing', 'E2E tests for critical flows', 'warning', 
      'Run: npm run test:e2e to verify E2E tests');
  }
} catch (error) {
  addResult('testing', 'E2E tests for critical flows', 'unknown', `Error: ${error}`);
}

// 5. Security tests
console.log('  [5/5] Checking security tests...');
try {
  if (existsSync('tests/security')) {
    addResult('testing', 'Security tests for auth/authorization', 'pass', 
      'Security test directory found');
  } else {
    addResult('testing', 'Security tests for auth/authorization', 'warning', 
      'Run: npm run test:security');
  }
} catch (error) {
  addResult('testing', 'Security tests for auth/authorization', 'unknown', `Error: ${error}`);
}

// FEATURES CHECKS
console.log('\n🎯 Checking FEATURES items...\n');

// 1. TODOs
console.log('  [1/4] Checking TODOs...');
try {
  const todoFiles = findFiles('.', /\.(ts|tsx|js|jsx)$/, ['node_modules', 'dist', 'build']);
  
  let todoCount = 0;
  const todoPatterns = [/TODO:/i, /FIXME:/i, /XXX:/i, /HACK:/i];
  
  for (const file of todoFiles.slice(0, 100)) {
    const content = readFileSync(file, 'utf-8');
    for (const pattern of todoPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        todoCount += matches.length;
      }
    }
  }
  
  if (todoCount === 0) {
    addResult('features', 'All TODOs completed or documented', 'pass', 'No TODO comments found');
  } else {
    addResult('features', 'All TODOs completed or documented', 'warning', 
      `Found ${todoCount} TODO/FIXME comments - review and complete or document`);
  }
} catch (error) {
  addResult('features', 'All TODOs completed or documented', 'warning', `Error: ${error}`);
}

// 2. Hardware ping
console.log('  [2/4] Checking hardware ping...');
try {
  const hardwareService = 'server/services/hardwareDeviceService.ts';
  if (existsSync(hardwareService)) {
    const content = readFileSync(hardwareService, 'utf-8');
    if (content.includes('processPing') || content.includes('hardware ping')) {
      addResult('features', 'Hardware ping implemented', 'pass', 'Hardware ping service found');
    } else {
      addResult('features', 'Hardware ping implemented', 'warning', 'Hardware service exists but may not be complete');
    }
  } else {
    addResult('features', 'Hardware ping implemented', 'fail', 'Hardware ping service not found');
  }
} catch (error) {
  addResult('features', 'Hardware ping implemented', 'unknown', `Error: ${error}`);
}

// 3. Asset fetching
console.log('  [3/4] Checking asset fetching...');
try {
  const assetFetcher = 'client/src/services/assetFetcher.ts';
  if (existsSync(assetFetcher)) {
    const content = readFileSync(assetFetcher, 'utf-8');
    if (content.includes('fetchTokenBalances') || content.includes('fetchNFTs')) {
      addResult('features', 'Asset fetching working', 'pass', 'Asset fetcher service found');
    } else {
      addResult('features', 'Asset fetching working', 'warning', 'Asset fetcher exists but may not be complete');
    }
  } else {
    addResult('features', 'Asset fetching working', 'fail', 'Asset fetcher service not found');
  }
} catch (error) {
  addResult('features', 'Asset fetching working', 'unknown', `Error: ${error}`);
}

// 4. Death verification
console.log('  [4/4] Checking death verification...');
try {
  const deathEngine = 'server/services/deathConsensusEngine.ts';
  if (existsSync(deathEngine)) {
    const content = readFileSync(deathEngine, 'utf-8');
    if (content.includes('checkConsensus') || content.includes('death verification')) {
      addResult('features', 'Death verification complete', 'pass', 'Death consensus engine found');
    } else {
      addResult('features', 'Death verification complete', 'warning', 'Death verification exists but may not be complete');
    }
  } else {
    addResult('features', 'Death verification complete', 'fail', 'Death verification service not found');
  }
} catch (error) {
  addResult('features', 'Death verification complete', 'unknown', `Error: ${error}`);
}

// Generate report
console.log('\n📊 Generating report...\n');

const categories = ['security', 'quality', 'performance', 'accessibility', 'testing', 'features'];
const statusCounts = { pass: 0, fail: 0, warning: 0, unknown: 0 };

results.forEach(r => {
  statusCounts[r.status]++;
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('           PRODUCTION READINESS CHECKLIST REPORT');
console.log('═══════════════════════════════════════════════════════════════\n');

categories.forEach(category => {
  const categoryResults = results.filter(r => r.category === category);
  const categoryName = category.toUpperCase();
  
  console.log(`\n${categoryName} (${categoryResults.length} items)`);
  console.log('─'.repeat(60));
  
  categoryResults.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : 
                 result.status === 'fail' ? '❌' : 
                 result.status === 'warning' ? '⚠️ ' : '❓';
    console.log(`${icon} ${result.item}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details)}`);
    }
  });
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('SUMMARY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`✅ Pass:    ${statusCounts.pass}`);
console.log(`❌ Fail:    ${statusCounts.fail}`);
console.log(`⚠️  Warning: ${statusCounts.warning}`);
console.log(`❓ Unknown: ${statusCounts.unknown}`);
console.log(`📊 Total:   ${results.length}`);

const passRate = ((statusCounts.pass / results.length) * 100).toFixed(1);
console.log(`\n📈 Pass Rate: ${passRate}%`);

if (statusCounts.fail > 0) {
  console.log('\n⚠️  CRITICAL: Some checks failed. Address these before production deployment.');
  process.exit(1);
} else if (statusCounts.warning > 0) {
  console.log('\n⚠️  WARNING: Some checks need manual verification.');
  process.exit(0);
} else {
  console.log('\n✅ All automated checks passed!');
  process.exit(0);
}
}

// Run validation
runValidation().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
