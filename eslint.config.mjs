import { getConfigForTs } from 'eslint-config-wdzeng'

export default getConfigForTs(
  // custom rules
  {
    'unicorn/no-process-exit': 'off',
    'unicorn/prefer-top-level-await': 'off',
  },
  // options
  {
    node: true, // whether in Node.js
    browser: false, // whether in browser
    ecmaVersion: 2022, // ECMAScript version
    projectRoot: import.meta.dirname // project root dir
  }
)
