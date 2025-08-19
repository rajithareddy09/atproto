'use strict'

const { PlcServer } = require('@atproto/did-plc')
const { Database } = require('@atproto/did-plc')

const port = process.env.PLC_PORT || 2582
const dbUrl = process.env.PLC_DB_POSTGRES_URL
const adminPassword = process.env.PLC_ADMIN_PASSWORD
const signingKeyHex = process.env.PLC_SIGNING_KEY_HEX

async function main() {
  let db
  if (dbUrl) {
    // Use PostgreSQL database
    db = Database.postgres({ url: dbUrl })
  } else {
    // Use in-memory database for development
    db = Database.mock()
  }

  const server = PlcServer.create({
    db,
    port,
    adminPassword,
    signingKeyHex,
  })

  await server.start()
  console.log(`PLC server running on port ${port}`)
}

main().catch((err) => {
  console.error('Failed to start PLC server:', err)
  process.exit(1)
})
