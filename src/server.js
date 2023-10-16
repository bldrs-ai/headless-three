import express from 'express'
import * as Sentry from '@sentry/node'
import {
  fitModelToFrame,
  initThree,
  render,
  captureScreenshot,
  parseCamera,
} from "./lib.js"
import {parseUrl} from './urls.js'
import {load} from './Loader.js'
import debug, {INFO} from './debug.js'


const app = express()
const port = 8001

// Initialize and enable Sentry middleware
// It must be the first middleware in the stack
Sentry.init({
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({
      // to trace all requests to the default router
      app,
      // alternatively, you can specify the routes you want to trace:
      // router: someRouter,
    }),
  ],
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
})
app.use(Sentry.Handlers.requestHandler())
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler())

// Enable JSON request body middleware
app.use(express.json())
app.post('/render', handler)
app.get('/healthcheck', (req, res) => {
  res.status(200).send()
})
// Install Sentry error handler after all routes but before any other error handlers
app.use(Sentry.Handlers.errorHandler())
app.listen(port, () => {
  debug(INFO).log(`Listening on 0.0.0.0:${port}`)
})

async function handler(req, res) {
  const [glCtx, renderer, scene, camera] = initThree()
  const modelUrl = new URL(req.body.url)
  const parsedUrl = parseUrl(modelUrl)
  debug().log('server#post, parsedUrl:', parsedUrl)
  if (parsedUrl.target === undefined) {
    res.status(404).send(`Cannot parse URL: ${modelUrl}`).end()
    return
  }
  const [px, py, pz, tx, ty, tz] = parsedUrl.params.c ? parseCamera(parsedUrl.params.c) : [0,0,0,0,0,0]
  const targetUrl = parsedUrl.target.url
  let model
  try {
    model = await load(targetUrl)
  } catch (e) {
    const msg = `Internal server error ${e}`
    console.trace(e)
    res.status(500).send(msg)
    return
  }
  if (model === undefined) {
    const msg = `Could not load model for unknown reason`
    console.trace(msg)
    res.status(500).send(msg)
    return
  }

  // debug().log('server#post, model:', model)
  scene.add(model)

  if (parsedUrl.params.c) {
    const [px, py, pz, tx, ty, tz] = parseCamera(parsedUrl.params.c) || [0,0,0,0,0,0]
    debug().log(`headless#camera setting: camera.pos(${px}, ${py}, ${pz}) target.pos(${tx}, ${ty}, ${tz})`)
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
  } else {
    fitModelToFrame(renderer.domElement, scene, model, camera)
  }

  const useSsaa = false
  render(renderer, scene, camera, useSsaa)
  res.setHeader('content-type', 'image/png')
  captureScreenshot(glCtx).pipe(res)
}
