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
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { EquityCurvePoint } from '../types/trade';

interface EquityCurveChartProps {
  data: EquityCurvePoint[];
  hasRealizedRData: boolean;
}

export const EquityCurveChart: React.FC<EquityCurveChartProps> = ({
  data,
  hasRealizedRData,
}) => {
  const [viewMode, setViewMode] = useState<'equity' | 'drawdown'>('equity');

  if (!hasRealizedRData || data.length <= 1) {
    return (
      <div className="bg-[#111726] border border-[#1e2a42] rounded-xl p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">
          Equity Curve Awaiting Realized R
        </h3>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed">
          The cumulative equity curve plots chronological risk units (R). The current Notion entries
          do not have numeric values in the <strong>RR</strong> property. Enter realized R outcomes
          in Notion (e.g. <code>+2.5</code> for wins, <code>1.0</code> for 1R loss) or switch to Demo Mode above to view sample curves.
        </p>
      </div>
    );
  }

  // Calculate high watermark and max drawdown in current view
  const finalR = data[data.length - 1].cumulativeR;
  const maxPeak = Math.max(...data.map(d => d.peakR));
  const maxDD = Math.max(...data.map(d => d.drawdownR));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pt: EquityCurvePoint = payload[0].payload;
      const isBaseline = pt.tradeIndex === 0;

      return (
        <div className="bg-[#0b101c]/95 border border-[#23324e] rounded-lg p-3 shadow-2xl backdrop-blur text-xs min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-mono text-slate-400 font-semibold">{pt.date}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                pt.result === 'Win'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : pt.result === 'Loss'
                  ? 'bg-rose-500/20 text-rose-300'
                  : pt.result === 'Break Even'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {pt.result}
            </span>
          </div>

          <p className="text-slate-200 font-medium truncate mb-2">{pt.title}</p>

          <div className="space-y-1 font-mono text-[11px]">
            {!isBaseline && (
              <div className="flex justify-between">
                <span className="text-slate-400">Trade Outcome:</span>
                <span
                  className={
                    (pt.individualR ?? 0) > 0
                      ? 'text-emerald-400 font-bold'
                      : (pt.individualR ?? 0) < 0
                      ? 'text-rose-400 font-bold'
                      : 'text-amber-400 font-bold'
                  }
                >
                  {(pt.individualR ?? 0) > 0 ? '+' : ''}
                  {pt.individualR}R
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-slate-400">Cumulative R:</span>
              <span
                className={`font-bold ${
                  pt.cumulativeR >= 0 ? 'text-cyan-400' : 'text-rose-400'
                }`}
              >
                {pt.cumulativeR > 0 ? '+' : ''}
                {pt.cumulativeR}R
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">High Water Mark:</span>
              <span className="text-slate-300">+{pt.peakR}R</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Drawdown from Peak:</span>
              <span className={pt.drawdownR > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                {pt.drawdownR > 0 ? `-${pt.drawdownR}R` : '0R'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#111726] border border-[#1e2a42] rounded-xl p-5 shadow-sm">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100 tracking-wide">
              {viewMode === 'equity' ? 'Cumulative Realized R Equity Curve' : 'Underwater Drawdown Curve'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological cumulative performance in risk-multiples (R)
          </p>
        </div>

        {/* View mode toggle & Summary Stats */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 text-xs font-mono mr-2">
            <div>
              <span className="text-slate-500">Peak: </span>
              <span className="text-emerald-400 font-semibold">+{maxPeak}R</span>
            </div>
            <div>
              <span className="text-slate-500">Net: </span>
              <span className={`font-semibold ${finalR >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                {finalR > 0 ? '+' : ''}{finalR}R
              </span>
            </div>
            <div>
              <span className="text-slate-500">Max DD: </span>
              <span className="text-rose-400 font-semibold">-{maxDD}R</span>
            </div>
          </div>

          <div className="bg-[#161f33] p-0.5 rounded-lg border border-[#22304d] flex text-xs">
            <button
              onClick={() => setViewMode('equity')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'equity'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Equity
            </button>
            <button
              onClick={() => setViewMode('drawdown')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'drawdown'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Drawdown
            </button>
          </div>
        </div>
      </div>

      {/* Recharts Area */}
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'equity' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#1e293b' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#1e293b' }}
                tickFormatter={(val: number) => `${val}R`}
              />
              <Tooltip cursor={{ stroke: '#2e3644', strokeWidth: 1 }} content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />
              <Area
                type="monotone"
                dataKey="cumulativeR"
                stroke="#22d3ee"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#equityGradient)"
                dot={{ stroke: '#22d3ee', strokeWidth: 1.5, r: 2.5, fill: '#0a0e17' }}
                activeDot={{ r: 5, stroke: '#67e8f9', strokeWidth: 2, fill: '#0891b2' }}
              />
            </AreaChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.05} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#1e293b' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#1e293b' }}
                reversed
                tickFormatter={(val: number) => `-${val}R`}
              />
              <Tooltip cursor={{ stroke: '#2e3644', strokeWidth: 1 }} content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />
              <Area
                type="monotone"
                dataKey="drawdownR"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#ddGradient)"
                dot={{ stroke: '#f43f5e', strokeWidth: 1.5, r: 2.5, fill: '#0a0e17' }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
