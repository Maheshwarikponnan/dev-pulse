const stateStyles = {
  live: 'border-emerald-400/30 bg-emerald-400/15 text-emerald-200',
  connecting: 'border-amber-400/30 bg-amber-400/15 text-amber-200',
  reconnecting: 'border-amber-400/30 bg-amber-400/15 text-amber-200',
}

function formatLastUpdated(lastUpdated) {
  if (!lastUpdated) {
    return 'Awaiting stream'
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(lastUpdated))
}

export default function Navbar({
  connectionState,
  autoRefresh,
  lastUpdated,
  onRefresh,
  onToggleAutoRefresh,
}) {
  const tone = stateStyles[connectionState] ?? stateStyles.connecting

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-lg font-semibold text-cyan-200">
              DP
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">
                DevPulse
              </p>
              <h1 className="text-2xl font-semibold text-slate-50">
                Realtime System Dashboard
              </h1>
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Monitor host performance, simulated API traffic, request latency, and
            alert thresholds from one developer-focused control room.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${tone}`}
          >
            {connectionState}
          </span>
          <span className="text-sm text-slate-400">
            Last update {formatLastUpdated(lastUpdated)}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-200"
          >
            Manual refresh
          </button>
          <button
            type="button"
            onClick={onToggleAutoRefresh}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              autoRefresh
                ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                : 'border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
            }`}
          >
            Auto-refresh {autoRefresh ? 'on' : 'off'}
          </button>
        </div>
      </div>
    </header>
  )
}