import express from 'express'
import * as THREE from 'three'
import {initDom, initGl, initRenderer, initCamera, initLights, captureScreenshot, loadIfcUrl} from './lib.js'

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

  const model = await loadIfcUrl(req.body.url)
  model.position.set(-40, 0, 0)
  scene.add(model)

  if (req.body.camera) {
    console.log('Changing camera view...')
    camera.lookAt(req.body.camera.x, req.body.camera.y, req.body.camera.z)
    camera.setFocalLength(600)
  }

  renderer.render(scene, camera)

  res.setHeader('content-type', 'image/png')
  captureScreenshot(glCtx).pipe(res)
})

app.listen(port, () => {
  console.log(`Listening on 0.0.0.0:${port}`)
})
