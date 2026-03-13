import http from 'node:http'
import process from 'node:process'

import dotenv from 'dotenv'
import { Server } from 'socket.io'

import { createApp } from './app.js'
import {
  connectToDatabase,
  disconnectDatabase,
  getDatabaseStatus,
} from './config/db.js'
import { MetricsService } from './services/metricsService.js'
import { registerMetricsSocket } from './sockets/metricsSocket.js'

dotenv.config()

const port = Number(process.env.PORT ?? 3001)
const allowedOrigins = (process.env.CLIENT_URLS ?? process.env.CLIENT_URL ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const metricsService = new MetricsService({
  sampleIntervalMs: Number(process.env.METRIC_INTERVAL_MS ?? 2_000),
  persistIntervalMs: Number(process.env.METRIC_PERSIST_MS ?? 10_000),
})

const databaseConnected = await connectToDatabase({
  onStateChange(isConnected, status) {
    metricsService.setDatabaseState(isConnected, status)
  },
})

metricsService.setDatabaseState(databaseConnected, getDatabaseStatus())

const app = createApp({ metricsService })
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})

metricsService.setRealtimeServer(io)
registerMetricsSocket(io, metricsService)
await metricsService.start()

httpServer.listen(port, () => {
  console.log(`[server] DevPulse API listening on http://localhost:${port}`)
})

async function shutdown(signal) {
  console.log(`[server] Received ${signal}. Shutting down.`)

  await metricsService.stop()
  io.close()

  await new Promise((resolve) => {
    httpServer.close(resolve)
  })

  await disconnectDatabase()
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})