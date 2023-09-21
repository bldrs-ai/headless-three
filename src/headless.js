import path from 'node:path'
import * as THREE from 'three'
import {
  fitModelToFrame,
  initThree,
  render,
  saveScreenshot,
  parseCamera,
} from './lib.js'
import {load} from './Loader.js'
import {parseUrl} from './urls.js'
import debug from './debug.js'


if (process.argv.length < 3) {
  console.error('Usage: node src/headless.js <file:///path/to/file.(ifc|obj)> <px,py,pz,tx,ty,tz>')
  process.exit(1)
}

const [glCtx, renderer, scene, camera] = initThree()

const absPath = path.resolve(process.argv[2])
const modelUrl = new URL('file:' + absPath)
const parsedUrl = parseUrl(modelUrl)
if (parsedUrl.target === undefined) {
  console.error('Could not parse file arg')
  process.exit(1)
}

const [px, py, pz, tx, ty, tz] = parseCamera(parsedUrl.params.c) || [0,0,0,0,0,0]
debug().log(`headless#camera setting: camera.pos(${px}, ${py}, ${pz}) target.pos(${tx}, ${ty}, ${tz})`)
const targetUrl = parsedUrl.target.url

const model = await load(targetUrl)
scene.add(model)
// Materials can be accessed e.g.:
//   model.material[0].transparent = true
//   model.material[0].opacity = 0.1

// Normalize look and zoom to fit the model in the render frame using
// the same alg as Share.
fitModelToFrame(renderer.domElement, scene, model, camera)

camera.position.set(px, py, pz)
camera.lookAt(tx, ty, tz)


// headless gl has some rendering issues, e.g. no-AA
// See https://github.com/stackgl/headless-gl/issues/30
const useSsaa = false
render(renderer, scene, camera, useSsaa)


saveScreenshot(glCtx)
