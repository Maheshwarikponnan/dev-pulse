import cors from 'cors'
import express from 'express'

import { createMetricsRoutes } from './routes/metricsRoutes.js'

function parseAllowedOrigins() {
  return (process.env.CLIENT_URLS ?? process.env.CLIENT_URL ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function createApp({ metricsService }) {
  const app = express()

  app.use(
    cors({
      origin: parseAllowedOrigins(),
      credentials: true,
    }),
  )
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Request timing is tracked centrally so both REST traffic and synthetic
  // latency metrics share the same source of truth.
  app.use((req, res, next) => {
    const startedAt = process.hrtime.bigint()

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000

      metricsService.recordRequest({
        durationMs,
        statusCode: res.statusCode,
      })
    })

    next()
  })

  app.get('/', (_req, res) => {
    res.json({
      name: 'DevPulse API',
      docs: '/api/status',
    })
  })

  app.use('/api', createMetricsRoutes(metricsService))

  app.use((_req, res) => {
    res.status(404).json({
      error: 'Route not found.',
    })
  })

  app.use((error, _req, res, _next) => {
    console.error(`[api] ${error.message}`)
    res.status(error.statusCode ?? 500).json({
      error: error.message || 'Internal server error.',
    })
  })

  return app
}