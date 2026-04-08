import { getConfigForTs } from 'eslint-config-wdzeng'

export default getConfigForTs(
  {
    // custom rules
    'unicorn/no-process-exit': 'off',
    'unicorn/prefer-top-level-await': 'off'
  },
  {
    // options
    projectRoot: import.meta.dirname, // project root directory
    ecmaVersion: 2023, // ecma script version
    node: true, // whether in node.js
    browser: false, // whether in browser
    vitest: true // whether to use Vitest
  }
)
