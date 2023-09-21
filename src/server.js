import express from 'express'
import {
  fitModelToFrame,
  initThree,
  render,
  captureScreenshot,
  parseCamera,
} from "./lib.js"
import {parseUrl} from './urls.js'
import {load} from './Loader.js'
import debug from './debug.js'


const app = express()
const port = 8001
app.use(express.json())
app.post('/render', handler)
app.listen(port, () => {
  debug().log(`Listening on 0.0.0.0:${port}`)
})


async function handler(req, res) {
  const [glCtx, renderer, scene, camera] = initThree()
  const modelUrl = new URL(req.body.url)
  const parsedUrl = parseUrl(modelUrl)
  // debug().log('server#post, parsedUrl:', parsedUrl)
  if (parsedUrl.target === undefined) {
    res.status(404).send(`Cannot parse URL: ${modelUrl}`).end()
    return
  }
  const [px, py, pz, tx, ty, tz] = parseCamera(parsedUrl.params.c) || [0,0,0,0,0,0]
  const targetUrl = parsedUrl.target.url
  // debug().log('server#post: calling load on parsedUrl.target:', targetUrl)
  let model
  try {
    model = await load(targetUrl)
  } catch (e) {
    const msg = `Internal server error ${e}`
    debug().log(msg)
    res.sendStatus(500) // .send(msg).end()
    return;
  }
  if (model === undefined) {
    const msg = `Could not load model for unknown reason`
    debug().log(msg)
    res.sendStatus(500) // .send(msg).end()
    return;
  }

  debug().log('server#post, model:', model)
  scene.add(model)
  fitModelToFrame(renderer.domElement, scene, model, camera)
  if (isFinite(px) && isFinite(py) && isFinite(pz)) {
    camera.position.set(px, py, pz)
  }
  if (isFinite(tx) && isFinite(ty) && isFinite(tz)) {
    debug().log(`server#post, camera.pos(${px}, ${py}, ${pz}) target.pos(${tx}, ${ty}, ${tz})`)
    camera.lookAt(tx, ty, tz)
  } else {
    debug().log(`server#post, camera.pos(${px}, ${py}, ${pz}) target.pos(0, 0, 0)`)
    camera.lookAt(0, 0, 0)
  }
  const useSsaa = false
  render(renderer, scene, camera, useSsaa)
  res.setHeader('content-type', 'image/png')
  captureScreenshot(glCtx).pipe(res)
}
