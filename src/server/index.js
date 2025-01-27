import express from 'express'
import * as Sentry from '@sentry/node'
import debug, { INFO } from '../debug.js'
import { renderHandler, renderPanoramicHandler } from './render.js'
import healthcheckHandler from './healthcheck.js'
import { createRequestLogger } from '../logging.js'


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

// Register our request logging middleware
app.use(createRequestLogger())

// Register our routes and their respective handlers
app.get('/healthcheck', healthcheckHandler)
app.post('/render', renderHandler)
app.post('/renderPanoramic', renderPanoramicHandler)

// Install Sentry error handler after all routes but before any other error handlers
app.use(Sentry.Handlers.errorHandler())


app.listen(port, () => {
  debug(INFO).log(`Listening on 0.0.0.0:${port}`)
})
