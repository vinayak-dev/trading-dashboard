import React, { useState } from 'react';
import {
  TrendingDown,
  LineChart,
  Activity,
  Info,
  HelpCircle,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { DrawdownAnalytics } from '../lib/calculations';

interface DrawdownSectionProps {
  analytics: DrawdownAnalytics;
  onNavigateTab?: (tab: string) => void;
}

export const DrawdownSection: React.FC<DrawdownSectionProps> = ({
  analytics,
  onNavigateTab,
}) => {
  const [metricUnit, setMetricUnit] = useState<'pct' | 'dollar'>('pct');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const {
    points,
    maxDrawdownPct,
    maxDrawdownDollar,
    avgDrawdownPct,
    timeToRecoveryDays,
    drawdownFrequency,
    maeDistribution,
    winningTradesDrawdown
  } = analytics;

  // Chart data formatted according to selected unit (% or $)
  const chartData = points.map((p) => ({
    ...p,
    val: metricUnit === 'pct' ? p.drawdownPct : p.drawdownDollar,
  }));

  // Y domain
  const minVal = chartData.length > 0 ? Math.min(...chartData.map((d) => d.val)) : -3;
  const yDomain = [
    metricUnit === 'pct'
      ? Math.min(-3, Math.floor(minVal * 1.2))
      : Math.min(-1500, Math.floor(minVal * 1.1)),
    0,
  ];

  return (
    <div className="space-y-6">
      {/* 1. Top Sub-Navigation Bar matching Image 1 */}
      <div className="flex justify-center">
        <div className="bg-[#101319] border border-[#1f242e] rounded-full p-1 inline-flex items-center gap-1 shadow-md">
          <button
            onClick={() => onNavigateTab && onNavigateTab('pnl')}
            className="flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-white hover:bg-[#191d26] transition-colors"
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Performance</span>
          </button>

          <button
            className="flex items-center gap-2 px-6 py-1.5 rounded-full text-xs font-semibold bg-[#191d26] text-white border border-[#2e374a] shadow-sm transition-all"
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>Drawdown</span>
          </button>

          <button
            className="flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors cursor-not-allowed opacity-75"
            title="Monte Carlo Simulation coming soon"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Simulation</span>
          </button>
        </div>
      </div>

      {/* 2. Main Drawdown on Equity Card matching Image 1 */}
      <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-6 shadow-xl space-y-4">
        {/* Title and Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Drawdown on Equity</h2>
            <div className="relative group">
              <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors cursor-help" />
              <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-[#161a23] border border-[#262f3f] text-slate-300 text-xs px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                Shows the drop in account equity from its highest historical peak
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* How this works link */}
            <button
              onClick={() => setShowHowItWorks(true)}
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How this works?</span>
            </button>

            {/* $ vs % Toggle Buttons */}
            <div className="bg-[#191d26] border border-[#2b313e] rounded-lg p-0.5 flex items-center">
              <button
                onClick={() => setMetricUnit('dollar')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                  metricUnit === 'dollar'
                    ? 'bg-[#252c3b] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                $
              </button>
              <button
                onClick={() => setMetricUnit('pct')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                  metricUnit === 'pct'
                    ? 'bg-[#252c3b] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                %
              </button>
            </div>
          </div>
        </div>

        {/* Main Chart */}
        <div className="h-[280px] sm:h-[320px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
            >
              <defs>
                <linearGradient id="drawdownRedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff5555" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#3d1419" stopOpacity={0.45} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#1f242e"
                strokeDasharray="4 4"
                vertical={false}
              />

              <ReferenceLine y={0} stroke="#481c22" strokeWidth={1} />

              <XAxis
                dataKey="formattedDate"
                tick={{ fill: '#737c8c', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Trade Date',
                  position: 'insideBottom',
                  offset: -12,
                  fill: '#94a3b8',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />

              <YAxis
                domain={yDomain}
                tick={{ fill: '#737c8c', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (metricUnit === 'pct' ? `${v}%` : `$${v}`)}
                label={{
                  value: metricUnit === 'pct' ? 'Drawdown (% of Peak)' : 'Drawdown ($)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 0,
                  fill: '#94a3b8',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />

              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as (typeof chartData)[0];
                    return (
                      <div className="bg-[#12151b] border border-[#232834] p-3 rounded-xl text-xs shadow-xl space-y-1 font-mono">
                        <div className="text-slate-400 font-sans text-[11px] pb-1 border-b border-[#232834]">
                          {d.formattedDate} • {d.tradeTitle}
                        </div>
                        <div className="flex justify-between gap-4 pt-1">
                          <span className="text-slate-400 font-sans">Drawdown:</span>
                          <span className="font-bold text-rose-400">
                            {d.drawdownPct}% ({d.drawdownDollar < 0 ? `-$${Math.abs(d.drawdownDollar).toLocaleString()}` : '$0.00'})
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400 font-sans">Current Equity:</span>
                          <span className="font-semibold text-slate-200">
                            ${d.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400 font-sans">Historical Peak:</span>
                          <span className="font-semibold text-slate-400">
                            ${d.peak.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Bar
                dataKey="val"
                fill="url(#drawdownRedGrad)"
                barSize={42}
                radius={[0, 0, 6, 6]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Top Row 4 KPI Cards matching Image 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Max Drawdown */}
        <div className="bg-[#12141a] border border-[#1f242e] border-l-4 border-l-[#ff5533] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Max Drawdown</span>
            <Info className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-white">
            {metricUnit === 'pct'
              ? `${maxDrawdownPct.toFixed(1)}%`
              : `-$${Math.abs(maxDrawdownDollar).toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          </div>
        </div>

        {/* Card 2: AVG Drawdown on equity */}
        <div className="bg-[#12141a] border border-[#1f242e] border-l-4 border-l-[#ff5533] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">AVG Drawdown on equity</span>
            <Info className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-white">
            {avgDrawdownPct.toFixed(2)}%
          </div>
        </div>

        {/* Card 3: Time to recovery (days) */}
        <div className="bg-[#12141a] border border-[#1f242e] border-l-4 border-l-[#ff5533] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Time to recovery (days)</span>
            <Info className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-white">
            {timeToRecoveryDays}
          </div>
        </div>

        {/* Card 4: Drawdown frequency */}
        <div className="bg-[#12141a] border border-[#1f242e] border-l-4 border-l-[#ff5533] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-medium">Drawdown frequency</span>
            <Info className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-white">
            {drawdownFrequency.toFixed(1)}
          </div>
        </div>
      </div>

      {/* 4. Maximum Adverse Excursion Section matching Image 2 */}
      <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Maximum Adverse Excursion
          </h3>
          <Info className="w-4 h-4 text-slate-500 cursor-help" />
        </div>

        <div className="h-[220px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={maeDistribution}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="maeRedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff5555" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3d1419" stopOpacity={0.4} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#1f242e"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="bin"
                tick={{ fill: '#737c8c', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'MAE (in R)',
                  position: 'insideBottom',
                  offset: -12,
                  fill: '#94a3b8',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />

              <YAxis
                domain={[0, 11]}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}
                tick={{ fill: '#737c8c', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Frequency',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 25,
                  fill: '#94a3b8',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />

              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#12151b] border border-[#232834] px-3 py-1.5 rounded-lg text-xs shadow-lg font-mono">
                        <span className="text-slate-400 block font-sans">MAE: {d.bin}R</span>
                        <span className="text-white font-bold">{d.count} Trades</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Bar
                dataKey="count"
                fill="url(#maeRedGrad)"
                barSize={32}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Drawdown on Winning Trades Section matching Image 2 */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white tracking-tight">
          Drawdown on Winning Trades
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: AVG Drawdown RR */}
          <div className="bg-[#12141a] border border-[#1f242e] border-l-4 border-l-[#ff5533] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">AVG Drawdown RR</span>
              <Info className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <div className="mt-3 text-2xl font-bold font-mono text-white">
              {winningTradesDrawdown.avgRR.toFixed(2)}
            </div>
          </div>

          {/* Card 2: Min Drawdown RR */}
          <div className="bg-[#12141a] border border-[#1f242e] border-l-4 border-l-[#ff5533] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">Min Drawdown RR</span>
              <Info className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <div className="mt-3 text-2xl font-bold font-mono text-white">
              {winningTradesDrawdown.minRR}
            </div>
          </div>

          {/* Card 3: Max Drawdown RR */}
          <div className="bg-[#12141a] border border-[#1f242e] border-l-4 border-l-[#ff5533] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">Max Drawdown RR</span>
              <Info className="w-3.5 h-3.5 text-slate-600" />
            </div>
            <div className="mt-3 text-2xl font-bold font-mono text-white">
              {winningTradesDrawdown.maxRR}
            </div>
          </div>
        </div>
      </div>

      {/* How it works modal */}
      {showHowItWorks && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowHowItWorks(false)}
        >
          <div
            className="bg-[#12141a] border border-[#1f242e] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1f242e]">
              <h3 className="text-base font-bold text-white">How Drawdown is Calculated</h3>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#191d26]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <p>
                <strong>Drawdown on Equity:</strong> The peak-to-trough decline in account balance during a specific period. It is measured as a percentage of the highest historical account peak:
              </p>
              <div className="p-2.5 rounded bg-[#191d26] font-mono text-cyan-300 text-[11px]">
                Drawdown % = ((Current Equity - Peak Equity) / Peak Equity) * 100
              </div>
              <p>
                <strong>Time to Recovery:</strong> The average number of days required for the equity curve to recover from a trough back to its previous peak high.
              </p>
              <p>
                <strong>Drawdown Frequency:</strong> The count of separate, distinct peak-to-trough decline episodes experienced in the trading period.
              </p>
              <p>
                <strong>Maximum Adverse Excursion (MAE):</strong> The greatest intraday loss or negative price move experienced by a position before closing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
