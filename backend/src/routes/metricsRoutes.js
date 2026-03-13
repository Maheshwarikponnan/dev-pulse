import { Router } from 'express'

import { createMetricsController } from '../controllers/metricsController.js'

export function createMetricsRoutes(metricsService) {
  const router = Router()
  const metricsController = createMetricsController(metricsService)

  router.get('/metrics/current', metricsController.getCurrentMetrics)
  router.get('/metrics/history', metricsController.getMetricsHistory)
  router.get('/status', metricsController.getServerStatus)

  return router
}