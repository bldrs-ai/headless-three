import esbuild from 'esbuild'
import {webIfcShimAliasPlugin} from './web-ifc-shim-alias-plugin.js'
import {webIfcThreeImportFixupPlugin} from './web-ifc-three-import-fixup.js'


export function doBuild(entryPoints, outfile, isConway = true) {
  const plugins = [webIfcThreeImportFixupPlugin]
  if (isConway) {
    console.log("Using conway backend")
    process.env.INCLUDE_WEB_IFC_SHIM_ALIAS_PLUGIN = 'true'
    plugins.push(webIfcShimAliasPlugin(isConway))
  } else {
    console.log("Using web-ifc backend")
  }

  esbuild.build({
    entryPoints: entryPoints,
    outfile: outfile,
    bundle: true,
    format: 'esm',
    target: ['node18'],
    platform: 'node',
    minify: false,
    external: externalPackages,
    sourcemap: true,
    logLevel: 'info',
    plugins: plugins,
    banner:{
      js: `
        import { createRequire as topLevelCreateRequire } from 'node:module';
        import { dirname } from 'node:path';
        import { fileURLToPath } from 'node:url';
        const require = topLevelCreateRequire(import.meta.url);
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        `
    },
  })
}


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
//  '../external/web-ifc-api-node.cjs',
]
