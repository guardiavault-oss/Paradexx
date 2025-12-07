#!/usr/bin/env ts-node
/**
 * Script to replace console.log statements with structured logger
 * 
 * Usage:
 *   npm run replace-logs                    # Dry run (shows what would change)
 *   npm run replace-logs -- --write         # Actually replace files
 *   npm run replace-logs -- --file=path.ts  # Process single file
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Replacement {
  file: string;
  line: number;
  original: string;
  replacement: string;
}

const REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  // console.log(...) -> logger.info(...)
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.info(',
  },
  // console.error(...) -> logger.error(...)
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
  },
  // console.warn(...) -> logger.warn(...)
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
  },
  // console.debug(...) -> logger.debug(...)
  {
    pattern: /console\.debug\(/g,
    replacement: 'logger.debug(',
  },
  // console.info(...) -> logger.info(...)
  {
    pattern: /console\.info\(/g,
    replacement: 'logger.info(',
  },
];

// Files/directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules/**',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '*.min.js',
  '*.bundle.js',
  '**/*.test.ts',
  '**/*.spec.ts',
  'scripts/**', // Don't replace in scripts (this file)
];

function shouldExclude(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some((pattern) => {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(filePath);
  });
}

function findReplacements(filePath: string): Replacement[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const replacements: Replacement[] = [];

  lines.forEach((line, index) => {
    REPLACEMENTS.forEach(({ pattern, replacement }) => {
      if (pattern.test(line)) {
        const newLine = line.replace(pattern, replacement);
        if (newLine !== line) {
          replacements.push({
            file: filePath,
            line: index + 1,
            original: line.trim(),
            replacement: newLine.trim(),
          });
        }
      }
    });
  });

  return replacements;
}

function processFile(filePath: string, write: boolean): Replacement[] {
  // Skip directories
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    return [];
  }
  
  const replacements = findReplacements(filePath);

  if (write && replacements.length > 0) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if logger is already imported
    const hasLoggerImport = /import.*logger.*from.*logger/i.test(content);
    
    // Apply replacements
    REPLACEMENTS.forEach(({ pattern, replacement }) => {
      content = content.replace(pattern, replacement);
    });

    // Add logger import if needed and not present
    if (!hasLoggerImport && replacements.length > 0) {
      // Try to find import statements
      const importMatch = content.match(/^import\s+.*from\s+['"].*['"];?$/m);
      if (importMatch) {
        const lastImportIndex = content.lastIndexOf(importMatch[0]);
        const insertIndex = content.indexOf('\n', lastImportIndex) + 1;
        content = content.slice(0, insertIndex) + 
                  "import { logger } from '../services/logger.service';\n" +
                  content.slice(insertIndex);
      } else {
        // Add at the top
        content = "import { logger } from '../services/logger.service';\n" + content;
      }
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Updated: ${filePath} (${replacements.length} replacements)`);
  }

  return replacements;
}

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const fileArg = args.find((arg) => arg.startsWith('--file='));
  const singleFile = fileArg ? fileArg.split('=')[1] : null;

  console.log('🔍 Finding console.log statements...\n');

  let files: string[] = [];

  if (singleFile) {
    if (fs.existsSync(singleFile)) {
      files = [singleFile];
    } else {
      console.error(`❌ File not found: ${singleFile}`);
      process.exit(1);
    }
  } else {
    // Find all TypeScript/JavaScript files
    const patterns = ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.js', 'src/**/*.jsx'];
    const allFiles: string[] = [];
    
    for (const pattern of patterns) {
      const matches = await glob(pattern, { ignore: EXCLUDE_PATTERNS });
      allFiles.push(...matches);
    }

    files = [...new Set(allFiles)].filter((file) => !shouldExclude(file));
  }

  console.log(`Found ${files.length} files to check\n`);

  const allReplacements: Replacement[] = [];
  let processedCount = 0;

  for (const file of files) {
    const replacements = processFile(file, write);
    if (replacements.length > 0) {
      allReplacements.push(...replacements);
      processedCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files checked: ${files.length}`);
  console.log(`   Files with console.*: ${processedCount}`);
  console.log(`   Total replacements: ${allReplacements.length}`);

  if (!write) {
    console.log(`\n💡 Run with --write flag to actually replace files`);
    console.log(`   Example: npm run replace-logs -- --write`);
  } else {
    console.log(`\n✅ All files updated!`);
    console.log(`\n⚠️  Next steps:`);
    console.log(`   1. Review changes with: git diff`);
    console.log(`   2. Test your application`);
    console.log(`   3. Fix any import path issues`);
  }

  // Show sample replacements
  if (allReplacements.length > 0 && !write) {
    console.log(`\n📝 Sample replacements (first 5):`);
    allReplacements.slice(0, 5).forEach((r) => {
      console.log(`\n   ${r.file}:${r.line}`);
      console.log(`   - ${r.original}`);
      console.log(`   + ${r.replacement}`);
    });
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

