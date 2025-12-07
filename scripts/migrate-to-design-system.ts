/**
 * Automated Design System Migration Script
 * Replaces hardcoded colors with design tokens
 */

import * as fs from 'fs';
import * as path from 'path';

// Color mapping from hardcoded to CSS variables
const colorReplacements: Record<string, string> = {
  // Backgrounds
  '#0a0a0a': 'var(--bg-base)',
  '#1e1e1e': 'var(--bg-surface)',
  '#2a2a2a': 'var(--bg-elevated)',
  '#121212': 'var(--bg-base)',
  '#1a1a1a': 'var(--bg-surface)',
  '#151515': 'var(--bg-surface)',
  '#0d0d0d': 'var(--bg-base)',
  '#252525': 'var(--bg-elevated)',
  
  // Text
  '#ffffff': 'var(--text-primary)',
  '#fff': 'var(--text-primary)',
  '#e0e0e0': 'var(--text-secondary)',
  '#888888': 'var(--text-muted)',
  '#888': 'var(--text-muted)',
  '#666666': 'var(--text-disabled)',
  '#666': 'var(--text-disabled)',
  '#aaaaaa': 'var(--text-muted)',
  '#a0a0a0': 'var(--text-muted)',
  '#cccccc': 'var(--text-secondary)',
  '#9ca3af': 'var(--text-muted)',
  '#333333': 'var(--bg-elevated)',
  '#333': 'var(--bg-elevated)',
  '#444444': 'var(--bg-elevated)',
  '#555555': 'var(--bg-elevated)',
  '#555': 'var(--bg-elevated)',
  '#3a3a3a': 'var(--bg-elevated)',
  
  // Accent (neutral)
  '#00adef': 'var(--accent-primary)',
  '#007bff': 'var(--accent-primary)',
  '#00d4ff': 'var(--accent-bright)',
  '#0ea5e9': 'var(--accent-muted)',
  '#0090ff': 'var(--accent-primary)',
  '#38bdf8': 'var(--accent-bright)',
  
  // Success
  '#10b981': 'var(--success)',
  '#00c853': 'var(--success-bright)',
  
  // Warning
  '#ffc107': 'var(--warning)',
  '#f59e0b': 'var(--warning-muted)',
  '#ffd700': 'var(--warning)',
  
  // Error
  '#ef4444': 'var(--error)',
  '#ff4d4d': 'var(--error-bright)',
  '#ff0000': 'var(--error)',
  
  // Degen
  '#ff3333': 'var(--degen-primary)',
  '#ff3366': 'var(--degen-accent)',
  '#ff9800': 'var(--degen-secondary)',
  '#ff6b6b': 'var(--degen-tertiary)',
  '#ff9500': 'var(--degen-secondary)',
  '#ff6b00': 'var(--degen-secondary)',
  
  // Regen
  '#3399ff': 'var(--regen-primary)',
  '#00d4ff': 'var(--regen-accent)',
  '#00ff88': 'var(--regen-secondary)',
  '#0066ff': 'var(--regen-tertiary)',
  '#00aaff': 'var(--regen-primary)',
  
  // Purple
  '#9b59b6': 'var(--color-purple)',
  '#8b5cf6': 'var(--color-violet)',
  '#a855f7': 'var(--color-violet)',
  '#7c3aed': 'var(--color-violet)',
  
  // Other
  '#ec4899': 'var(--color-pink)',
  '#06b6d4': 'var(--color-cyan)',
};

// RGBA replacements for common backgrounds
const rgbaReplacements: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /rgba\(10,\s*10,\s*15,\s*0\.9\)/g,
    replacement: 'var(--bg-overlay)',
  },
  {
    pattern: /rgba\(10,\s*10,\s*15,\s*0\.6\)/g,
    replacement: 'var(--bg-overlay-light)',
  },
  {
    pattern: /rgba\(10,\s*10,\s*15,\s*0\.4\)/g,
    replacement: 'var(--bg-overlay-subtle)',
  },
  {
    pattern: /rgba\(0,\s*0,\s*0,\s*0\.4\)/g,
    replacement: 'var(--bg-input)',
  },
  {
    pattern: /rgba\(0,\s*0,\s*0,\s*0\.95\)/g,
    replacement: 'rgba(0, 0, 0, 0.95)', // Keep for strong glass
  },
  {
    pattern: /rgba\(255,\s*255,\s*255,\s*0\.05\)/g,
    replacement: 'var(--bg-hover)',
  },
  {
    pattern: /rgba\(255,\s*255,\s*255,\s*0\.1\)/g,
    replacement: 'var(--border-subtle)',
  },
  {
    pattern: /rgba\(255,\s*255,\s*255,\s*0\.15\)/g,
    replacement: 'var(--border-medium)',
  },
  {
    pattern: /rgba\(255,\s*255,\s*255,\s*0\.2\)/g,
    replacement: 'var(--border-strong)',
  },
  {
    pattern: /rgba\(128,\s*128,\s*128,\s*0\.15\)/g,
    replacement: 'var(--border-neutral)',
  },
];

function migrateFile(filePath: string): { success: boolean; changes: number; errors: string[] } {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changes = 0;
    const errors: string[] = [];

    // Replace hex colors
    for (const [hex, cssVar] of Object.entries(colorReplacements)) {
      const regex = new RegExp(hex.replace('#', '#'), 'gi');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, cssVar);
        changes += matches.length;
      }
    }

    // Replace RGBA patterns
    for (const { pattern, replacement } of rgbaReplacements) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        changes += matches.length;
      }
    }

    // Write back
    if (changes > 0) {
      fs.writeFileSync(filePath, content, 'utf-8');
    }

    return { success: true, changes, errors };
  } catch (error) {
    return { success: false, changes: 0, errors: [String(error)] };
  }
}

function getAllComponentFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
      files.push(...getAllComponentFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      files.push(fullPath);
    }
  }

  return files;
}

// Main execution
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║     AUTOMATED DESIGN SYSTEM MIGRATION                      ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const componentsDir = path.join(process.cwd(), 'src', 'components');
const files = getAllComponentFiles(componentsDir);

console.log(`Found ${files.length} component files\n`);
console.log('Migrating...\n');

let totalChanges = 0;
const results: Array<{ file: string; changes: number }> = [];

for (const file of files) {
  const result = migrateFile(file);
  if (result.changes > 0) {
    const relativePath = file.replace(process.cwd() + path.sep, '');
    results.push({ file: relativePath, changes: result.changes });
    totalChanges += result.changes;
    console.log(`✓ ${relativePath.padEnd(60)} | ${result.changes.toString().padStart(4)} changes`);
  }
}

console.log('\n' + '='.repeat(70));
console.log(`\n✅ MIGRATION COMPLETE`);
console.log(`   Total files migrated: ${results.length}`);
console.log(`   Total changes: ${totalChanges}`);
console.log(`\n📝 Top 10 files by changes:\n`);

results
  .sort((a, b) => b.changes - a.changes)
  .slice(0, 10)
  .forEach((r, i) => {
    console.log(`${(i + 1).toString().padStart(2)}. ${r.file.padEnd(55)} | ${r.changes} changes`);
  });

console.log('\n');


