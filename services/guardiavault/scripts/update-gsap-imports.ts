#!/usr/bin/env node
/**
 * Batch update GSAP imports to use optimized version
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentsDir = path.join(__dirname, '../client/src/components');

// Find all TSX files with GSAP imports
function findFilesWithGSAP(dir: string): string[] {
  const files: string[] = [];
  
  function traverse(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes('from "gsap"') || content.includes("from 'gsap'")) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

const files = findFilesWithGSAP(componentsDir);
console.log(`Found ${files.length} files with GSAP imports`);

let updated = 0;
for (const filePath of files) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // Replace import gsap from "gsap"
    if (content.includes('import gsap from "gsap"')) {
      content = content.replace(
        /import gsap from "gsap";/g,
        'import { gsap } from "@/lib/gsap-optimized";'
      );
      modified = true;
    }
    
    // Replace import { ScrollTrigger } from "gsap/ScrollTrigger"
    if (content.includes('from "gsap/ScrollTrigger"')) {
      content = content.replace(
        /import\s*{\s*ScrollTrigger\s*}\s*from\s*"gsap\/ScrollTrigger";/g,
        ''
      );
      // Add to optimized import if not already there
      if (!content.includes('from "@/lib/gsap-optimized"')) {
        const optimizedImport = /import\s*{\s*gsap\s*}\s*from\s*"@\/lib\/gsap-optimized";/;
        if (optimizedImport.test(content)) {
          content = content.replace(
            /import\s*{\s*gsap\s*}\s*from\s*"@\/lib\/gsap-optimized";/,
            'import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";'
          );
        } else {
          // Add new import
          const firstImport = content.match(/^import\s+.*$/m);
          if (firstImport) {
            content = content.replace(
              firstImport[0],
              `import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";\n${firstImport[0]}`
            );
          }
        }
      } else {
        // Update existing optimized import
        content = content.replace(
          /import\s*{\s*gsap\s*}\s*from\s*"@\/lib\/gsap-optimized";/,
          'import { gsap, ScrollTrigger, registerPlugin } from "@/lib/gsap-optimized";'
        );
      }
      modified = true;
    }
    
    // Replace import { MotionPathPlugin } from "gsap/MotionPathPlugin"
    if (content.includes('from "gsap/MotionPathPlugin"')) {
      content = content.replace(
        /import\s*{\s*MotionPathPlugin\s*}\s*from\s*"gsap\/MotionPathPlugin";/g,
        ''
      );
      // Update optimized import
      content = content.replace(
        /import\s*{\s*([^}]*)\s*}\s*from\s*"@\/lib\/gsap-optimized";/,
        (match, imports) => {
          if (!imports.includes('MotionPathPlugin')) {
            return `import { ${imports}, MotionPathPlugin } from "@/lib/gsap-optimized";`;
          }
          return match;
        }
      );
      modified = true;
    }
    
    // Replace gsap.registerPlugin calls
    if (content.includes('gsap.registerPlugin')) {
      // Replace single plugin
      content = content.replace(
        /gsap\.registerPlugin\(\s*ScrollTrigger\s*\);/g,
        'registerPlugin(ScrollTrigger, "ScrollTrigger");'
      );
      
      // Replace multiple plugins
      content = content.replace(
        /gsap\.registerPlugin\(\s*ScrollTrigger\s*,\s*MotionPathPlugin\s*\);/g,
        'registerPlugin(ScrollTrigger, "ScrollTrigger");\nregisterPlugin(MotionPathPlugin, "MotionPathPlugin");'
      );
      
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      updated++;
      console.log(`Updated: ${path.relative(componentsDir, filePath)}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

console.log(`\nUpdated ${updated} files`);

