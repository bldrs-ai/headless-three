import {
  captureScreenshot, fitModelToFrame, initThree, parseCamera, render,
  initSimpleViewerScene
} from '../lib.js'
import {parseUrl} from '../urls.js'
import {load} from '../Loader.js'
import {createTaggedLogger} from '../logging.js'
import * as THREE from 'three'
import Jimp from 'jimp'
// eslint-disable-next-line no-unused-vars
import { SimpleViewerScene } from '@bldrs-ai/conway-web-ifc-adapter/node_modules/@bldrs-ai/conway/compiled/src/rendering/threejs/simple_viewer_scene.js'


const renderLogger = createTaggedLogger('/render')

export const renderHandler = async (req, res) => {
  if (req.body === undefined || !req.body.url) {
    res.status(400).end('No valid model URL was provided')
    return
  }

  let modelUrl
  try {
    modelUrl = new URL(req.body.url)
  } catch {
    res.status(400).end('No valid model URL was provided')
    return
  }

  // Set the viewer parameter to "conway" by default if not provided
  const viewer = req.body.viewer ?? "threejs";

  const parsedUrl = parseUrl(modelUrl)
  renderLogger.log('debug', 'server#post, parsedUrl:', parsedUrl)
  if (parsedUrl.target === undefined) {
    renderLogger.warn('File not found')
    res.status(404).send(`Cannot parse URL: ${modelUrl}`).end()
    return
  }
  const targetUrl = parsedUrl.target.url
  let model
  try {
    model = await load(targetUrl)
  } catch (e) {
    console.trace('Load failed', e)
    const msg = `Internal server error ${e}`
    renderLogger.error(msg)
    res.status(500).send(msg)
    return
  }
  if (model === undefined) {
    const msg = `Could not load model for unknown reason`
    renderLogger.error(msg)
    res.status(500).send(msg)
    return
  }


  let simpleViewerScene, scene, camera, renderer, glCtx
  if (viewer === 'threejs') {
    [glCtx, renderer, scene, camera] = initThree()
    scene.add(model)
  } else if (viewer === 'conway') {
     ({ simpleViewerScene, scene, camera, renderer, glCtx } = await initSimpleViewerScene());
     simpleViewerScene.addModelToScene(model)
  }

  if (parsedUrl.params.c) {
    const [px, py, pz, tx, ty, tz] = parseCamera(parsedUrl.params.c) || [0,0,0,0,0,0]
    renderLogger.log('debug', `headless#camera setting: camera.pos(${px}, ${py}, ${pz}) target.pos(${tx}, ${ty}, ${tz})`)
    if (isFinite(px) && isFinite(py) && isFinite(pz)) {
      camera.position.set(px, py, pz)
    }
    if (isFinite(tx) && isFinite(ty) && isFinite(tz)) {
      renderLogger.log('debug', `server#post, camera.pos(${px}, ${py}, ${pz}) target.pos(${tx}, ${ty}, ${tz})`)
      camera.lookAt(tx, ty, tz)
    } else {
      renderLogger.log('debug', `server#post, camera.pos(${px}, ${py}, ${pz}) target.pos(0, 0, 0)`)
      camera.lookAt(0, 0, 0)
    }
  } else {
    fitModelToFrame(renderer.domElement, scene, model, camera)
  }

  const useSsaa = false
  render(renderer, scene, camera, useSsaa)
  res.setHeader('content-type', 'image/png')
  captureScreenshot(glCtx).pipe(res)
}


/**
 * Example usage:
 *    POST /renderPanoramic
 *    body: { "url": "https://domain.com/some-model.glb?c=10,10,10,0,0,0" }
 */
export const renderPanoramicHandler = async (req, res) => {
  if (!req.body || !req.body.url) {
    res.status(400).end('No valid model URL was provided')
    return
  }

  let modelUrl
  try {
    modelUrl = new URL(req.body.url)
  } catch {
    res.status(400).end('No valid model URL was provided')
    return
  }

  // Set the viewer parameter to "conway" by default if not provided
  const viewer = req.body.viewer ?? "threejs";

  const parsedUrl = parseUrl(modelUrl)
  renderLogger.log('debug', 'renderPanoramic#parsedUrl:', parsedUrl)

  if (!parsedUrl.target) {
    const msg = `Cannot parse URL: ${modelUrl}`
    renderLogger.warn(msg)
    res.status(404).send(msg).end()
    return
  }
  const targetUrl = parsedUrl.target.url

  const [px, py, pz, tx, ty, tz] = parsedUrl.params.c
    ? parseCamera(parsedUrl.params.c)
    : [0, 0, 0, 0, 0, 0]

  let model
  try {
    model = await load(targetUrl)
  } catch (e) {
    const msg = `Internal server error while loading model: ${e}`
    renderLogger.error(msg)
    console.trace('Load failed', e)
    res.status(500).send(msg)
    return
  }

  if (!model) {
    const msg = 'Could not load model for unknown reason'
    renderLogger.error(msg)
    res.status(500).send(msg)
    return
  }

  let simpleViewerScene, scene, camera, renderer, glCtx
  if (viewer === 'threejs') {
    [glCtx, renderer, scene, camera] = initThree()
    scene.add(model)
  } else if (viewer === 'conway') {
     ({ simpleViewerScene, scene, camera, renderer, glCtx } = await initSimpleViewerScene());
     simpleViewerScene.addModelToScene(model)
  }

  if (parsedUrl.params.c) {
    renderLogger.log(
      'debug',
      `renderPanoramic#camera setting: camera.pos(${px},${py},${pz}) target.pos(${tx},${ty},${tz})`
    )
    if (Number.isFinite(px) && Number.isFinite(py) && Number.isFinite(pz)) {
      camera.position.set(px, py, pz)
    }
    if (Number.isFinite(tx) && Number.isFinite(ty) && Number.isFinite(tz)) {
      camera.lookAt(tx, ty, tz)
    } else {
      camera.lookAt(0, 0, 0)
    }
  } else {
    fitModelToFrame(renderer.domElement, scene, model, camera)
  }

  const screenshotBuffers = []

  // --- 1) DEFAULT vantage (fit the model to frame, if no custom camera param)
  fitModelToFrame(renderer.domElement, scene, model, camera)
  render(renderer, scene, camera, /*useSsaa*/ false)
  screenshotBuffers.push(await captureScreenshotAsBuffer(glCtx))

  //
  // 2) SECOND SCREENSHOT – Use local clipping plane to “slice off” the roof
  //

  // a) Enable local clipping in the renderer
  renderer.localClippingEnabled = true

  // b) Decide a Y cut. You can base it on the building’s bounding box:
  const boundingBox = new THREE.Box3().setFromObject(model)
  const size = boundingBox.getSize(new THREE.Vector3())
  const roofY = boundingBox.max.y - 0.2 * size.y

  // c) Create a plane that clips geometry *above* this roofY
  // By default, a plane is (normal, constant). For normal=(0, -1, 0),
  // any point with `dot(normal, point) – constant > 0` is clipped.
  const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), roofY)

  // d) Attach this plane to the mesh materials
  model.traverse((child) => {
    if (child.isMesh && child.material) {
      // Some meshes have multiple materials in an array:
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material]
      materials.forEach((m) => {
        m.clippingPlanes = [clipPlane]
        m.clipShadows = true
      })
    }
  })


  //camera.position.set(center.x, boundingBox.max.y + size.y, center.z)
  //camera.lookAt(center)
  fitModelToFrame(renderer.domElement, scene, model, camera, false)

  // f) Render & capture
  render(renderer, scene, camera, /*useSsaa*/ false)
  screenshotBuffers.push(await captureScreenshotAsBuffer(glCtx))

  // remove the plane for the last two images
  model.traverse((child) => {
    if (child.isMesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material]
      materials.forEach((m) => {
        m.clippingPlanes = []
      })
    }
  })


  // --- 3) ANGLE 45° around the pivot
  fitModelToFrame(renderer.domElement, scene, model, camera, true, 45)

  render(renderer, scene, camera, /*useSsaa*/ false)
  screenshotBuffers.push(await captureScreenshotAsBuffer(glCtx))

  // --- 4) ANGLE 225° around the pivot
  fitModelToFrame(renderer.domElement, scene, model, camera, true, 225)

  render(renderer, scene, camera, /*useSsaa*/ false)
  screenshotBuffers.push(await captureScreenshotAsBuffer(glCtx))

  // 9) Stitch the 4 buffers into one image (2x2)
  //    Then return that as the response (image/png)
  try {
    const stitched = await stitchImages2x2(screenshotBuffers)
    const finalBuffer = await stitched.getBufferAsync(Jimp.MIME_PNG)

    res.setHeader('Content-Type', 'image/png')
    res.send(finalBuffer)
  } catch (err) {
    const msg = `Error stitching panoramic images: ${err}`
    renderLogger.error(msg)
    res.status(500).send(msg)
  }
}


/**
 * Helper: Captures a PNG screenshot from your existing `captureScreenshot`
 * but returns the PNG data as a Buffer.
 */
async function captureScreenshotAsBuffer(glCtx) {
  return new Promise((resolve, reject) => {
    const chunks = []
    captureScreenshot(glCtx)
      .on('data', (chunk) => chunks.push(chunk))
      .on('end', () => resolve(Buffer.concat(chunks)))
      .on('error', (err) => reject(err))
  })
}


/**
 * Helper: Given 4 PNG buffers, stitch them into a 2x2 image using Jimp.
 */
async function stitchImages2x2(buffers) {
  if (buffers.length !== 4) {
    throw new Error('stitchImages2x2 expects exactly 4 images.')
  }

  // Read each buffer into a Jimp image
  const [topLeft, topRight, bottomLeft, bottomRight] = await Promise.all(
    buffers.map((buf) => Jimp.read(buf))
  )

  // Assume all screenshots have the same dimensions
  const w = topLeft.bitmap.width
  const h = topLeft.bitmap.height

  // Create new Jimp canvas double the width and height
  const stitched = new Jimp(w * 2, h * 2, 0xffffffff) // white background, optional

  // Composite images in a 2x2 grid
  stitched.composite(topLeft, 0, 0)
  stitched.composite(topRight, w, 0)
  stitched.composite(bottomLeft, 0, h)
  stitched.composite(bottomRight, w, h)

  return stitched
}
