#!/usr/bin/env node
/**
 * Button Migration Script
 * Helps identify and track button replacement progress
 */

const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

// Priority order for migration
const priorityComponents = [
  'Dashboard.tsx',
  'WalletTrading.tsx',
  'BottomNav.tsx',
  'TransactionModal.tsx',
  'QuickActionModals.tsx',
  'SwapBridgePanel.tsx',
  'SettingsPanels.tsx',
  'WalletGuardDashboard.tsx',
  'Portfolio.tsx',
  'Settings.tsx'
];

function countButtons(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const buttonMatches = content.match(/<button/g) || [];
    const animatedButtonMatches = content.match(/AnimatedButton/g) || [];
    return {
      regular: buttonMatches.length,
      animated: animatedButtonMatches.length,
      total: buttonMatches.length + animatedButtonMatches.length
    };
  } catch (error) {
    return { regular: 0, animated: 0, total: 0 };
  }
}

function analyzeComponent(fileName) {
  const filePath = path.join(componentsDir, fileName);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const counts = countButtons(filePath);
  const progress = counts.total > 0 
    ? Math.round((counts.animated / counts.total) * 100)
    : 0;

  return {
    fileName,
    regularButtons: counts.regular,
    animatedButtons: counts.animated,
    totalButtons: counts.total,
    progress: `${progress}%`,
    status: progress === 100 ? '✅' : progress > 0 ? '🟡' : '⭕'
  };
}

function generateReport() {
  console.log('\n🎨 GuardianX Animation Migration Report\n');
  console.log('=' .repeat(80));
  console.log();
  
  const results = priorityComponents
    .map(analyzeComponent)
    .filter(r => r !== null);

  console.log('Priority Components:');
  console.log('-'.repeat(80));
  console.table(results.map(r => ({
    'Status': r.status,
    'Component': r.fileName,
    'Regular <button>': r.regularButtons,
    'AnimatedButton': r.animatedButtons,
    'Progress': r.progress
  })));

  const totalRegular = results.reduce((sum, r) => sum + r.regularButtons, 0);
  const totalAnimated = results.reduce((sum, r) => sum + r.animatedButtons, 0);
  const totalAll = totalRegular + totalAnimated;
  const overallProgress = totalAll > 0 
    ? Math.round((totalAnimated / totalAll) * 100)
    : 0;

  console.log();
  console.log('Overall Progress:');
  console.log('-'.repeat(80));
  console.log(`Total buttons to migrate: ${totalRegular}`);
  console.log(`Already migrated: ${totalAnimated}`);
  console.log(`Overall progress: ${overallProgress}%`);
  console.log();
  
  if (overallProgress < 100) {
    console.log('📝 Next Steps:');
    console.log('1. Pick a component from the list above');
    console.log('2. Open it and find <button> elements');
    console.log('3. Replace with AnimatedButton from @/lib');
    console.log('4. Run this script again to track progress');
    console.log();
    console.log('Example replacement:');
    console.log('  OLD: <button onClick={fn}>Click</button>');
    console.log('  NEW: <AnimatedButton variant="primary" onClick={fn}>Click</AnimatedButton>');
  } else {
    console.log('🎉 All priority components migrated!');
    console.log('Move to Phase 1, Day 3-5: Transaction Simulation');
  }
  
  console.log();
  console.log('=' .repeat(80));
}

generateReport();

module.exports = { countButtons, analyzeComponent };
