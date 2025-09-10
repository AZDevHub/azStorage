/* eslint-env node */

module.exports = {
    root: true,
    env: {
        node: true,
        es2022: true
    },
    extends: [
        'eslint:recommended'
    ],
    rules: {
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        'no-console': 'off',
        'no-undef': 'error'
    },
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    }
}