type Level = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

function log(level: Level, message: string, meta?: unknown): void {
  const timestamp = new Date().toISOString()
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
  const line = `[${timestamp}] [${level}] ${message}${metaStr}`

  if (level === 'ERROR') {
    console.error(line)
  } else {
    console.log(line)
  }
}

export const logger = {
  info: (msg: string, meta?: unknown) => log('INFO', msg, meta),
  warn: (msg: string, meta?: unknown) => log('WARN', msg, meta),
  error: (msg: string, meta?: unknown) => log('ERROR', msg, meta),
  debug: (msg: string, meta?: unknown) => log('DEBUG', msg, meta),
}
