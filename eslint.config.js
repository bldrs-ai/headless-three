import pluginJs from '@eslint/js'


export default [
  pluginJs.configs.recommended,
  {
    ignores: [
      'build/',
      'external/',
      'node_modules/',
    ],
  },
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn'
    }
  }
]
