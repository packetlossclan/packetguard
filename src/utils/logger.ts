type Level = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

function serializeMeta(meta: unknown): string {
  return JSON.stringify(meta, (_key, value) => {
    if (value instanceof Error) {
      return { message: value.message, name: value.name, stack: value.stack }
    }
    return value
  })
}

function log(level: Level, message: string, meta?: unknown): void {
  const timestamp = new Date().toISOString()
  const metaStr = meta !== undefined ? ` ${serializeMeta(meta)}` : ''
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
