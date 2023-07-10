import {JSDOM} from 'jsdom'
import gl from 'gl'
import * as THREE from 'three'
import {PNG} from 'pngjs'
import fs from 'fs'
import axios from 'axios'
import './fetch-polyfill.js'

import {IFCLoader} from 'web-ifc-three/dist/web-ifc-three.js'

/** Init global.document, which three uses to create its canvas. */
export function initDom() {
  const dom = new JSDOM(`<!DOCTYPE html>`, {pretendToBeVisual: true})
  global.window = dom.window
  global.document = window.document
}


/** Create a WebGL context using the 'gl' package. */
export function initGl(width, height) {
  const glCtx = gl(width, height, {antialias: true})
  return glCtx
}


export function initRenderer(glCtx, width, height) {
  const renderer = new THREE.WebGLRenderer({context: glCtx, antialias: true})
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setClearColor(0xffffff, 1)
  return renderer
}


export function initCamera(fov = 45, aspect = 1, px = 0, py = 0, pz = 0, tx = 0, ty = 0, tz = 0) {
  const camera = new THREE.PerspectiveCamera(fov, aspect)
  camera.position.set(px, py, pz)
  camera.lookAt(tx, ty, tz)
  return camera
}


export function initLights(scene) {
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


export function takeScreenshot(glCtx, outputFilename = 'screenshot.png') {
  captureScreenshot(glCtx).pipe(fs.createWriteStream(outputFilename))
}

export function captureScreenshot(glCtx) {
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
  return png.pack()
}


export async function loadIfcModel(filename) {
  const ifcLoader = new IFCLoader()
  // TODO(pablo): HAAAACK. This is relative to node_modules/web-ifc-three.
  ifcLoader.ifcManager.setWasmPath('../web-ifc/')

  const fileBuf = fs.readFileSync(filename)
  const arrayBuf = Uint8Array.from(fileBuf).buffer
  const ifcModel = await ifcLoader.parse(arrayBuf)
  return ifcModel
}

export async function loadIfcFromUrl(u) {
  const ifcLoader = new IFCLoader()
  await ifcLoader.ifcManager.setWasmPath('../web-ifc/')

  const response = await axios.get(u, { responseType: 'arraybuffer' })
  const ifcModel = await ifcLoader.parse(response.data)
  return ifcModel
}
