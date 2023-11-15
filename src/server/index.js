import express from 'express'
import * as Sentry from '@sentry/node'
import debug, {INFO} from '../debug.js'
import {createTaggedLogger} from '../logging.js'
import renderHandler from './render.js'
import healthcheckHandler from './healthcheck.js'


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


app.get('/healthcheck', healthcheckHandler)
app.post('/render', renderHandler)
// Install Sentry error handler after all routes but before any other error handlers
app.use(Sentry.Handlers.errorHandler())


app.listen(port, () => {
  debug(INFO).log(`Listening on 0.0.0.0:${port}`)
})
