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
import debug from './debug.js'
import {supportedTypesUsageStr} from './Filetype.js'


if (process.argv.length < 3) {
  console.error(
    `Usage: node src/headless.js <path/to/file> [px,py,pz[,tx,ty,tz]]]\n\n` +
    `Supported types: ${supportedTypesUsageStr}`
  )
  process.exit(1)
}

const modelPath = path.resolve(process.argv[2])
const cameraCsv = process.argv[3]

const model = await load(modelPath)

const [glCtx, renderer, scene, camera] = initThree()

scene.add(model)
scene.add(new THREE.AxesHelper)
// Materials can be accessed e.g.:
//   model.material[0].transparent = true
//   model.material[0].opacity = 0.1

if (cameraCsv) {
  const [px, py, pz, tx, ty, tz] = parseCamera(cameraCsv) || [10,10,10,0,0,0]
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
