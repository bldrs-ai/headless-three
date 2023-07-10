import * as THREE from 'three'
import {initCamera, initDom, initGl, initLights, initRenderer, loadIfcModel, takeScreenshot} from "./lib.js";
import './fetch-polyfill.js'

import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js'
import {SSAARenderPass} from 'three/addons/postprocessing/SSAARenderPass.js'
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js'
import {GammaCorrectionShader} from 'three/addons/shaders/GammaCorrectionShader.js'


if (process.argv.length < 3) {
  console.error('Usage: node headless.js <file.ifc>')
  process.exit(1)
}

const w = 1024, h = 768
const aspect = w / h

initDom()
const glCtx = initGl(w, h)
const renderer = initRenderer(glCtx, w, h)

const scene = new THREE.Scene()
const camera = initCamera(45, aspect, -50, 40, 120, 0)
initLights(scene)

const model = await loadIfcModel(process.argv[2])
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
