#!/usr/bin/env ts-node
/**
 * Script to apply asyncHandler to async routes
 * 
 * Usage:
 *   npm run apply-asynchandler                    # Dry run
 *   npm run apply-asynchandler -- --write        # Actually update files
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface RouteUpdate {
  file: string;
  line: number;
  original: string;
  updated: string;
}

const ROUTE_PATTERNS = [
  /router\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]\s*,\s*async\s*\(/g,
  /router\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]\s*,\s*\(req.*res.*\)\s*=>\s*\{/g,
];

function shouldExclude(filePath: string): boolean {
  const exclude = [
    'node_modules',
    'dist',
    'build',
    '.next',
    'coverage',
    'scripts',
    '*.test.ts',
    '*.spec.ts',
  ];
  return exclude.some(pattern => filePath.includes(pattern));
}

function processFile(filePath: string, write: boolean): RouteUpdate[] {
  if (shouldExclude(filePath)) {
    return [];
  }

  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const updates: RouteUpdate[] = [];
  
  // Check if asyncHandler is already imported
  const hasAsyncHandlerImport = /import.*asyncHandler/i.test(content);
  
  // Check if file already uses asyncHandler
  if (content.includes('asyncHandler')) {
    return []; // Already using asyncHandler
  }

  let needsImport = false;
  const newLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let updated = line;
    
    // Match: router.get('/path', async (req, res) => {
    const asyncRouteMatch = line.match(/router\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]\s*,\s*async\s*\(/);
    if (asyncRouteMatch && !line.includes('asyncHandler')) {
      const method = asyncRouteMatch[1];
      const path = asyncRouteMatch[2];
      
      // Check if next line starts with try block (indicates manual error handling)
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      const hasTryBlock = nextLine.trim().startsWith('try');
      
      if (hasTryBlock) {
        // Wrap with asyncHandler
        updated = line.replace(
          /router\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]\s*,\s*async\s*\(/,
          `router.$1('${path}', asyncHandler(async (`
        );
        
        updates.push({
          file: filePath,
          line: i + 1,
          original: line.trim(),
          updated: updated.trim(),
        });
        
        needsImport = true;
      }
    }
    
    newLines.push(updated);
  }

  if (write && updates.length > 0) {
    let finalContent = newLines.join('\n');
    
    // Add import if needed
    if (needsImport && !hasAsyncHandlerImport) {
      // Find last import statement
      const importMatch = finalContent.match(/^import\s+.*from\s+['"].*['"];?$/m);
      if (importMatch) {
        const lastImportIndex = finalContent.lastIndexOf(importMatch[0]);
        const insertIndex = finalContent.indexOf('\n', lastImportIndex) + 1;
        finalContent = finalContent.slice(0, insertIndex) + 
                      "import { asyncHandler } from '../utils/asyncHandler';\n" +
                      finalContent.slice(insertIndex);
      } else {
        // Add at top after other imports
        const firstLine = finalContent.split('\n')[0];
        finalContent = "import { asyncHandler } from '../utils/asyncHandler';\n" + finalContent;
      }
    }
    
    fs.writeFileSync(filePath, finalContent, 'utf-8');
    console.log(`✅ Updated: ${filePath} (${updates.length} routes)`);
  }

  return updates;
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  
  console.log('🔍 Finding async routes to wrap with asyncHandler...\n');

  const patterns = ['src/backend/routes/**/*.ts'];
  const allFiles: string[] = [];
  
  for (const pattern of patterns) {
    const matches = await glob(pattern, { ignore: ['node_modules/**', 'dist/**'] });
    allFiles.push(...matches);
  }

  const files = [...new Set(allFiles)].filter(file => !shouldExclude(file));
  console.log(`Found ${files.length} route files to check\n`);

  const allUpdates: RouteUpdate[] = [];
  let processedCount = 0;

  for (const file of files) {
    const updates = processFile(file, write);
    if (updates.length > 0) {
      allUpdates.push(...updates);
      processedCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files checked: ${files.length}`);
  console.log(`   Files updated: ${processedCount}`);
  console.log(`   Total routes wrapped: ${allUpdates.length}`);

  if (!write) {
    console.log(`\n💡 Run with --write flag to actually update files`);
    console.log(`   Example: npm run apply-asynchandler -- --write`);
  } else {
    console.log(`\n✅ All files updated!`);
  }

  if (allUpdates.length > 0 && !write) {
    console.log(`\n📝 Sample updates (first 5):`);
    allUpdates.slice(0, 5).forEach((u) => {
      console.log(`\n   ${u.file}:${u.line}`);
      console.log(`   - ${u.original}`);
      console.log(`   + ${u.updated}`);
    });
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

