import express from 'express'
import * as THREE from 'three'
import {initDom, initGl, initRenderer, initCamera, initLights, captureScreenshot, loadIfcUrl} from './lib.js'
import {parseURLFromBLDRS} from './urls.js'

const app = express()
const port = 8001

app.use(express.json())

app.post('/rasterize', async (req, res) => {
  console.log(req.body)

  const w = 1024, h = 768
  const aspect = w / h

  initDom()
  const glCtx = initGl(w, h)
  const renderer = initRenderer(glCtx, w, h)

  const scene = new THREE.Scene()
  const camera = initCamera(45, aspect, -50, 40, 120, 0)
  initLights(scene)

  let ifcURL = req.body.url
  let coordinates = []

  const url = new URL(ifcURL)
  if (url.hostname === 'bldrs.ai') {
    const b = parseURLFromBLDRS(url)
    ifcURL = b.target.url

    if ('c' in b.params) {
      coordinates = b.params['c'].split(',').map(f => parseFloat(f))
    }
  }

  const model = await loadIfcUrl(ifcURL)
  scene.add(model)

  // Normalize look and zoom to fit the model in the render frame using
  // the same alg as Share.
  fitModelToFrame(renderer.domElement, scene, model, camera)

  if (req.body.camera) {
    coordinates = [
      req.body.camera.cx, req.body.camera.cy, req.body.camera.cz,
      req.body.camera.tx, req.body.camera.ty, req.body.camera.tz
    ]
  }

  if (coordinates.length === 6) {
    camera.position.set(coordinates[0], coordinates[1], coordinates[2])
    camera.lookAt(coordinates[3], coordinates[4], coordinates[5])
  }

  renderer.render(scene, camera)

  res.setHeader('content-type', 'image/png')
  captureScreenshot(glCtx).pipe(res)
})

app.listen(port, () => {
  console.log(`Listening on 0.0.0.0:${port}`)
})
