#!/usr/bin/env node
/**
 * Build Verification Script
 * Verifies that all assets referenced in index.html actually exist
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distPath = join(rootDir, 'dist/public');
const indexPath = join(distPath, 'index.html');

console.log('🔍 Verifying build output...\n');

// Check if build exists
if (!existsSync(distPath)) {
  console.error('❌ Build output not found!');
  console.error(`   Expected: ${distPath}`);
  console.error('   Run: npm run build');
  process.exit(1);
}

if (!existsSync(indexPath)) {
  console.error('❌ index.html not found!');
  console.error(`   Expected: ${indexPath}`);
  process.exit(1);
}

console.log('✅ Build output directory exists');
console.log('✅ index.html exists\n');

// Read HTML and extract asset references
const html = readFileSync(indexPath, 'utf-8');

// Find all asset references (JS, CSS, etc.)
const assetPatterns = [
  /href=["']([^"']+\.css)["']/g,
  /src=["']([^"']+\.js)["']/g,
  /src=["']([^"']+\.mjs)["']/g,
];

const assets = new Set();
assetPatterns.forEach(pattern => {
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const asset = match[1];
    // Only check assets in /assets/ directory
    if (asset.startsWith('/assets/') || asset.startsWith('assets/')) {
      assets.add(asset.startsWith('/') ? asset : `/${asset}`);
    }
  }
});

console.log(`📋 Found ${assets.size} asset references in HTML:\n`);

let allExist = true;
const missingAssets = [];

assets.forEach(asset => {
  const assetPath = join(distPath, asset.startsWith('/') ? asset.slice(1) : asset);
  
  if (existsSync(assetPath)) {
    const stats = statSync(assetPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`  ✅ ${asset} (${sizeKB} KB)`);
  } else {
    console.error(`  ❌ ${asset} - MISSING!`);
    missingAssets.push(asset);
    allExist = false;
  }
});

// Check assets directory
const assetsDir = join(distPath, 'assets');
if (existsSync(assetsDir)) {
  const assetFiles = readdirSync(assetsDir);
  console.log(`\n📦 Assets directory contains ${assetFiles.length} files`);
  
  // Check for orphaned assets (not referenced in HTML)
  const referencedAssets = Array.from(assets).map(a => 
    a.replace('/assets/', '').replace('assets/', '')
  );
  
  const orphaned = assetFiles.filter(file => 
    !referencedAssets.some(ref => file.includes(ref.split('-')[0]))
  );
  
  if (orphaned.length > 0 && orphaned.length < assetFiles.length) {
    console.log(`  ⚠️  ${orphaned.length} files not referenced (may be chunks)`);
  }
} else {
  console.error('\n❌ Assets directory not found!');
  allExist = false;
}

// Summary
console.log('\n' + '='.repeat(50));

if (allExist) {
  console.log('✅ Build verification PASSED');
  console.log('   All referenced assets exist');
  console.log('   Ready for deployment!');
  process.exit(0);
} else {
  console.error('❌ Build verification FAILED');
  console.error(`   ${missingAssets.length} asset(s) missing:`);
  missingAssets.forEach(asset => {
    console.error(`     - ${asset}`);
  });
  console.error('\n   Fix: Run `npm run build` again');
  process.exit(1);
}

