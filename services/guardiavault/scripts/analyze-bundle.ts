/**
 * Bundle Analysis Script
 * Analyzes the codebase structure to identify optimization opportunities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface DependencyInfo {
  name: string;
  size: string;
  type: 'crypto' | 'graphics' | 'ui' | 'state' | 'other';
  optimization?: string;
}

// Known large dependencies
const largeDependencies: DependencyInfo[] = [
  { name: 'three.js', size: '~600KB', type: 'graphics', optimization: 'Lazy load' },
  { name: 'gsap', size: '~50KB', type: 'graphics', optimization: 'Tree-shake plugins' },
  { name: 'ethers.js', size: '~500KB', type: 'crypto', optimization: 'Use viem instead' },
  { name: 'wagmi', size: '~200KB', type: 'crypto', optimization: 'Already optimized' },
  { name: '@rainbow-me/rainbowkit', size: '~150KB', type: 'crypto', optimization: 'Lazy load' },
  { name: 'framer-motion', size: '~100KB', type: 'ui', optimization: 'Use CSS animations' },
  { name: '@radix-ui/*', size: '~50KB per component', type: 'ui', optimization: 'Tree-shake' },
];

function analyzeImports() {
  const clientSrc = path.resolve(__dirname, '../client/src');
  const files: string[] = [];

  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walkDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        files.push(fullPath);
      }
    }
  }

  walkDir(clientSrc);

  const imports = {
    gsap: new Set<string>(),
    three: new Set<string>(),
    ethers: new Set<string>(),
    wagmi: new Set<string>(),
    framerMotion: new Set<string>(),
  };

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const relPath = path.relative(clientSrc, file);

    // GSAP imports
    const gsapMatches = content.match(/import.*from\s+['"]gsap/gi);
    if (gsapMatches) {
      gsapMatches.forEach(match => {
        imports.gsap.add(`${relPath}: ${match.substring(0, 80)}`);
      });
    }

    // Three.js imports
    if (content.includes('three')) {
      imports.three.add(relPath);
    }

    // Ethers imports
    if (content.includes('ethers')) {
      imports.ethers.add(relPath);
    }

    // Wagmi imports
    if (content.includes('wagmi') || content.includes('@wagmi')) {
      imports.wagmi.add(relPath);
    }

    // Framer Motion imports
    if (content.includes('framer-motion')) {
      imports.framerMotion.add(relPath);
    }
  });

  return {
    imports,
    fileCount: files.length,
  };
}

function generateReport() {
  const analysis = analyzeImports();
  
  console.log('\n📊 Bundle Analysis Report\n');
  console.log('═'.repeat(80));
  
  console.log('\n📦 Large Dependencies:\n');
  largeDependencies.forEach(dep => {
    console.log(`  • ${dep.name.padEnd(30)} ${dep.size.padEnd(15)} [${dep.type}]`);
    if (dep.optimization) {
      console.log(`    → ${dep.optimization}`);
    }
  });

  console.log('\n\n🔍 Import Analysis:\n');
  console.log(`Total files analyzed: ${analysis.fileCount}\n`);

  console.log('GSAP Usage:');
  console.log(`  Files using GSAP: ${analysis.imports.gsap.size}`);
  if (analysis.imports.gsap.size > 0) {
    Array.from(analysis.imports.gsap).slice(0, 5).forEach(file => {
      console.log(`    - ${file}`);
    });
  }

  console.log('\nThree.js Usage:');
  console.log(`  Files using Three.js: ${analysis.imports.three.size}`);
  if (analysis.imports.three.size > 0) {
    Array.from(analysis.imports.three).slice(0, 5).forEach(file => {
      console.log(`    - ${file}`);
    });
  }

  console.log('\nEthers.js Usage:');
  console.log(`  Files using Ethers: ${analysis.imports.ethers.size}`);
  if (analysis.imports.ethers.size > 0) {
    Array.from(analysis.imports.ethers).slice(0, 5).forEach(file => {
      console.log(`    - ${file}`);
    });
  }

  console.log('\nWagmi Usage:');
  console.log(`  Files using Wagmi: ${analysis.imports.wagmi.size}`);

  console.log('\nFramer Motion Usage:');
  console.log(`  Files using Framer Motion: ${analysis.imports.framerMotion.size}`);

  console.log('\n\n💡 Optimization Recommendations:\n');
  console.log('1. GSAP:');
  console.log('   - Import only needed plugins: import { gsap } from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"');
  console.log('   - Register plugins conditionally');
  
  console.log('\n2. Three.js:');
  console.log('   - Lazy load 3D components');
  console.log('   - Use lighter alternatives for simple effects');
  
  console.log('\n3. Ethers.js:');
  console.log('   - Consider migrating to viem (smaller bundle)');
  console.log('   - Use tree-shaking: import { Contract } from "ethers" instead of entire library');
  
  console.log('\n4. Code Splitting:');
  console.log('   - Already configured in vite.config.ts');
  console.log('   - Verify lazy loading for heavy pages');
  
  console.log('\n5. Images:');
  console.log('   - Convert PNG to WebP');
  console.log('   - Add lazy loading');
  console.log('   - Use srcset for responsive images');

  console.log('\n\n📈 Expected Bundle Size Reduction:\n');
  console.log('  Current estimated initial bundle: ~2-3MB');
  console.log('  After optimizations: ~1.5-2MB (30-40% reduction)');
  console.log('  Largest savings: Three.js lazy loading, GSAP tree-shaking, Ethers optimization');
}

generateReport();

