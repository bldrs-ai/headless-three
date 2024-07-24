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

// Get the argument from command line
const includeWebIfcShimAliasPlugin = process.argv.includes('--include-web-ifc-shim-alias-plugin')

const plugins = [webIfcThreeImportFixupPlugin]
if (includeWebIfcShimAliasPlugin) {
  console.log("Using Conway Shim backend")
  process.env.INCLUDE_WEB_IFC_SHIM_ALIAS_PLUGIN = 'true'
  plugins.push(webIfcShimAliasPlugin)
} else {
  console.log("Using Web-Ifc backend")
}

// TODO(pablo): this builds for me, but the bundle isn't running yet.
esbuild
  .build({
    entryPoints: ['./src/server/index.js'],
    outfile: './build/server-bundle.js',
    //outdir: 'build',
    bundle: true,
    format: '',
    target: ['node18'],
    platform: 'node',
    external: externalPackages,
    sourcemap: 'inline',
    logLevel: 'info',
    plugins: plugins,
    banner:{
      js: `
        import { fileURLToPath } from 'node:url';
        import { dirname } from 'node:path';
        import { createRequire as topLevelCreateRequire } from 'node:module';
        const require = topLevelCreateRequire(import.meta.url);
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        `
    },
  })
  .then((result) => {
    console.log('Build succeeded.')
  })
  .catch(() => process.exit(1))
