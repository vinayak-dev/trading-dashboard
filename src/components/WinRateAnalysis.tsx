import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { PieChart, Info, BarChart2 } from 'lucide-react';
import { TradeRecord, KPIMetrics } from '../types/trade';
import { calculateWinRate } from '../lib/calculations';

interface WinRateAnalysisProps {
  trades: TradeRecord[];
  metrics: KPIMetrics;
}

export const WinRateAnalysis: React.FC<WinRateAnalysisProps> = ({
  trades,
  metrics,
}) => {
  const executedTrades = trades.filter(t => t.isExecutedTrade);

  // Group by RR ranges
  const rrBuckets = [
    { label: '< 1.5R', min: 0, max: 1.49, wins: 0, losses: 0, be: 0, count: 0 },
    { label: '1.5R - 2.0R', min: 1.5, max: 2.0, wins: 0, losses: 0, be: 0, count: 0 },
    { label: '2.1R - 2.5R', min: 2.1, max: 2.5, wins: 0, losses: 0, be: 0, count: 0 },
    { label: '> 2.5R', min: 2.51, max: 999, wins: 0, losses: 0, be: 0, count: 0 },
  ];

  let unbucketedCount = 0;

  for (const t of executedTrades) {
    const rr = t.plannedRR !== null ? t.plannedRR : t.rawRR !== null ? Math.abs(t.rawRR) : null;
    if (rr === null) {
      unbucketedCount++;
      continue;
    }

    const bucket = rrBuckets.find(b => rr >= b.min && rr <= b.max);
    if (bucket) {
      bucket.count++;
      if (t.result === 'Win') bucket.wins++;
      else if (t.result === 'Loss') bucket.losses++;
      else if (t.result === 'Break Even') bucket.be++;
    }
  }

  const chartData = rrBuckets.map(b => ({
    name: b.label,
    count: b.count,
    winRate: calculateWinRate(b.wins, b.losses) ?? 0,
    wins: b.wins,
    losses: b.losses,
    be: b.be,
  }));

  // Outcome proportions
  const totalDecided = metrics.wins + metrics.losses + metrics.breakEvens;
  const winPct = totalDecided > 0 ? ((metrics.wins / totalDecided) * 100).toFixed(1) : '0';
  const lossPct = totalDecided > 0 ? ((metrics.losses / totalDecided) * 100).toFixed(1) : '0';
  const bePct = totalDecided > 0 ? ((metrics.breakEvens / totalDecided) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Outcome Distribution Breakdown */}
      <div className="bg-[#111726] border border-[#1e2a42] rounded-xl p-5 flex flex-col justify-between shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PieChart className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">Trade Outcome Distribution</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Breakdown across {totalDecided} executed setups
          </p>

          {/* Stacked Progress Bar */}
          <div className="h-3.5 w-full bg-[#1b253b] rounded-full overflow-hidden flex mb-4">
            <div
              style={{ width: `${winPct}%` }}
              className="bg-emerald-500 h-full transition-all"
              title={`Wins: ${metrics.wins} (${winPct}%)`}
            />
            <div
              style={{ width: `${bePct}%` }}
              className="bg-amber-500 h-full transition-all"
              title={`Break Even: ${metrics.breakEvens} (${bePct}%)`}
            />
            <div
              style={{ width: `${lossPct}%` }}
              className="bg-rose-500 h-full transition-all"
              title={`Losses: ${metrics.losses} (${lossPct}%)`}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">Wins</span>
              <span className="text-base font-bold font-mono text-emerald-300">{metrics.wins}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{winPct}%</span>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40">
              <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">Break Even</span>
              <span className="text-base font-bold font-mono text-amber-300">{metrics.breakEvens}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{bePct}%</span>
            </div>

            <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40">
              <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">Losses</span>
              <span className="text-base font-bold font-mono text-rose-300">{metrics.losses}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{lossPct}%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#1a2338] text-[11px] text-slate-400 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            Win Rate: <strong className="text-slate-200">{metrics.winRate !== null ? `${metrics.winRate}%` : 'N/A'}</strong> (wins divided strictly by decisive outcomes: W / (W + L)).
          </span>
        </div>
      </div>

      {/* 2. Win Rate by Planned RR Grouping */}
      <div className="bg-[#111726] border border-[#1e2a42] rounded-xl p-5 lg:col-span-2 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">Win Rate by Planned RR Target</h3>
            </div>
            {unbucketedCount > 0 && (
              <span className="text-[11px] font-mono text-slate-500">
                {unbucketedCount} trades missing RR
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Win rate % and sample counts across target reward-to-risk tiers
          </p>

          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#0b101c] border border-[#23324e] p-2.5 rounded-lg text-xs shadow-xl font-mono">
                          <p className="font-sans font-semibold text-cyan-300 mb-1">{d.name}</p>
                          <p className="text-slate-200">Win Rate: <strong className="text-emerald-400">{d.winRate}%</strong></p>
                          <p className="text-slate-400">Total Trades: {d.count}</p>
                          <p className="text-slate-400">Breakdown: {d.wins}W - {d.losses}L - {d.be}BE</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count === 0 ? '#1e293b' : entry.winRate >= 50 ? '#10b981' : '#f59e0b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-[#1a2338] text-[11px] text-slate-500">
          <strong className="text-slate-400">Methodology distinction:</strong> Planned RR measures initial risk-to-reward objective, while Realized R measures the actual final return on investment.
        </div>
      </div>
    </div>
  );
};
