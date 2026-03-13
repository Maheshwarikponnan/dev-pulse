import os from 'node:os'
import process from 'node:process'

const SERVER_NAMES = ['node-alpha', 'node-beta', 'node-gamma']

function round(value, digits = 2) {
  return Number(value.toFixed(digits))
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function average(values) {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function smooth(previousValue, nextValue, retainedWeight = 0.55) {
  return previousValue * retainedWeight + nextValue * (1 - retainedWeight)
}

function toMegabytes(bytes) {
  return round(bytes / 1024 / 1024)
}

function takeCpuSnapshot() {
  return os.cpus().reduce(
    (totals, cpuCore) => {
      const totalTime = Object.values(cpuCore.times).reduce(
        (sum, time) => sum + time,
        0,
      )

      return {
        idle: totals.idle + cpuCore.times.idle,
        total: totals.total + totalTime,
      }
    },
    { idle: 0, total: 0 },
  )
}

function calculateCpuUsage(previousSnapshot, currentSnapshot) {
  const idleDelta = currentSnapshot.idle - previousSnapshot.idle
  const totalDelta = currentSnapshot.total - previousSnapshot.total

  if (totalDelta <= 0) {
    return 0
  }

  return clamp(100 - (idleDelta / totalDelta) * 100, 0, 100)
}

function buildAlerts({ cpuUsage, memoryUsage }) {
  const alerts = []

  if (cpuUsage > 80) {
    alerts.push({
      type: 'cpu',
      severity: 'warning',
      message: `CPU usage is elevated at ${cpuUsage}%`,
    })
  }

  if (memoryUsage > 85) {
    alerts.push({
      type: 'memory',
      severity: 'critical',
      message: `Memory usage is above threshold at ${memoryUsage}%`,
    })
  }

  return alerts
}

function buildServerNodes({
  cpuUsage,
  memoryUsage,
  requestLatencyMs,
  requestRate,
  errorRate,
}) {
  return SERVER_NAMES.map((name, index) => {
    const multiplier = 1 + index * 0.08
    const variance = (Math.random() * 10) - 5
    const nodeCpu = round(clamp(cpuUsage * multiplier + variance, 4, 99))
    const nodeMemory = round(
      clamp(memoryUsage * multiplier + variance / 2, 8, 98),
    )
    const nodeLatency = round(
      clamp(requestLatencyMs * multiplier + variance * 2, 40, 950),
    )
    const nodeErrorRate = round(clamp(errorRate + index * 0.7, 0, 100))

    return {
      name,
      cpuUsage: nodeCpu,
      memoryUsage: nodeMemory,
      requestLatencyMs: nodeLatency,
      requestRate: round(requestRate * multiplier),
      errorRate: nodeErrorRate,
      status:
        nodeCpu > 85 || nodeMemory > 85 || nodeErrorRate > 8
          ? 'warning'
          : 'healthy',
    }
  })
}

// The generator mixes real host metrics with smoothed simulated request load so
// the dashboard remains lively even when the local API is mostly idle.
export function createMetricGenerator() {
  let previousCpuSnapshot = takeCpuSnapshot()
  let previousLatency = 120
  let previousRequestRate = 6
  let previousErrorRate = 1.5

  return {
    generate({
      requestEvents,
      totalRequests,
      totalErrors,
      databaseConnected,
      databaseStatus,
      socketClients,
    }) {
      const currentCpuSnapshot = takeCpuSnapshot()
      const cpuUsage = round(
        calculateCpuUsage(previousCpuSnapshot, currentCpuSnapshot),
      )

      previousCpuSnapshot = currentCpuSnapshot

      const totalMemory = os.totalmem()
      const freeMemory = os.freemem()
      const usedMemory = totalMemory - freeMemory
      const processMemory = process.memoryUsage()
      const now = Date.now()
      const recentEvents = requestEvents.filter(
        (event) => now - event.timestamp <= 15_000,
      )

      const syntheticLoadFloor = 3 + cpuUsage / 25 + Math.random() * 4
      const observedRequestRate = recentEvents.length / 15
      const requestRate = round(
        smooth(previousRequestRate, Math.max(observedRequestRate, syntheticLoadFloor)),
      )

      const observedLatency = recentEvents.length
        ? average(recentEvents.map((event) => event.durationMs))
        : previousLatency

      const requestLatencyMs = round(
        smooth(
          previousLatency,
          clamp(observedLatency + cpuUsage * 1.1 + (Math.random() * 24 - 12), 35, 900),
        ),
      )

      const observedErrorRate = recentEvents.length
        ? (recentEvents.filter((event) => event.isError).length / recentEvents.length) * 100
        : previousErrorRate

      const errorRate = round(
        smooth(previousErrorRate, clamp(observedErrorRate + Math.random() * 1.6, 0, 100)),
      )

      previousLatency = requestLatencyMs
      previousRequestRate = requestRate
      previousErrorRate = errorRate

      const memoryUsage = round((usedMemory / totalMemory) * 100)
      const alerts = buildAlerts({ cpuUsage, memoryUsage })

      return {
        capturedAt: new Date().toISOString(),
        host: {
          hostname: os.hostname(),
          platform: `${os.type()} ${os.release()}`,
          nodeVersion: process.version,
        },
        system: {
          cpuUsage,
          memoryUsage,
          uptimeSeconds: Math.round(os.uptime()),
          totalMemoryMb: toMegabytes(totalMemory),
          freeMemoryMb: toMegabytes(freeMemory),
          cpuCount: os.cpus().length,
          loadAverage: os.loadavg().map((value) => round(value)),
        },
        process: {
          pid: process.pid,
          uptimeSeconds: Math.round(process.uptime()),
          rssMb: toMegabytes(processMemory.rss),
          heapUsedMb: toMegabytes(processMemory.heapUsed),
          heapTotalMb: toMegabytes(processMemory.heapTotal),
          externalMb: toMegabytes(processMemory.external),
        },
        application: {
          requestLatencyMs,
          requestRate,
          errorRate,
          totalRequests,
          totalErrors,
        },
        infrastructure: {
          databaseConnected,
          databaseStatus,
          socketClients,
        },
        nodes: buildServerNodes({
          cpuUsage,
          memoryUsage,
          requestLatencyMs,
          requestRate,
          errorRate,
        }),
        alerts,
      }
    },
  }
}

export function formatUptime(seconds) {
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)

  return [
    days > 0 ? `${days}d` : null,
    `${hours}h`,
    `${minutes}m`,
  ]
    .filter(Boolean)
    .join(' ')
}