const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // example 是独立 Expo 工程（自带依赖与 tsconfig），不参与库的 lint
    ignores: ['dist/*', 'node_modules/*', 'example/*'],
  },
]);
