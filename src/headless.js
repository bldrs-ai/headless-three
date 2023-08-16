import * as THREE from 'three'
import {
  doRender,
  fitModelToFrame,
  initCamera,
  initDom,
  initGl,
  initLights,
  initRenderer,
  saveScreenshot,
} from "./lib.js"
import {load} from './Loader.js'


if (process.argv.length < 3) {
  console.error('Usage: node headless.js <file:///path/to/file.(ifc|obj)> <cx,cy,cz,tx,ty,tz>')
  process.exit(1)
}

const w = 1024, h = 768
const aspect = w / h
const dom = initDom()
const glCtx = initGl(w, h)
const renderer = initRenderer(glCtx, w, h)
const scene = new THREE.Scene()


initLights(scene)


const camera = initCamera(45, aspect)

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
camera.position.set(px, py, pz)
camera.lookAt(tx, ty, tz)


// headless gl has some rendering issues, e.g. no-AA
// See https://github.com/stackgl/headless-gl/issues/30
const useSsaa = false
doRender(renderer, scene, camera, useSsaa)


saveScreenshot(glCtx)
