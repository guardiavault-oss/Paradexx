#!/usr/bin/env node

/**
 * Token Migration Script
 * 
 * Migrates old design system tokens to new Paradox Wallet design system.
 * Scans all .tsx, .ts, and .css files and replaces old tokens with new ones.
 * 
 * Usage:
 *   npx tsx design-system/migrate-tokens.ts [--dry-run] [--path=./components]
 * 
 * Options:
 *   --dry-run    Show what would be changed without making changes
 *   --path       Specify path to scan (default: current directory)
 *   --verbose    Show detailed logging
 *   --backup     Create backup files before modifying
 */

import * as fs from 'fs';
import * as path from 'path';
import tokenMapping from './token-mapping.json';

interface MigrationResult {
  filePath: string;
  changes: Array<{
    line: number;
    old: string;
    new: string;
    type: 'typescript' | 'css' | 'inline-style' | 'color-value';
  }>;
  modified: boolean;
}

interface MigrationOptions {
  dryRun: boolean;
  verbose: boolean;
  backup: boolean;
  targetPath: string;
}

class TokenMigrator {
  private results: MigrationResult[] = [];
  private options: MigrationOptions;
  private totalChanges = 0;

  constructor(options: MigrationOptions) {
    this.options = options;
  }

  /**
   * Main migration function
   */
  async migrate(): Promise<void> {
    console.log('🚀 Starting Token Migration...\n');
    console.log(`Target Path: ${this.options.targetPath}`);
    console.log(`Mode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    const files = this.scanDirectory(this.options.targetPath);
    console.log(`📁 Found ${files.length} files to process\n`);

    for (const file of files) {
      await this.processFile(file);
    }

    this.printSummary();
  }

  /**
   * Recursively scan directory for relevant files
   */
  private scanDirectory(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      // Skip node_modules, .git, build directories
      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          files.push(...this.scanDirectory(fullPath));
        }
      } else if (stat.isFile()) {
        // Process .tsx, .ts, .css files
        const ext = path.extname(fullPath);
        if (['.tsx', '.ts', '.css'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Process a single file
   */
  private async processFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const changes: MigrationResult['changes'] = [];
    let modifiedContent = content;
    let hasChanges = false;

    // Determine file type
    const ext = path.extname(filePath);
    const isCss = ext === '.css';
    const isTypeScript = ['.tsx', '.ts'].includes(ext);

    if (isCss) {
      // Process CSS files
      modifiedContent = this.migrateCssFile(content, filePath, changes);
      hasChanges = changes.length > 0;
    } else if (isTypeScript) {
      // Process TypeScript/TSX files
      modifiedContent = this.migrateTypeScriptFile(content, filePath, changes);
      hasChanges = changes.length > 0;
    }

    if (hasChanges) {
      this.results.push({
        filePath,
        changes,
        modified: true,
      });

      this.totalChanges += changes.length;

      if (this.options.verbose) {
        console.log(`\n📝 ${filePath}`);
        changes.forEach((change, i) => {
          console.log(`  ${i + 1}. Line ${change.line}: ${change.type}`);
          console.log(`     - ${change.old}`);
          console.log(`     + ${change.new}`);
        });
      } else {
        console.log(`✓ ${filePath} (${changes.length} changes)`);
      }

      // Write changes if not dry run
      if (!this.options.dryRun) {
        if (this.options.backup) {
          fs.writeFileSync(`${filePath}.backup`, content);
        }
        fs.writeFileSync(filePath, modifiedContent);
      }
    }
  }

  /**
   * Migrate CSS file
   */
  private migrateCssFile(
    content: string,
    filePath: string,
    changes: MigrationResult['changes']
  ): string {
    let modified = content;
    const lines = content.split('\n');

    // 1. Replace CSS variables
    for (const [oldVar, newVar] of Object.entries(tokenMapping.cssVariables.mapping)) {
      const regex = new RegExp(oldVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(modified)) {
        const oldLine = this.findLineNumber(lines, oldVar);
        modified = modified.replace(regex, newVar);
        changes.push({
          line: oldLine,
          old: oldVar,
          new: newVar,
          type: 'css',
        });
      }
    }

    // 2. Replace CSS class names
    for (const [oldClass, newClass] of Object.entries(tokenMapping.cssClasses.mapping)) {
      const regex = new RegExp(oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(modified)) {
        const oldLine = this.findLineNumber(lines, oldClass);
        modified = modified.replace(regex, newClass);
        changes.push({
          line: oldLine,
          old: oldClass,
          new: newClass,
          type: 'css',
        });
      }
    }

    // 3. Replace color values in CSS
    for (const [oldColor, newColor] of Object.entries(tokenMapping.colorValues.hex)) {
      const regex = new RegExp(oldColor, 'gi');
      if (regex.test(modified)) {
        const oldLine = this.findLineNumber(lines, oldColor);
        modified = modified.replace(regex, newColor);
        changes.push({
          line: oldLine,
          old: oldColor,
          new: newColor,
          type: 'color-value',
        });
      }
    }

    return modified;
  }

  /**
   * Migrate TypeScript/TSX file
   */
  private migrateTypeScriptFile(
    content: string,
    filePath: string,
    changes: MigrationResult['changes']
  ): string {
    let modified = content;
    const lines = content.split('\n');

    // 1. Update imports
    const oldImportPatterns = [
      /import\s+{([^}]+)}\s+from\s+['"]@\/styles\/tokens\/colors['"]/g,
      /import\s+{([^}]+)}\s+from\s+['"]@\/styles\/tokens\/effects['"]/g,
      /import\s+{([^}]+)}\s+from\s+['"]@\/styles\/tokens\/typography['"]/g,
      /import\s+\*\s+(?:as\s+\w+\s+)?from\s+['"]@\/styles\/tokens['"]/g,
    ];

    for (const pattern of oldImportPatterns) {
      if (pattern.test(content)) {
        const oldLine = this.findLineNumber(lines, pattern.source.substring(0, 30));
        // Don't automatically replace imports - just flag them
        changes.push({
          line: oldLine,
          old: 'Old token import detected',
          new: "import { palette, colors, modeColors } from '@/design-system/tokens'",
          type: 'typescript',
        });
      }
    }

    // 2. Replace TypeScript token usage
    for (const [oldToken, newToken] of Object.entries(tokenMapping.typescript.tokens)) {
      // Create a safe regex that matches the token in code context
      const regex = new RegExp(
        oldToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\[(\d+)\]/g, '\\[$1\\]'),
        'g'
      );
      
      if (regex.test(modified)) {
        const oldLine = this.findLineNumber(lines, oldToken);
        modified = modified.replace(regex, newToken);
        changes.push({
          line: oldLine,
          old: oldToken,
          new: newToken,
          type: 'typescript',
        });
      }
    }

    // 3. Replace inline style objects
    for (const [oldStyle, newStyle] of Object.entries(tokenMapping.inlineStyles.mapping)) {
      // Handle both single and double quotes
      const patterns = [
        oldStyle,
        oldStyle.replace(/'/g, '"'),
      ];

      for (const pattern of patterns) {
        if (modified.includes(pattern)) {
          const oldLine = this.findLineNumber(lines, pattern);
          modified = modified.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newStyle);
          changes.push({
            line: oldLine,
            old: pattern,
            new: newStyle,
            type: 'inline-style',
          });
        }
      }
    }

    // 4. Replace hex color values
    for (const [oldColor, newColor] of Object.entries(tokenMapping.colorValues.hex)) {
      // Match colors in quotes or template literals
      const patterns = [
        new RegExp(`['"\`]${oldColor}['"\`]`, 'gi'),
      ];

      for (const pattern of patterns) {
        if (pattern.test(modified)) {
          const oldLine = this.findLineNumber(lines, oldColor);
          modified = modified.replace(pattern, (match) => match.replace(oldColor, newColor));
          changes.push({
            line: oldLine,
            old: oldColor,
            new: newColor,
            type: 'color-value',
          });
        }
      }
    }

    // 5. Replace RGBA patterns
    for (const [oldRgba, newRgba] of Object.entries(tokenMapping.colorValues.rgba)) {
      const regex = new RegExp(oldRgba.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(modified)) {
        const oldLine = this.findLineNumber(lines, oldRgba);
        modified = modified.replace(regex, newRgba);
        changes.push({
          line: oldLine,
          old: oldRgba,
          new: newRgba,
          type: 'color-value',
        });
      }
    }

    // 6. Replace gradient patterns
    const allGradients = {
      ...tokenMapping.gradients.degen,
      ...tokenMapping.gradients.regen,
    };

    for (const [oldGradient, newGradient] of Object.entries(allGradients)) {
      if (modified.includes(oldGradient)) {
        const oldLine = this.findLineNumber(lines, oldGradient.substring(0, 40));
        modified = modified.replace(
          new RegExp(oldGradient.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          newGradient
        );
        changes.push({
          line: oldLine,
          old: oldGradient.substring(0, 60) + '...',
          new: newGradient,
          type: 'inline-style',
        });
      }
    }

    // 7. Replace className patterns
    for (const [oldClass, newClass] of Object.entries(tokenMapping.cssClasses.mapping)) {
      // Match className="..." or className='...'
      const classNameOnly = oldClass.replace('.', '');
      const patterns = [
        new RegExp(`className=["']([^"']*\\s)?${classNameOnly}(\\s[^"']*)?["']`, 'g'),
        new RegExp(`className=\\{["']\`([^"\`]*\\s)?${classNameOnly}(\\s[^"\`]*)?["']\`\\}`, 'g'),
      ];

      for (const pattern of patterns) {
        if (pattern.test(modified)) {
          const oldLine = this.findLineNumber(lines, classNameOnly);
          modified = modified.replace(pattern, (match) =>
            match.replace(classNameOnly, newClass.replace('.', ''))
          );
          changes.push({
            line: oldLine,
            old: oldClass,
            new: newClass,
            type: 'inline-style',
          });
        }
      }
    }

    return modified;
  }

  /**
   * Find line number of a string in lines array
   */
  private findLineNumber(lines: string[], searchStr: string): number {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchStr)) {
        return i + 1;
      }
    }
    return 0;
  }

  /**
   * Print migration summary
   */
  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60) + '\n');

    console.log(`Total Files Processed: ${this.results.length}`);
    console.log(`Total Changes: ${this.totalChanges}`);
    console.log(`Mode: ${this.options.dryRun ? 'DRY RUN (no files modified)' : 'LIVE'}\n`);

    // Group by change type
    const byType = {
      typescript: 0,
      css: 0,
      'inline-style': 0,
      'color-value': 0,
    };

    this.results.forEach((result) => {
      result.changes.forEach((change) => {
        byType[change.type]++;
      });
    });

    console.log('Changes by Type:');
    console.log(`  - TypeScript Tokens: ${byType.typescript}`);
    console.log(`  - CSS Variables/Classes: ${byType.css}`);
    console.log(`  - Inline Styles: ${byType['inline-style']}`);
    console.log(`  - Color Values: ${byType['color-value']}\n`);

    if (this.options.dryRun) {
      console.log('⚠️  DRY RUN MODE - No files were modified');
      console.log('Run without --dry-run to apply changes\n');
    } else {
      console.log('✅ Migration complete!');
      if (this.options.backup) {
        console.log('💾 Backup files created with .backup extension\n');
      }
    }

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'design-system', 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}\n`);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    dryRun: false,
    verbose: false,
    backup: false,
    targetPath: process.cwd(),
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--backup') {
      options.backup = true;
    } else if (arg.startsWith('--path=')) {
      options.targetPath = arg.split('=')[1];
    }
  }

  return options;
}

/**
 * Main execution
 */
async function main() {
  try {
    const options = parseArgs();
    const migrator = new TokenMigrator(options);
    await migrator.migrate();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { TokenMigrator, MigrationOptions, MigrationResult };
