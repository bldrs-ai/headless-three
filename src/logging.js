import winston from 'winston'
import { nanoid } from 'nanoid/non-secure';


export const logger = winston.createLogger({
    transports: [
        new winston.transports.Console()
    ]
})


/**
 * For example:
 *
 *   createTaggedLogger('http').info('yo', {foo: 'bar'})
 *
 * yields:
 *
 *   [http] info: yo {foo: 'bar'}
 */
export function createTaggedLogger(tag, filterCb) {
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.label({label: tag}),
      winston.format.colorize(),
      winston.format.metadata({fillExcept: ['level', 'label', 'message']}),
      winston.format.simple(),
      tagFormat(filterCb)
    ),
    transports: [
        new winston.transports.Console()
    ]
  })
}


function tagFormat(filterCb) {
  return winston.format.printf((info) => {
    const {label, level, message} = info
    const metadata = filterCb ? filterCb(info.metadata) : info.metadata
    const metaString = metadata ? `, payload: ${JSON.stringify(metadata)}` : ''
    return `[${label}] ${level}: ${message}${metaString}`
  })
}

export const createRequestLogger = (logger) => {
  if (logger === undefined) {
    logger = winston.createLogger({
      format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
      ),
      transports: [
        new winston.transports.Console()
      ]
    })
  }

  return (req, res, next) => {
    req.requestId = nanoid()
    req.timestamp = new Date()
    req.logger = logger

    let bytesSent = 0

    // Patch each of the egress methods to accumulate data for logging.
    const originalWrite = res.write
    const originalEnd = res.end
    const chunks = []

    chunks.push(Buffer.from(`[${req.requestId}] ${req.ip} - - [${req.timestamp.toISOString()}] "${req.method} ${req.originalUrl} HTTP/${req.httpVersion}" `))

    res.write = function (chunk, ...rest) {
      bytesSent += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk)
      return originalWrite.call(res, chunk, ...rest)
    }

    res.end = function (chunk, ...rest) {
      if (chunk) {
        bytesSent += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk)
      }
      chunks.push(Buffer.from(`${res.statusCode} ${bytesSent} `))

      logger.info(Buffer.concat(chunks).toString('utf-8'))
      logger.info(`[${req.requestId}] request headers: ${JSON.stringify(req.headers)}`)

      if (req.is('json')) {
        logger.info(`[${req.requestId}] request body: ${JSON.stringify(req.body)}`)
      }

      return originalEnd.call(res, chunk, ...rest)
    }

    // Don't forget to call next() to pass on to the next middleware/route handler!
    next()
  }
}
