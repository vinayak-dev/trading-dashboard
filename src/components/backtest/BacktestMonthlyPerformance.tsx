import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { CalendarRange } from 'lucide-react';
import { TradeRecord } from '../../types/trade';

interface BacktestMonthlyPerformanceProps {
  trades: TradeRecord[];
  initialBalance?: number;
}

export const BacktestMonthlyPerformance: React.FC<BacktestMonthlyPerformanceProps> = ({
  trades,
  initialBalance = 50000,
}) => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Group by year-month (e.g., "2025-12")
  const monthlyMap = new Map<
    string,
    {
      key: string;
      label: string;
      profit: number;
      loss: number;
      netPnl: number;
      tradesCount: number;
      wins: number;
      losses: number;
    }
  >();

  trades.forEach((t) => {
    if (!t.date || !t.isExecutedTrade) return;
    const parts = t.date.split('-');
    if (parts.length < 2) return;
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const mName = monthNames[monthNum - 1] || 'Dec';
    const key = `${year}-${String(monthNum).padStart(2, '0')}`;
    const label = `${mName} ${year}`;

    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, {
        key,
        label,
        profit: 0,
        loss: 0,
        netPnl: 0,
        tradesCount: 0,
        wins: 0,
        losses: 0,
      });
    }

    const data = monthlyMap.get(key)!;
    const pnl = (t.dollarPnl ?? t.pnlDollar) ?? (t.realizedR !== null ? t.realizedR * 500 : 0);
    data.tradesCount++;
    data.netPnl += pnl;

    if (pnl > 0) {
      data.profit += pnl;
      data.wins++;
    } else if (pnl < 0) {
      data.loss += Math.abs(pnl);
      data.losses++;
    }
  });

  const sortedMonths = Array.from(monthlyMap.values()).sort((a, b) => a.key.localeCompare(b.key));

  const chartData = sortedMonths.map((m) => ({
    month: m.label,
    profit: Number(m.profit.toFixed(2)),
    loss: -Number(m.loss.toFixed(2)),
    netPnl: Number(m.netPnl.toFixed(2)),
    tradesCount: m.tradesCount,
    winRate: m.tradesCount > 0 ? Number(((m.wins / m.tradesCount) * 100).toFixed(1)) : 0,
  }));

  const formatK = (val: number) => {
    if (Math.abs(val) >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    }
    return `${val}`;
  };

  return (
    <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f242e] pb-3">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Performance by Month</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Monthly realized gains vs. losses and net returns
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Active Months: <strong className="text-white">{sortedMonths.length}</strong>
        </div>
      </div>

      {sortedMonths.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          No monthly performance data available
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Bilateral Bar Chart (Left 7 cols) */}
          <div className="lg:col-span-7 h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                stackOffset="sign"
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="backtestLossGrad" x1="1" y1="0" x2="0" y2="0">
                    <stop offset="0%" stopColor="#e55039" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#c0392b" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="backtestProfitGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00b894" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#00cec9" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#1d222c" />
                <XAxis
                  type="number"
                  tick={{ fill: '#727b8c', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#1f242e' }}
                  tickFormatter={formatK}
                />
                <YAxis
                  type="category"
                  dataKey="month"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={{ stroke: '#1f242e' }}
                />
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#101217] border border-[#232834] p-3 rounded-xl text-xs font-mono shadow-2xl space-y-1">
                          <span className="text-white font-bold block border-b border-[#232834] pb-1">
                            {d.month}
                          </span>
                          <span className="text-[#00c076] block">
                            Gross Profit: +${d.profit.toLocaleString()}
                          </span>
                          <span className="text-[#ff4d4f] block">
                            Gross Loss: -${Math.abs(d.loss).toLocaleString()}
                          </span>
                          <span className="text-white font-semibold block pt-1 border-t border-[#232834]">
                            Net P&amp;L:{' '}
                            <span className={d.netPnl >= 0 ? 'text-[#00c076]' : 'text-[#ff4d4f]'}>
                              {d.netPnl >= 0 ? '+$' : '-$'}
                              {Math.abs(d.netPnl).toLocaleString()}
                            </span>
                          </span>
                          <span className="text-slate-400 block text-[11px]">
                            {d.tradesCount} Trade(s) • {d.winRate}% Win Rate
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={0} stroke="#2e3644" />
                <Bar dataKey="loss" fill="url(#backtestLossGrad)" radius={[4, 0, 0, 4]} barSize={24} />
                <Bar dataKey="profit" fill="url(#backtestProfitGrad)" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Breakdown Cards (Right 5 cols) */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
            {sortedMonths.map((m) => {
              const pctReturn = (m.netPnl / initialBalance) * 100;
              const winRate = m.tradesCount > 0 ? ((m.wins / m.tradesCount) * 100).toFixed(0) : '0';

              return (
                <div
                  key={m.key}
                  className="bg-[#161a23] border border-[#232a39] hover:border-[#2f394d] rounded-xl p-3 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{m.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      {m.tradesCount} trade(s) • {winRate}% win rate ({m.wins}W / {m.losses}L)
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div
                      className={`font-bold text-sm ${
                        m.netPnl >= 0 ? 'text-[#00c076]' : 'text-[#ff4d4f]'
                      }`}
                    >
                      {m.netPnl >= 0 ? '+$' : '-$'}
                      {Math.abs(m.netPnl).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div
                      className={`text-[10px] font-semibold ${
                        pctReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {pctReturn >= 0 ? '+' : ''}
                      {pctReturn.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
