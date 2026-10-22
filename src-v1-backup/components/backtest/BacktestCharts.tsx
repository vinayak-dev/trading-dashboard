import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  BacktestAnalytics
} from '../../types/backtest';
import { Activity, BarChart3, Layers } from 'lucide-react';

interface BacktestChartsProps {
  analytics: BacktestAnalytics;
}

export const BacktestCharts: React.FC<BacktestChartsProps> = ({ analytics }) => {
  const [activeBreakdownTab, setActiveBreakdownTab] = useState<'weekday' | 'session' | 'instrument' | 'strategy'>('weekday');

  const { equityCurve, pnlDistribution, byWeekday, bySession, byInstrument, byStrategy } = analytics;

  // Selected breakdown data
  const breakdownData =
    activeBreakdownTab === 'weekday'
      ? byWeekday
      : activeBreakdownTab === 'session'
      ? bySession
      : activeBreakdownTab === 'instrument'
      ? byInstrument
      : byStrategy;

  return (
    <div className="space-y-6">
      {/* 1. Cumulative Equity Curve */}
      <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f242e] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Backtest Cumulative Equity Curve
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>
              Net Gain:{' '}
              <strong
                className={
                  analytics.kpis.totalNetPnl >= 0 ? 'text-[#00c076]' : 'text-[#ff4d4f]'
                }
              >
                {analytics.kpis.totalNetPnl >= 0 ? '+$' : '-$'}
                {Math.abs(analytics.kpis.totalNetPnl).toLocaleString('en-US', {
                  minimumFractionDigits: 2
                })}
              </strong>
            </span>
            <span>
              Max Drawdown:{' '}
              <strong className="text-rose-400">
                -${analytics.kpis.maxDrawdownDollar.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </strong>
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          {equityCurve.length <= 1 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Not enough trade executions to render equity curve
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="backtestEquityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f242e" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#525f7a"
                  fontSize={10}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#525f7a"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip cursor={{ stroke: '#2e3644', strokeWidth: 1 }} content={<CustomEquityTooltip />} />
                <ReferenceLine y={0} stroke="#2b313e" strokeWidth={1} />
                <Area
                  type="monotone"
                  dataKey="cumulativeNetPnl"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#backtestEquityGrad)"
                  name="Cumulative Net P&L"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Middle Row: P&L Distribution & Category Breakdown Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Distribution */}
        <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1f242e] pb-3">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              P&amp;L Distribution Histogram
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f242e" vertical={false} />
                <XAxis
                  dataKey="range"
                  stroke="#525f7a"
                  fontSize={9}
                  tickLine={false}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#525f7a" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={false}
                  formatter={(val: any) => [`${val} Trade(s)`, 'Frequency']}
                  contentStyle={{
                    backgroundColor: '#161922',
                    borderColor: '#2b313e',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {pnlDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isProfit ? '#00c076' : '#ff4d4f'}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categorical Performance Breakdown */}
        <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f242e] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Performance Breakdown
              </h3>
            </div>

            {/* Breakdown Switcher */}
            <div className="flex items-center bg-[#171a24] border border-[#262c3a] rounded-lg p-0.5 text-xs">
              {[
                { id: 'weekday', label: 'Day' },
                { id: 'session', label: 'Session' },
                { id: 'instrument', label: 'Symbol' },
                { id: 'strategy', label: 'Setup' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveBreakdownTab(tab.id as any)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeBreakdownTab === tab.id
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            {breakdownData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No categorical trade breakdown available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f242e" vertical={false} />
                  <XAxis dataKey="name" stroke="#525f7a" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#525f7a"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip cursor={false} content={<CustomCategoryTooltip />} />
                  <ReferenceLine y={0} stroke="#2b313e" />
                  <Bar dataKey="totalPnl" radius={[4, 4, 0, 0]}>
                    {breakdownData.map((entry, index) => (
                      <Cell
                        key={`cat-${index}`}
                        fill={entry.totalPnl >= 0 ? '#00c076' : '#ff4d4f'}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomEquityTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#161a22] border border-[#2b313e] p-3 rounded-xl shadow-xl text-xs space-y-1">
        <div className="text-slate-400 font-mono">{label}</div>
        <div className="text-sm font-bold text-white font-mono">
          Cumulative:{' '}
          <span className={data.cumulativeNetPnl >= 0 ? 'text-[#00c076]' : 'text-[#ff4d4f]'}>
            {data.cumulativeNetPnl >= 0 ? '+$' : '-$'}
            {Math.abs(data.cumulativeNetPnl).toFixed(2)}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Trade P&amp;L:{' '}
          <span className={data.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {data.netPnl >= 0 ? '+$' : '-$'}
            {Math.abs(data.netPnl).toFixed(2)}
          </span>
        </div>
        {data.drawdownDollar > 0 && (
          <div className="text-[11px] text-rose-400 font-mono">
            Drawdown: -${data.drawdownDollar.toFixed(2)} (-{data.drawdownPct.toFixed(1)}%)
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CustomCategoryTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#161a22] border border-[#2b313e] p-3 rounded-xl shadow-xl text-xs space-y-1">
        <div className="font-bold text-white">{label}</div>
        <div className="font-mono text-sm">
          Net P&amp;L:{' '}
          <span className={data.totalPnl >= 0 ? 'text-[#00c076]' : 'text-[#ff4d4f]'}>
            {data.totalPnl >= 0 ? '+$' : '-$'}
            {Math.abs(data.totalPnl).toFixed(2)}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Trades: {data.tradesCount} ({data.wins}W / {data.losses}L) • Win Rate: {data.winRate}%
        </div>
        {data.profitFactor !== null && (
          <div className="text-[11px] text-slate-400 font-mono">
            Profit Factor: {data.profitFactor.toFixed(2)}
          </div>
        )}
      </div>
    );
  }
  return null;
};
