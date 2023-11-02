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
import {createTaggedLogger} from './logging'


const renderLogger = createTaggedLogger('/render')

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

function loggingHandler(req, res, next) {

  let bytesSent = 0
  let responseHeaders

  // Patch each of the egress methods to accumulate data for logging.
  const originalWriteHead = res.writeHead
  const originalWrite = res.write
  const originalEnd = res.end

  res.writeHead = function (statusCode, headers) {
    responseHeaders = {
      statusCode: statusCode,
      headers: headers || res.getHeaders(),
    }
    return originalWriteHead.apply(res, arguments)
  }

  res.write = function (chunk, ...rest) {
    bytesSent += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk)
    return originalWrite.call(res, chunk, ...rest)
  }

  res.end = function (chunk, ...rest) {
    if (chunk) {
      bytesSent += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk)
    }
    renderLogger.info('response log stuff', {requestHeaders: req.rawHeaders, responseHeaders, responseSize: bytesSent})

    return originalEnd.call(res, chunk, ...rest)
  }

  // Don't forget to call next() to pass on to the next middleware/route handler!
  next()
}
app.use(loggingHandler)


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
  renderLogger.log('debug', 'server#post, parsedUrl:', parsedUrl)
  if (parsedUrl.target === undefined) {
    renderLogger.warn(msg)
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

  // renderLogger.log('server#post, model:', model)
  scene.add(model)

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
