const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');
const repoNodeModules = path.resolve(repoRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

// Allow Metro to watch and bundle files outside the project root (secure-sync/)
config.watchFolders = [repoRoot];

// Only resolve node_modules from frontend/ — prevents the repo-root react-native
// (different version) from shadowing the correct one in frontend/node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Block the repo-root node_modules from being transformed/bundled,
// so Metro never tries to process files from there directly
const existingBlockList = config.resolver.blockList ?? [];
const blockListArr = Array.isArray(existingBlockList)
  ? existingBlockList
  : [existingBlockList];
config.resolver.blockList = [
  ...blockListArr,
  new RegExp(`^${repoNodeModules.replace(/[/\\]/g, '[/\\\\]')}.*`),
];

module.exports = config;
