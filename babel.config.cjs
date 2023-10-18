module.exports = {
  presets: [
    '@babel/preset-env',
  ],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', {targets: {node: 'current'}}],
        // TODO(pablo): only needed for `yarn test` triggering `import {IFCLoader} from 'web-ifc-three'`
        '@babel/preset-typescript',
      ],
    },
  },
}
