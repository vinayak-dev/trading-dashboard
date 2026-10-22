import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  Info,
  ArrowUp,
  Plus,
  Minus,
  Search,
  Hand,
  Home
} from 'lucide-react';
import { EquityCurvePoint, KPIMetrics } from '../types/trade';

interface ProfitLossSectionProps {
  metrics: KPIMetrics;
  equityPoints: EquityCurvePoint[];
}

export const ProfitLossSection: React.FC<ProfitLossSectionProps> = ({
  metrics,
  equityPoints,
}) => {
  const [timeframe, setTimeframe] = useState<'All' | 'Day' | '1 Hour' | '15 Min'>('All');
  const [breakevenThreshold, setBreakevenThreshold] = useState('0');

  // Format currency
  const formatDollar = (val: number) => {
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatK = (val: number) => {
    if (val === 0) return '0.0';
    if (Math.abs(val) >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    }
    return `${val.toFixed(1)}`;
  };

  return (
    <div className="space-y-4">
      {/* Main Big Card */}
      <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-6 shadow-xl">
        {/* Top Header & Timeframe Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Profit and loss</h2>
            <p className="text-xs text-slate-500 mt-0.5">Over time</p>
          </div>

          <div className="bg-[#191d26] p-1 rounded-xl flex items-center border border-[#232935] text-xs self-start sm:self-auto">
            {(['All', 'Day', '1 Hour', '15 Min'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-[#252c3b] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Top Summary Metrics Row */}
        <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-6 pb-6 border-b border-[#1f242e]">
          {/* Total Pnl */}
          <div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
              <span>Total Pnl</span>
              <Info className="w-3 h-3 text-slate-600" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white tracking-tight">
                {formatDollar(metrics.totalPnl)}
              </span>
              <span className="flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded-full">
                <ArrowUp className="w-3 h-3 mr-0.5" />
                {metrics.accountGainPct.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Account Balance */}
          <div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
              <span>Account Balance</span>
              <Info className="w-3 h-3 text-slate-600" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white tracking-tight">
                {formatDollar(metrics.accountBalance)}
              </span>
              <span className="flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded-full">
                <ArrowUp className="w-3 h-3 mr-0.5" />
                {metrics.accountGainPct.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Win Rate */}
          <div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
              <span>Win Rate</span>
              <Info className="w-3 h-3 text-slate-600" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              {metrics.winRate ?? 60}%
            </div>
          </div>

          {/* Total Trades with 6/4 superscript */}
          <div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
              <span>Total Trades</span>
              <Info className="w-3 h-3 text-slate-600" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight flex items-baseline gap-0.5">
              <span>{metrics.executedTrades}</span>
              <span className="text-xs text-slate-400 font-normal">
                <sup>{metrics.wins}/{metrics.losses}</sup>
              </span>
            </div>
          </div>

          {/* Breakeven Trades */}
          <div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
              <span>Breakeven Trades</span>
              <Info className="w-3 h-3 text-slate-600" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              {metrics.breakEvens}
            </div>
          </div>

          {/* Breakeven Threshold input & controls */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                <span>Breakeven Threshold</span>
                <Info className="w-3 h-3 text-slate-600" />
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={breakevenThreshold}
                  onChange={e => setBreakevenThreshold(e.target.value)}
                  className="w-14 bg-[#181b22] border border-[#262c38] rounded-lg px-2.5 py-1 text-xs text-white text-center focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  className="bg-[#1e232d] hover:bg-[#252c38] text-slate-300 text-xs px-3 py-1 rounded-lg border border-[#2a313f] transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>

            {/* Chart tool icons on right */}
            <div className="hidden lg:flex items-center gap-2 text-slate-500 pl-4 border-l border-[#1f242e] pt-4">
              <button className="hover:text-slate-200 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
              <button className="hover:text-slate-200 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
              <button className="hover:text-slate-200 transition-colors"><Search className="w-3.5 h-3.5" /></button>
              <button className="hover:text-slate-200 transition-colors"><Hand className="w-3.5 h-3.5" /></button>
              <button className="hover:text-slate-200 transition-colors"><Home className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>

        {/* Big Smooth P&L Chart */}
        <div className="h-[360px] w-full pt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityPoints} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="pnlSmoothGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0084ff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0084ff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1d222c" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#727b8c', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#1f242e' }}
              />
              <YAxis
                domain={[-1000, 1500]}
                tick={{ fill: '#727b8c', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#1f242e' }}
                tickFormatter={formatK}
              />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload as EquityCurvePoint;
                    return (
                      <div className="bg-[#101217] border border-[#232834] p-3 rounded-xl shadow-2xl text-xs font-mono">
                        <div className="text-slate-400 mb-1 border-b border-slate-800 pb-1 flex justify-between gap-4">
                          <span>{pt.date}</span>
                          <span className={pt.result === 'Win' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {pt.result}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Trade P&L:</span>
                            <span className={pt.individualPnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {pt.individualPnl >= 0 ? '+' : ''}${pt.individualPnl.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Cumulative:</span>
                            <span className="text-cyan-400 font-bold">
                              ${pt.cumulativePnl.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Account:</span>
                            <span className="text-white">
                              ${pt.accountBalance.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#3b4252" strokeWidth={1.5} />
              <Area
                type="monotone"
                dataKey="cumulativePnl"
                stroke="#0084ff"
                strokeWidth={2.5}
                fill="url(#pnlSmoothGradient)"
                dot={{ stroke: '#0084ff', strokeWidth: 2, r: 3, fill: '#ffffff' }}
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2, fill: '#0084ff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom 3 RR Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Average RR / Max RR */}
        <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-5 flex items-center justify-between shadow-md">
          <div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
              <span>Average RR</span>
              <Info className="w-3 h-3 text-slate-600" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics.averageRR}
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs text-slate-400 mb-1">
              <span>Max RR</span>
              <Info className="w-3 h-3 text-slate-600" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics.maxRR}
            </div>
          </div>
        </div>

        {/* Card 2: Ideal Average RR / Max Ideal RR */}
        <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-5 flex items-center justify-between shadow-md">
          <div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
              <span>Ideal Average RR</span>
              <Info className="w-3 h-3 text-slate-600" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics.idealAverageRR}
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs text-slate-400 mb-1">
              <span>Max Ideal RR</span>
              <Info className="w-3 h-3 text-slate-600" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics.maxIdealRR}
            </div>
          </div>
        </div>

        {/* Card 3: Could have profit/BE / Max Ideal RR */}
        <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-5 flex items-center justify-between shadow-md">
          <div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
              <span>Could have profit/BE</span>
              <Info className="w-3 h-3 text-slate-600" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics.couldHaveProfitBE}
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs text-slate-400 mb-1">
              <span>Max Ideal RR</span>
              <Info className="w-3 h-3 text-slate-600" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {metrics.maxIdealRR}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
