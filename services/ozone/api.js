/* eslint-env node */

'use strict'

const dd = require('dd-trace')

dd.tracer
  .init()
  .use('express', {
    hooks: { request: maintainXrpcResource },
  })

const path = require('node:path')

function maintainXrpcResource(span, req) {
  // Show actual xrpc method as resource rather than the route pattern
  if (span && req.originalUrl?.startsWith('/xrpc/')) {
    span.setTag(
      'resource.name',
      [
        req.method,
        path.posix.join(req.baseUrl || '', req.path || '', '/').slice(0, -1), // Ensures no trailing slash
      ]
        .filter(Boolean)
        .join(' '),
    )
  }
}

// Tracer code above must come before anything else
const {
  Database,
  OzoneService,
  envToCfg,
  envToSecrets,
  httpLogger,
  readEnv,
} = require('@atproto/ozone')

const main = async () => {
  const env = readEnv()
  const cfg = envToCfg(env)
  const secrets = envToSecrets(env)

  const migrate = process.env.OZONE_DB_MIGRATE === '1'
  if (migrate) {
    const db = new Database({
      url: cfg.db.postgresUrl,
      schema: cfg.db.postgresSchema,
    })
    await db.migrateToLatestOrThrow()
    await db.close()
  }

  const ozone = await OzoneService.create(cfg, secrets)

  await ozone.start()

  httpLogger.info('ozone is running')

  // Graceful shutdown (see also https://aws.amazon.com/blogs/containers/graceful-shutdowns-with-ecs/)
  process.on('SIGTERM', async () => {
    httpLogger.info('ozone is stopping')

    await ozone.destroy()
    httpLogger.info('ozone is stopped')
  })
}

main()
