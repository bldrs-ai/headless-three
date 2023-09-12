import express from 'express'
import {
  fitModelToFrame,
  initThree,
  render,
  captureScreenshot,
} from "./lib.js"
import {parseUrl} from './urls.js'
import {load} from './Loader.js'
import debug from './debug.js'


const app = express()
const port = 8001

app.use(express.json())

function parseCamera(pStr) {
  if (pStr) {
    return pStr.split(',')
  }
}

app.post('/render', async (req, res) => {
  const [glCtx, renderer, scene, camera] = initThree()
  const modelUrl = new URL(req.body.url)
  const parsedUrl = parseUrl(modelUrl)
  debug().log('server#post, parsedUrl:', parsedUrl)
  const [px, py, pz, tx, ty, tz] = parseCamera(parsedUrl.params.c) || [0,0,0,0,0,0]
  const targetUrl = parsedUrl.target.url
  debug().log('server#post: calling load on parsedUrl.target:', targetUrl)
  const model = await load(targetUrl)
  debug().log('server#post, model:', model)
  scene.add(model)
  fitModelToFrame(renderer.domElement, scene, model, camera)
  camera.position.set(px, py, pz)
  camera.lookAt(tx, ty, tz)
  debug().log(`server#post, camera.pos(${px}, ${py}, ${pz}) target.pos(${tx}, ${ty}, ${tz})`)
  const useSsaa = false
  render(renderer, scene, camera, useSsaa)
  res.setHeader('content-type', 'image/png')
  captureScreenshot(glCtx).pipe(res)
})

app.listen(port, () => {
  debug().log(`Listening on 0.0.0.0:${port}`)
})
