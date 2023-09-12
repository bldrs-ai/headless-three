import * as THREE from 'three'
import {
  fitModelToFrame,
  initThree,
  render,
  saveScreenshot,
} from "./lib.js"
import {load} from './Loader.js'


if (process.argv.length < 3) {
  console.error('Usage: node src/headless.js <file:///path/to/file.(ifc|obj)> <px,py,pz,tx,ty,tz>')
  process.exit(1)
}

const [glCtx, renderer, scene, camera] = initThree()

const model = await load(process.argv[2])
scene.add(model)
// Materials can be accessed e.g.:
//   model.material[0].transparent = true
//   model.material[0].opacity = 0.1

// Normalize look and zoom to fit the model in the render frame using
// the same alg as Share.
fitModelToFrame(renderer.domElement, scene, model, camera)

// Apply URL camera coords.
const camCoordStr = process.argv[3]
let cc = camCoordStr ? camCoordStr.split(',').map(x => parseFloat(x)) : [0, 0, 0, 0, 0, 0]
const px = cc[0]
const py = cc[1]
const pz = cc[2]
const tx = cc[3]
const ty = cc[4]
const tz = cc[5]
console.log(`headless#camera setting: camera.pos(${px}, ${py}, ${pz}) target.pos(${tx}, ${ty}, ${tz})`)
camera.position.set(px, py, pz)
camera.lookAt(tx, ty, tz)


// headless gl has some rendering issues, e.g. no-AA
// See https://github.com/stackgl/headless-gl/issues/30
const useSsaa = false
render(renderer, scene, camera, useSsaa)


saveScreenshot(glCtx)
