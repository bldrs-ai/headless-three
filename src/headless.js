import {JSDOM} from 'jsdom'
import gl from 'gl'
import * as THREE from 'three'
import {PNG} from 'pngjs'
import fs from 'fs'
import pkg from 'web-ifc-three'
import './fetch-polyfill.js'

import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js'
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js'
import {SSAARenderPass} from 'three/addons/postprocessing/SSAARenderPass.js'
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js'
import {GammaCorrectionShader} from 'three/addons/shaders/GammaCorrectionShader.js'


const {IFCLoader} = pkg

/*
import XMLHttpRequest from 'xhr2'

console.log('xhr2', XMLHttpRequest)
global.XMLHttpRequest = XMLHttpRequest
*/

/** Init global.document, which three uses to create its canvas. */
function initDom() {
  const dom = new JSDOM(`<!DOCTYPE html>`, {pretendToBeVisual: true})
  global.window = dom.window
  global.document = window.document
}


/** Create a WebGL context using the 'gl' package. */
function initGl(width, height) {
  const glCtx = gl(width, height, {antialias: true})
  return glCtx
}


function initRenderer(glCtx, width, height) {
  const renderer = new THREE.WebGLRenderer({context: glCtx, antialias: true})
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setClearColor(0xffffff, 1)
  return renderer
}


function initCamera(fov = 45, aspect = 1, px = 0, py = 0, pz = 0, tx = 0, ty = 0, tz = 0) {
  const camera = new THREE.PerspectiveCamera(fov, aspect)
  camera.position.set(px, py, pz)
  camera.lookAt(tx, ty, tz)
  return camera
}


function initLights(scene) {
  // web-ifc-three example/src/scene.js
  const directionalLight1 = new THREE.DirectionalLight(0xffeeff, 0.8)
  directionalLight1.position.set(1, 1, 1)
  scene.add(directionalLight1)
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight2.position.set(-1, 0.5, -1)
  scene.add(directionalLight2)
  const ambientLight = new THREE.AmbientLight(0xffffee, 0.25)
  scene.add(ambientLight)
}


function takeScreenshot(glCtx, outputFilename = 'screenshot.png') {
  const width = glCtx.drawingBufferWidth
  const height = glCtx.drawingBufferHeight
  const pixels = new Uint8Array(width * height * 4)
  glCtx.readPixels(0, 0, width, height, glCtx.RGBA, glCtx.UNSIGNED_BYTE, pixels)

  // Prepare a new PNG using the pixel data
  const png = new PNG({width, height})

  // WebGL's pixel data is upside down, so flip it
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      const offset = (y * width + x) * 4
      const srcOffset = ((height - y - 1) * width + x) * 4
      for (let i = 0; i < 4; ++i) {
        png.data[offset + i] = pixels[srcOffset + i]
      }
    }
  }

  // Save the PNG to a file
  png.pack().pipe(fs.createWriteStream(outputFilename))
}


async function loadModel() {
  const ifcLoader = new IFCLoader()
  // TODO(pablo): HAAAACK. This is relative to node_modules/web-ifc-three.
  ifcLoader.ifcManager.setWasmPath('../web-ifc/')
  const fileBuf = fs.readFileSync('./index.ifc')
  const arrayBuf = Uint8Array.from(fileBuf).buffer
  const ifcModel = await ifcLoader.parse(arrayBuf)
  return ifcModel
}


const w = 1024, h = 768
const aspect = w / h

initDom()
const glCtx = initGl(w, h)
const renderer = initRenderer(glCtx, w, h)

const scene = new THREE.Scene()
const camera = initCamera(45, aspect, -50, 40, 120, 0)
initLights(scene)

const model = await loadModel()
model.position.set(-40, 0, 0)
scene.add(model)

// headless gl has some rendering issues, e.g. no-AA
// See https://github.com/stackgl/headless-gl/issues/30
const useSsaa = false
if (useSsaa) {
  const composer = new EffectComposer(renderer)
  composer.setPixelRatio(window.devicePixelRatio || 1)
  // composer.addPass(new RenderPass(scene, camera))
  const ssaaPass = new SSAARenderPass(scene, camera)
  ssaaPass.sampleLevel = 2
  ssaaPass.unbiased = true
  ssaaPass.clearColor = 0xffffff
  ssaaPass.clearAlpha = 1.0
  ssaaPass.enabled = true
  composer.addPass(ssaaPass)
  composer.addPass(new ShaderPass(GammaCorrectionShader))
  composer.render()
} else {
  renderer.render(scene, camera)
}

takeScreenshot(glCtx)
