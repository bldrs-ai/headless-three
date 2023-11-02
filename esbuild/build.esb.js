import esbuild from 'esbuild'
import {webIfcShimAliasPlugin} from './web-ifc-shim-alias-plugin.js'
import {webIfcThreeImportFixupPlugin} from './web-ifc-three-import-fixup.js'


// These usually have dynamic requires that make the bundler or node
// interpreter unhappy unless they're linked at runtime.
const externalPackages = [
  'bindings',
  'form-data',
  'combined-stream',
  'express',
  'follow-redirects',
  'gl',
  'jsdom',
  'pngjs',
  'proxy-from-env',
  'winston',
  '@colors',
  '@sentry',
]


// TODO(pablo): this builds for me, but the bundle isn't running yet.
esbuild
  .build({
    entryPoints: ['./src/server.js'],
    outfile: './build/server-bundle.js',
    //outdir: 'build',
    bundle: true,
    format: 'esm',
    target: ['node16'],
    platform: 'node',
    external: externalPackages,
    sourcemap: 'inline',
    logLevel: 'info',
    plugins: [webIfcShimAliasPlugin, webIfcThreeImportFixupPlugin]
  })
  .then((result) => {
    console.log('Build succeeded.')
  })
  .catch(() => process.exit(1))
