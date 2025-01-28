import globals from 'globals'
import pluginJs from '@eslint/js'


export default [
  pluginJs.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  {
    ignores: [
      'build/',
      'external/',
      'node_modules/',
      'src/IFCLoader.js',
    ],
  },
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn'
    }
  }
]
