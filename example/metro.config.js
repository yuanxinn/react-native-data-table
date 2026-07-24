const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const root = path.resolve(__dirname, '..');
const config = getDefaultConfig(__dirname);

// 监听父目录，包名直接指向库源码 src/，改库代码即时热更新
config.watchFolders = [root];
config.resolver.extraNodeModules = {
  '@bestcoder/react-native-data-table': path.join(root, 'src'),
  react: path.join(__dirname, 'node_modules', 'react'),
  'react-native': path.join(__dirname, 'node_modules', 'react-native'),
  '@shopify/flash-list': path.join(__dirname, 'node_modules', '@shopify/flash-list'),
};

// 屏蔽父目录 node_modules，避免解析到两份 react / react-native
const escaped = path.join(root, 'node_modules').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [new RegExp(`${escaped}/.*`)];
config.resolver.nodeModulesPaths = [path.join(__dirname, 'node_modules')];

module.exports = config;
