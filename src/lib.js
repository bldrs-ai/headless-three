import CameraControls from 'camera-controls'
import fs from 'fs'
import gl from 'gl'
import {JSDOM} from 'jsdom'
import {PNG} from 'pngjs'
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

  global.getComputedStyle = () => {
    return {
      marginTop: '0',
      marginRight: '0',
      marginBottom: '0',
      marginLeft: '0',
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


/** Reads the pixels from the gl screen, then writes them as PNG data. */
export function captureScreenshot(glCtx) {
  const width = glCtx.drawingBufferWidth
  const height = glCtx.drawingBufferHeight
  console.log('screenshot WxH', width, height)
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
export function saveScreenshot(glCtx, outputFilename = 'screenshot.png') {
  captureScreenshot(glCtx).pipe(fs.createWriteStream(outputFilename))
}


/** Uses camera-controls library to zoom the camera to fill dom view with the model. */
export function fitModelToFrame(domElement, scene, model, camera) {
  const box = new THREE.Box3().setFromObject(model)
  const sceneSize = new THREE.Vector3()
  box.getSize(sceneSize)
  const sceneCenter = new THREE.Vector3()
  box.getCenter(sceneCenter)
  const nearFactor = 0.5
  const radius = Math.max(sceneSize.x, sceneSize.y, sceneSize.z) * nearFactor
  const sphere = new THREE.Sphere(sceneCenter, radius)
  CameraControls.install( { THREE: THREE } )
  const cameraControls = new CameraControls(camera, domElement)
  cameraControls.fitToSphere(sphere, true)
}


/**
 * Just calls renderer.render, or does an experimental
 * post-processing if useSsaa is true.
 */
export function doRender(renderer, scene, camera, useSsaa = false) {
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
