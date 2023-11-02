import winston from 'winston'


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
export function createTaggedLogger(tag: string, filterCb?: Function) {
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


function tagFormat(filterCb?: Function) {
  return winston.format.printf((info: Record<string, string>) => {
    const {label, level, message} = info
    const metadata = filterCb ? filterCb(info.metadata) : info.metadata
    const metaString = metadata ? `, payload: ${JSON.stringify(metadata)}` : ''
    return `[${label}] ${level}: ${message}${metaString}`
  })
}
