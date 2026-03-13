import MetricSnapshot from '../models/MetricSnapshot.js'
import { createMetricGenerator } from '../utils/metricGenerator.js'

export class MetricsService {
  constructor({
    sampleIntervalMs = 2_000,
    persistIntervalMs = 10_000,
    maxHistoryItems = 180,
  } = {}) {
    this.sampleIntervalMs = sampleIntervalMs
    this.persistIntervalMs = persistIntervalMs
    this.maxHistoryItems = maxHistoryItems
    this.metricGenerator = createMetricGenerator()
    this.requestEvents = []
    this.totalRequests = 0
    this.totalErrors = 0
    this.latestSnapshot = null
    this.historyCache = []
    this.databaseConnected = false
    this.databaseStatus = 'disconnected'
    this.socketClients = 0
    this.io = null
    this.sampleTimer = null
    this.persistTimer = null
  }

  setRealtimeServer(io) {
    this.io = io
  }

  setDatabaseState(isConnected, status = 'disconnected') {
    this.databaseConnected = isConnected
    this.databaseStatus = status
  }

  setSocketClients(clientCount) {
    this.socketClients = clientCount

    if (this.latestSnapshot) {
      this.latestSnapshot = {
        ...this.latestSnapshot,
        infrastructure: {
          ...this.latestSnapshot.infrastructure,
          socketClients: clientCount,
        },
      }
    }
  }

  // Every API response is tracked so the simulated application metrics remain
  // anchored to real request behavior.
  recordRequest({ durationMs, statusCode }) {
    const event = {
      timestamp: Date.now(),
      durationMs,
      isError: statusCode >= 500,
    }

    this.requestEvents.push(event)
    this.totalRequests += 1

    if (event.isError) {
      this.totalErrors += 1
    }

    this.pruneRequestEvents()
  }

  async start() {
    if (this.sampleTimer) {
      return
    }

    await this.captureSnapshot()

    this.sampleTimer = setInterval(() => {
      void this.captureSnapshot()
    }, this.sampleIntervalMs)

    this.persistTimer = setInterval(() => {
      void this.persistLatestSnapshot()
    }, this.persistIntervalMs)
  }

  async stop() {
    if (this.sampleTimer) {
      clearInterval(this.sampleTimer)
      this.sampleTimer = null
    }

    if (this.persistTimer) {
      clearInterval(this.persistTimer)
      this.persistTimer = null
    }
  }

  async captureSnapshot() {
    this.pruneRequestEvents()

    const snapshot = this.metricGenerator.generate({
      requestEvents: this.requestEvents,
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      databaseConnected: this.databaseConnected,
      databaseStatus: this.databaseStatus,
      socketClients: this.socketClients,
    })

    this.latestSnapshot = snapshot
    this.historyCache = [...this.historyCache, snapshot].slice(-this.maxHistoryItems)

    if (this.io) {
      this.io.emit('metrics:update', snapshot)
    }

    return snapshot
  }

  async persistLatestSnapshot() {
    if (!this.databaseConnected || !this.latestSnapshot) {
      return null
    }

    try {
      return await MetricSnapshot.create(this.latestSnapshot)
    } catch (error) {
      console.error(`[metrics] Failed to persist snapshot: ${error.message}`)
      return null
    }
  }

  async getCurrentMetrics() {
    if (!this.latestSnapshot) {
      await this.captureSnapshot()
    }

    return this.latestSnapshot
  }

  async getHistory(limit = 60) {
    const safeLimit = Number.isFinite(limit)
      ? Math.max(1, Math.min(limit, 240))
      : 60

    if (this.databaseConnected) {
      try {
        const documents = await MetricSnapshot.find()
          .sort({ capturedAt: -1 })
          .limit(safeLimit)
          .lean()

        if (documents.length > 0) {
          return documents.reverse()
        }
      } catch (error) {
        console.error(`[metrics] Failed to load history: ${error.message}`)
      }
    }

    return this.historyCache.slice(-safeLimit)
  }

  getCachedHistory(limit = 30) {
    return this.historyCache.slice(-limit)
  }

  getRuntimeStatus() {
    return {
      status: this.databaseConnected ? 'ok' : 'degraded',
      databaseConnected: this.databaseConnected,
      databaseStatus: this.databaseStatus,
      socketClients: this.socketClients,
      sampleIntervalMs: this.sampleIntervalMs,
      persistIntervalMs: this.persistIntervalMs,
      lastUpdated: this.latestSnapshot?.capturedAt ?? null,
    }
  }

  pruneRequestEvents() {
    const horizon = Date.now() - 60_000
    this.requestEvents = this.requestEvents.filter(
      (event) => event.timestamp >= horizon,
    )
  }
}