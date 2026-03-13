// Controllers keep HTTP details thin and delegate data work to the service.
export function createMetricsController(metricsService) {
  return {
    async getCurrentMetrics(_req, res, next) {
      try {
        const metrics = await metricsService.getCurrentMetrics()
        res.json({ data: metrics })
      } catch (error) {
        next(error)
      }
    },

    async getMetricsHistory(req, res, next) {
      try {
        const limit = Number(req.query.limit ?? 60)
        const history = await metricsService.getHistory(limit)

        res.json({
          data: history,
          meta: {
            count: history.length,
            limit,
          },
        })
      } catch (error) {
        next(error)
      }
    },

    async getServerStatus(_req, res, next) {
      try {
        const metrics = await metricsService.getCurrentMetrics()
        const runtimeStatus = metricsService.getRuntimeStatus()

        res.json({
          data: {
            name: 'DevPulse API',
            status: runtimeStatus.status,
            checkedAt: new Date().toISOString(),
            database: {
              connected: runtimeStatus.databaseConnected,
              status: runtimeStatus.databaseStatus,
            },
            websocket: {
              clients: runtimeStatus.socketClients,
            },
            sampleIntervalMs: runtimeStatus.sampleIntervalMs,
            persistIntervalMs: runtimeStatus.persistIntervalMs,
            lastUpdated: runtimeStatus.lastUpdated,
            systemUptimeSeconds: metrics.system.uptimeSeconds,
            processUptimeSeconds: metrics.process.uptimeSeconds,
          },
        })
      } catch (error) {
        next(error)
      }
    },
  }
}