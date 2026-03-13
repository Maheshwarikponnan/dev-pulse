import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
} from 'react'

import {
  fetchCurrentMetrics,
  fetchMetricsHistory,
  fetchServerStatus,
} from '../services/api'
import { getMetricsSocket } from '../services/socket'
import MetricCard from './MetricCard.jsx'
import MetricsChart from './MetricsChart.jsx'
import Navbar from './Navbar.jsx'
import SystemStatus from './SystemStatus.jsx'

const historyOptions = [30, 60, 120]

function formatTimeLabel(timestamp) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp))
}

function formatUptime(seconds = 0) {
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

function buildChartData(history) {
  return history.map((entry) => ({
    time: formatTimeLabel(entry.capturedAt),
    cpuUsage: entry.system.cpuUsage,
    memoryUsage: entry.system.memoryUsage,
    requestLatencyMs: entry.application.requestLatencyMs,
    errorRate: entry.application.errorRate,
    requestRate: entry.application.requestRate,
  }))
}

export default function Dashboard() {
  const [currentMetrics, setCurrentMetrics] = useState(null)
  const [history, setHistory] = useState([])
  const [serverStatus, setServerStatus] = useState(null)
  const [historyLimit, setHistoryLimit] = useState(60)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [connectionState, setConnectionState] = useState('connecting')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const deferredHistory = useDeferredValue(history)
  const chartData = buildChartData(deferredHistory)

  const loadDashboard = useCallback(
    async ({ preserveLoading = false } = {}) => {
      try {
        if (!preserveLoading) {
          setLoading(true)
        }

        setErrorMessage('')

        const [metrics, metricsHistory, status] = await Promise.all([
          fetchCurrentMetrics(),
          fetchMetricsHistory(historyLimit),
          fetchServerStatus(),
        ])

        setCurrentMetrics(metrics)
        setServerStatus(status)
        startTransition(() => {
          setHistory(metricsHistory)
        })
      } catch (error) {
        setErrorMessage(
          error.response?.data?.error || 'Unable to load DevPulse telemetry.',
        )
      } finally {
        if (!preserveLoading) {
          setLoading(false)
        }
      }
    },
    [historyLimit],
  )

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    const socket = getMetricsSocket()

    const onConnect = () => setConnectionState('live')
    const onDisconnect = () => setConnectionState('reconnecting')
    const onSeed = (payload) => {
      setConnectionState('live')

      if (!autoRefresh) {
        return
      }

      if (payload.current) {
        setCurrentMetrics(payload.current)
      }

      if (payload.history?.length) {
        startTransition(() => {
          setHistory(payload.history.slice(-historyLimit))
        })
      }
    }
    const onUpdate = (snapshot) => {
      setConnectionState('live')

      if (!autoRefresh) {
        return
      }

      setCurrentMetrics(snapshot)
      setServerStatus((previousStatus) => {
        if (!previousStatus) {
          return previousStatus
        }

        return {
          ...previousStatus,
          status: snapshot.infrastructure.databaseConnected ? 'ok' : 'degraded',
          database: {
            connected: snapshot.infrastructure.databaseConnected,
            status: snapshot.infrastructure.databaseStatus,
          },
          websocket: {
            clients: snapshot.infrastructure.socketClients,
          },
          lastUpdated: snapshot.capturedAt,
          systemUptimeSeconds: snapshot.system.uptimeSeconds,
          processUptimeSeconds: snapshot.process.uptimeSeconds,
        }
      })

      startTransition(() => {
        setHistory((previousHistory) =>
          [...previousHistory, snapshot].slice(-historyLimit),
        )
      })
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('metrics:seed', onSeed)
    socket.on('metrics:update', onUpdate)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('metrics:seed', onSeed)
      socket.off('metrics:update', onUpdate)
    }
  }, [autoRefresh, historyLimit])

  const alerts = currentMetrics?.alerts ?? []

  return (
    <div className="min-h-screen bg-transparent text-slate-100">
      <Navbar
        autoRefresh={autoRefresh}
        connectionState={connectionState}
        lastUpdated={serverStatus?.lastUpdated || currentMetrics?.capturedAt}
        onRefresh={() => {
          void loadDashboard({ preserveLoading: true })
        }}
        onToggleAutoRefresh={() => {
          setAutoRefresh((currentValue) => !currentValue)
        }}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-[0_24px_60px_rgba(2,6,23,0.4)]">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
              Production observability starter
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Developer telemetry with live system insight.
            </h2>
            <p className="mt-4 max-w-2xl text-base text-slate-400">
              DevPulse combines REST APIs for historical data with Socket.io live
              updates so you can monitor CPU load, memory pressure, latency, and
              error behavior from a single dashboard.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                {currentMetrics?.host?.platform ?? 'Loading host platform'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                Node {currentMetrics?.host?.nodeVersion ?? '...'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                {currentMetrics?.host?.hostname ?? 'Loading host'}
              </span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-6 shadow-[0_24px_60px_rgba(2,6,23,0.4)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">History window</h2>
              <span className="text-xs uppercase tracking-[0.28em] text-slate-500">
                Historical chart view
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {historyOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setHistoryLimit(option)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    historyLimit === option
                      ? 'bg-violet-400 text-slate-950'
                      : 'border border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {option} samples
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-3 text-sm text-slate-400">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                API uptime {formatUptime(serverStatus?.processUptimeSeconds)}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Persist every {Math.round((serverStatus?.persistIntervalMs ?? 10_000) / 1000)} seconds
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Stream interval {Math.round((serverStatus?.sampleIntervalMs ?? 2_000) / 1000)} seconds
              </div>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200">
            {errorMessage}
          </div>
        ) : null}

        {alerts.length > 0 ? (
          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
            {alerts.map((alert) => alert.message).join(' | ')}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="CPU usage"
            value={currentMetrics?.system?.cpuUsage ?? '--'}
            unit="%"
            subtitle="Live host CPU utilization captured from the OS module."
            tone="cyan"
            emphasis={currentMetrics?.system?.cpuUsage > 80 ? 'Threshold exceeded' : 'Healthy range'}
          />
          <MetricCard
            title="Memory usage"
            value={currentMetrics?.system?.memoryUsage ?? '--'}
            unit="%"
            subtitle="System memory pressure using total and free host memory."
            tone="violet"
            emphasis={`${currentMetrics?.system?.freeMemoryMb ?? '--'} MB free`}
          />
          <MetricCard
            title="Uptime"
            value={formatUptime(currentMetrics?.system?.uptimeSeconds)}
            subtitle="System uptime since the host was last restarted."
            tone="amber"
            emphasis={`${currentMetrics?.process?.pid ?? '--'} pid`}
          />
          <MetricCard
            title="Request latency"
            value={currentMetrics?.application?.requestLatencyMs ?? '--'}
            unit="ms"
            subtitle="Smoothed response time that blends live traffic with synthetic load."
            tone="rose"
            emphasis={`${currentMetrics?.application?.requestRate ?? '--'} req/s`}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <MetricsChart
            data={chartData}
            dataKey="cpuUsage"
            description="Tracked every two seconds and streamed over websockets."
            formatter={(value) => `${value}%`}
            stroke="#22d3ee"
            title="CPU usage over time"
          />
          <MetricsChart
            data={chartData}
            dataKey="memoryUsage"
            description="Historical memory pressure from host telemetry snapshots."
            formatter={(value) => `${value}%`}
            stroke="#a78bfa"
            title="Memory usage over time"
          />
          <MetricsChart
            data={chartData}
            dataKey="requestLatencyMs"
            description="Latency trend built from real API timing and simulated load."
            formatter={(value) => `${value} ms`}
            stroke="#fb7185"
            title="Request latency"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <SystemStatus alerts={alerts} metrics={currentMetrics} status={serverStatus} />

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-[0_22px_50px_rgba(2,6,23,0.4)]">
            <h2 className="text-lg font-semibold text-white">Traffic simulation</h2>
            <p className="mt-1 text-sm text-slate-400">
              DevPulse supplements local request metrics with background traffic so
              the dashboard stays informative on a quiet machine.
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Request rate
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {currentMetrics?.application?.requestRate ?? '--'}
                  <span className="ml-2 text-sm font-normal text-slate-400">req/s</span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Error rate
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {currentMetrics?.application?.errorRate ?? '--'}
                  <span className="ml-2 text-sm font-normal text-slate-400">%</span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Process memory
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {currentMetrics?.process?.heapUsedMb ?? '--'}
                  <span className="ml-2 text-sm font-normal text-slate-400">MB heap</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 px-5 py-4 text-sm text-slate-300">
            Loading telemetry and historical metric snapshots...
          </div>
        ) : null}
      </main>
    </div>
  )
}