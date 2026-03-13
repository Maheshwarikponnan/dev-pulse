import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) {
    return null
  }

  const point = payload[0]

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 shadow-xl">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">
        {formatter ? formatter(point.value) : point.value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{point.name}</p>
    </div>
  )
}

export default function MetricsChart({
  data,
  dataKey,
  description,
  formatter,
  stroke,
  title,
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-[0_22px_50px_rgba(2,6,23,0.4)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              tickLine={false}
              axisLine={false}
              minTickGap={24}
            />
            <YAxis
              stroke="#64748b"
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={formatter}
            />
            <Tooltip content={<ChartTooltip formatter={formatter} />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              name={title}
              stroke={stroke}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}