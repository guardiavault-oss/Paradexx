// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure resolver exists and has required properties
if (!config.resolver) {
  config.resolver = {};
}

// Add support for resolving shared directory
if (!config.resolver.sourceExts) {
  config.resolver.sourceExts = [];
}
// Only add extensions that aren't already present
const extensionsToAdd = ['ts', 'tsx', 'js', 'jsx', 'json'];
extensionsToAdd.forEach(ext => {
  if (!config.resolver.sourceExts.includes(ext)) {
    config.resolver.sourceExts.push(ext);
  }
});

// Configure extra node modules for path aliases
if (!config.resolver.extraNodeModules) {
  config.resolver.extraNodeModules = {};
}
config.resolver.extraNodeModules['@shared'] = path.resolve(__dirname, '../shared');
config.resolver.extraNodeModules['@'] = path.resolve(__dirname, '../client/src');

// Watch for changes in shared directory
config.watchFolders = [
  path.resolve(__dirname, '../shared'),
  path.resolve(__dirname, '../client/src'),
];

// Exclude problematic directories from watching (fixes Windows file watcher issues)
// Use blockList to prevent Metro from processing these paths
if (!config.resolver.blockList) {
  config.resolver.blockList = [];
}
config.resolver.blockList.push(
  // Block problematic directories that cause file watcher errors
  /node_modules\/.*\/misc\/.*/,
  /node_modules\/aes-js\/misc\/.*/
);

// Configure watcher to ignore problematic paths
config.watcher = {
  ...config.watcher,
  additionalExts: ['cjs', 'mjs'],
  watchman: {
    deferStates: ['hg.update'],
  },
  // Use watchman ignore patterns
  ignored: [
    '**/node_modules/**/misc/**',
    '**/node_modules/aes-js/misc/**',
  ],
};

module.exports = config;
