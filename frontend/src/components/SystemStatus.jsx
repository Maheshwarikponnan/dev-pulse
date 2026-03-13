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

function StatusChip({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-700 bg-slate-800/80 text-slate-200',
    emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    amber: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
    rose: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
  }

  return (
    <div className={`rounded-2xl border px-4 py-3 ${tones[tone] ?? tones.slate}`}>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-medium text-white">{value}</p>
    </div>
  )
}

export default function SystemStatus({ alerts, metrics, status }) {
  const databaseTone = status?.database?.connected ? 'emerald' : 'amber'
  const healthTone = status?.status === 'ok' ? 'emerald' : 'amber'

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-[0_22px_50px_rgba(2,6,23,0.4)]">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-white">System status</h2>
          <p className="mt-1 text-sm text-slate-400">
            API health, infrastructure state, and alert thresholds for the live
            telemetry stream.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusChip label="API status" value={status?.status ?? 'loading'} tone={healthTone} />
          <StatusChip
            label="MongoDB"
            value={status?.database?.status ?? 'disconnected'}
            tone={databaseTone}
          />
          <StatusChip
            label="Socket clients"
            value={String(status?.websocket?.clients ?? 0)}
            tone="slate"
          />
          <StatusChip
            label="Host uptime"
            value={formatUptime(status?.systemUptimeSeconds)}
            tone="slate"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                Alert center
              </h3>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                {alerts.length} active
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div
                    key={alert.type}
                    className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-rose-200">{alert.message}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-rose-100/70">
                      {alert.severity}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                  No active system alerts. CPU and memory usage are within the
                  configured thresholds.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                Cluster simulation
              </h3>
              <span className="text-xs text-slate-500">Bonus feature</span>
            </div>

            <div className="mt-4 space-y-3">
              {metrics?.nodes?.map((node) => (
                <div
                  key={node.name}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{node.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                        {node.status}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p>{node.requestLatencyMs} ms latency</p>
                      <p>{node.requestRate} req/s</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300">
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      CPU {node.cpuUsage}%
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      Memory {node.memoryUsage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}