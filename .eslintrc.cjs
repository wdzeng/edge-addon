module.exports = {
  root: true,
  extends: ['wdzeng/typescript'],
  env: {
    browser: false,
    es2022: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    'unicorn/no-process-exit': 'off',
    'unicorn/prefer-top-level-await': 'off',
    'prettier/prettier': 'warn'
  },
  overrides: [
    {
      // disable `any` checks in tests
      files: ["test/**/*.test.ts"],
      rules: {
        "@typescript-eslint/no-unsafe-assignment": "off",
      },
    },
  ],
}
