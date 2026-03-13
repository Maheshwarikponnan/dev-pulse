// Socket handlers are isolated from HTTP routes so the real-time contract can
// evolve independently from the REST API.
export function registerMetricsSocket(io, metricsService) {
  io.on('connection', async (socket) => {
    metricsService.setSocketClients(io.engine.clientsCount)

    socket.emit('metrics:connected', {
      connectedAt: new Date().toISOString(),
      message: 'Connected to the DevPulse live stream.',
    })

    socket.emit('metrics:seed', {
      current: await metricsService.getCurrentMetrics(),
      history: metricsService.getCachedHistory(30),
    })

    socket.on('metrics:refresh', async () => {
      const snapshot = await metricsService.getCurrentMetrics()
      socket.emit('metrics:update', snapshot)
    })

    socket.on('disconnect', () => {
      metricsService.setSocketClients(io.engine.clientsCount)
    })
  })
}