import esbuild from 'esbuild'


esbuild
  .build({
    entryPoints: ['./headless.js'],
    outfile: './bundle.js',
    bundle: true,
    platform: 'node',
    target: ['node16'],
    external: ['*canvas.node', 'three', './xhr-sync-worker.js'],
    format: 'esm',
    logLevel: 'info',
  })
  .then((result) => {
    console.log('Build succeeded.')
  })
  .catch(() => process.exit(1))
