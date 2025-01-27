import fs from 'fs'
import gl from 'gl'
import {JSDOM} from 'jsdom'
import {PNG} from 'pngjs'
import url from 'node:url'
import * as THREE from 'three'
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js'
import {SSAARenderPass} from 'three/addons/postprocessing/SSAARenderPass.js'
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js'
import {GammaCorrectionShader} from 'three/addons/shaders/GammaCorrectionShader.js'


/** Init global.document, which three uses to create its canvas. */
export function initDom() {
  const dom = new JSDOM(`<!DOCTYPE html>`, {pretendToBeVisual: true})
  global.window = dom.window
  global.document = window.document
  global.self = global.window
  global.self.URL = url.URL

  // Needed by camera-controls
  global.DOMRect = class DOMRect {
    constructor (x = 0, y = 0, width = 0, height = 0) {
      this.left = width < 0 ? x + width : x
      this.right = width < 0 ? x : x + width
      this.top = height < 0 ? y + height : y
      this.bottom = height < 0 ? y : y + height
    }
    static fromRect(other){
      return new DOMRect(other.x, other.y, other.width, other.height)
    }
    toJSON() {
      return JSON.stringify(this)
    }
  }

  return global.document
}


/** Create a WebGL context using the 'gl' package. */
export function initGl(width, height) {
  const glCtx = gl(width, height, {antialias: true})
  if (glCtx === null) {
    throw new Error('Could not create requested WebGL context')
  }

  return glCtx
}


/** Setup fullscreen renderer. */
export function initRenderer(glCtx, width, height) {
  const renderer = new THREE.WebGLRenderer({context: glCtx, antialias: true})
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setClearColor(0xffffff, 1)
  return renderer
}


export function initCamera(fov = 45, aspect = 3) {
  const camera = new THREE.PerspectiveCamera(fov, aspect)
  return camera
}


/** Setup a couple directional lights and one ambient to make the scene look good. */
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


export function initThree(w = 1024, h = 768) {
  const aspect = w / h
  const dom = initDom()
  const glCtx = initGl(w, h)
  const renderer = initRenderer(glCtx, w, h)
  const scene = new THREE.Scene()
  initLights(scene)
  const camera = initCamera(45, aspect)
  return [glCtx, renderer, scene, camera]
}


/** Reads the pixels from the gl screen, then writes them as PNG data. */
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


/**
 * Takes a screenshot of the scene from the camera and writes it out
 * to a png.
 */
export function saveScreenshot(glCtx, outputFilename = 'screenshot.png', returnBuffer = false) {
  if (!returnBuffer) {
    // Default: write to file
    captureScreenshot(glCtx).pipe(fs.createWriteStream(outputFilename))
    return
  }

  // If `returnBuffer` is true, accumulate the stream into a Buffer and resolve it
  return new Promise((resolve, reject) => {
    const chunks = []
    captureScreenshot(glCtx)
      .on('data', (chunk) => chunks.push(chunk))
      .on('end', () => resolve(Buffer.concat(chunks)))
      .on('error', (err) => reject(err))
  })
}


/** Uses camera-controls library to zoom the camera to fill dom view with the model. */
export function fitModelToFrame(domElement, scene, model, camera) {
  const boundingBox = new THREE.Box3().setFromObject(model)
  const sceneSize = new THREE.Vector3()
  boundingBox.getSize(sceneSize)
  const sceneCenter = new THREE.Vector3()
  boundingBox.getCenter(sceneCenter)

  /*
  const helper = new THREE.Box3Helper(boundingBox, 0x000000)
  scene.add(helper)
  */

  function radFromDeg(degrees) {
    return (degrees * Math.PI) / 180
  }
  const halfAngle = radFromDeg(camera.fov / 2)
  const tanOfHalfY = Math.tan(halfAngle)
  const tanOfHalfX = tanOfHalfY * camera.aspect
  const halfOfBBWidth = sceneSize.x / 2
  const halfOfBBHeight = sceneSize.y / 2
  const zDistX = halfOfBBWidth / tanOfHalfX
  const zDistY = halfOfBBHeight / tanOfHalfY
  const zDist = Math.max(zDistX, zDistY)
  const frontOfBBRelToOrigin = sceneSize.z
  const move = new THREE.Vector3(sceneCenter.x, sceneCenter.y, sceneCenter.z + ( ( sceneSize.z / 2 ) + zDist ) )
  camera.position.set(move.x, move.y, move.z)
  const cx = camera.position.x
  const cy = camera.position.y
  const cz = camera.position.z
  // console.log(`halfAngle(${halfAngle}), tanOfHalfY(${tanOfHalfY}), tanOfHalfX(${tanOfHalfX}), halfOfBBWidth(${halfOfBBWidth}), halfOfBBHeight(${halfOfBBHeight}) camera.position:`, cx, cy, cz)
}


/**
 * Just calls renderer.render, or does an experimental
 * post-processing if useSsaa is true.
 */
export function render(renderer, scene, camera, useSsaa = false) {
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
}


/**
 * Just splits the given string on ','.  TODO(pablo): combine with
 * Share lib.
 * @param {string} pStr
 * @return {string}
 */
export function parseCamera(encodedCameraStr) {
  const parts = encodedCameraStr.split(',').map((x) => parseFloat(x))
  return parts.concat(new Array(6 - parts.length).fill(0))
}
