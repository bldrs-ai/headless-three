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
import {supportedTypesUsageStr} from './Filetype.js'


if (process.argv.length < 3) {
  console.error(
    `Usage: node src/headless.js <path/to/file>[#c:px,py,pz[,tx,ty,tz]]\n\n` +
    `Supported types: ${supportedTypesUsageStr}`
  )
  process.exit(1)
}

const argPath = process.argv[2]

let modelUrl
let hash
try {
  modelUrl = new URL(argPath)
  hash = modelUrl.hash
} catch (e) {
  // Try interpreting it as a file
  const argPathParts  = argPath.split('#')
  const pathname = path.resolve(argPathParts[0])
  hash = argPathParts.length == 2 ? '#' + argPathParts[1] : ''
  try {
    modelUrl = new URL(`file:${pathname}${hash}`)
  } catch(e) {
    console.error('Could not convert file arg to url for parsing:', firstBit)
    process.exit(1)
  }
}

let parsedUrl = parseUrl(modelUrl)
console.log(`modelUrl(${modelUrl}), parsed:`, parsedUrl)

if (parsedUrl.target && parsedUrl.target.url) {
  parsedUrl = parsedUrl.target.url
} else {
  parsedUrl = parsedUrl.original
}

const [glCtx, renderer, scene, camera] = initThree()

const model = await load(parsedUrl)
scene.add(model)
scene.add(new THREE.AxesHelper)
// Materials can be accessed e.g.:
//   model.material[0].transparent = true
//   model.material[0].opacity = 0.1

if (hash) {
  const [px, py, pz, tx, ty, tz] = parseCamera(parsedUrl.params.c) || [0,0,0,0,0,0]
  debug().log(`headless#camera setting: camera.pos(${px}, ${py}, ${pz}) target.pos(${tx}, ${ty}, ${tz})`)
  camera.position.set(px, py, pz)
  camera.lookAt(tx, ty, tz)
} else {
  fitModelToFrame(renderer.domElement, scene, model, camera)
}

// headless gl has some rendering issues, e.g. no-AA
// See https://github.com/stackgl/headless-gl/issues/30
const useSsaa = false
render(renderer, scene, camera, useSsaa)


saveScreenshot(glCtx)
