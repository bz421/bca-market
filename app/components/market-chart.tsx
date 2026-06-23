'use client'

import { useState, useEffect } from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts';


const COLORS = ['#38bdf8', '#6366f1', '#eab308', '#f97316', '#a855f7', '#22c55e'];
type Props = {
  data: { timestamp: number; [key: string]: number }[];
  outcomeNames: string[];
};
export default function MarketChart({ data, outcomeNames }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const latest = data[data.length - 1];

  if (!mounted) {
    return <div className="h-[320px] rounded-2xl bg-zinc-50/70 animate-pulse" />;
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        {outcomeNames.map((name, i) => (
          <span key={name} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <p className="text-black">{name}{' '}</p>
            <span className="font-semibold tabular-nums text-slate-500">
              {latest?.[name]?.toFixed(0)}%
            </span>
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 8, right: 48, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7b6" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(ts) =>
              new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }
          />
          <YAxis
            orientation="right"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip labelStyle={{ color: "black", borderRadius: 8 }}
            labelFormatter={(ts) =>
              new Date(ts).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              })
            }
            formatter={(value, name) => {
              const num = typeof value === 'number' ? value : Number(value);
              return [`${Number.isFinite(num) ? num.toFixed(1) : '0.0'}%`, String(name)];
            }}
          />
          {outcomeNames.map((name, i) => (
            <Line
              key={name}
              type="linear"
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}