module.exports = {
  root: true,
  ignorePatterns: ['dist', 'node_modules'],
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: ['plugin:vue/vue3-recommended', '@vue/eslint-config-typescript/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
  },
}
