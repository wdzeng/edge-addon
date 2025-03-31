// @ts-check

import { getConfigForTs } from 'eslint-config-wdzeng'

export default getConfigForTs(
  // Custom rules
  {
    'unicorn/no-process-exit': 'off',
    'unicorn/prefer-top-level-await': 'off'
  },
  // Options
  {
    ecmaVersion: 2022, // ECMAScript version
    projectRoot: import.meta.dirname, // Project root directory
    node: true, // Whether in Node.js
    browser: false, // Whether in browser
    vitest: true // Use vitest
  }
)
