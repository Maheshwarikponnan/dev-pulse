const toneStyles = {
  cyan: 'from-cyan-400/15 to-slate-900 border-cyan-400/20',
  violet: 'from-violet-400/15 to-slate-900 border-violet-400/20',
  amber: 'from-amber-400/15 to-slate-900 border-amber-400/20',
  rose: 'from-rose-400/15 to-slate-900 border-rose-400/20',
}

export default function MetricCard({
  title,
  value,
  unit,
  subtitle,
  tone = 'cyan',
  emphasis,
}) {
  const cardTone = toneStyles[tone] ?? toneStyles.cyan

  return (
    <article
      className={`rounded-3xl border bg-gradient-to-br ${cardTone} p-5 shadow-[0_18px_40px_rgba(2,6,23,0.32)]`}
    >
      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{title}</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-semibold tracking-tight text-white">
          {value}
        </span>
        {unit ? <span className="pb-1 text-sm text-slate-400">{unit}</span> : null}
      </div>
      <p className="mt-3 text-sm text-slate-400">{subtitle}</p>
      {emphasis ? (
        <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
          {emphasis}
        </div>
      ) : null}
    </article>
  )
}