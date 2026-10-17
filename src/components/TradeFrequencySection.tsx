import React from 'react';
import { Info } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { TradeFrequencyStats } from '../lib/calculations';

interface TradeFrequencySectionProps {
  stats: TradeFrequencyStats;
}

export const TradeFrequencySection: React.FC<TradeFrequencySectionProps> = ({ stats }) => {
  const { daily, weekly, monthly } = stats;

  return (
    <div className="space-y-4">
      {/* Title matching screenshot */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold tracking-tight text-white">Average trade frequency</h2>
        <div className="relative group">
          <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors cursor-help" />
          <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 bg-[#161a23] border border-[#262f3f] text-slate-300 text-xs px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
            Frequency of trades executed per active day, week, and month
          </div>
        </div>
      </div>

      {/* 3 Frequency Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Trades / day */}
        <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-base font-bold text-white tracking-tight">Trades / day</h3>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm font-medium">
                Avg <span className="text-white font-bold text-base ml-1">{daily.avg}</span>
              </span>
              <Info className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>

          {/* Chart */}
          <div className="h-[180px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={daily.data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="freqBlueGradientDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0084ff" stopOpacity={1} />
                    <stop offset="100%" stopColor="#003fa3" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#1f242e"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#737c8c', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#737c8c', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, (dataMax: number) => Math.max(2, Math.ceil(dataMax))]}
                  allowDecimals={true}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#12151b] border border-[#232834] px-2.5 py-1.5 rounded-lg text-xs shadow-lg">
                          <span className="text-slate-400 block">{d.day}</span>
                          <span className="text-white font-bold font-mono">
                            {d.count} {d.count === 1 ? 'Trade' : 'Trades'}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="url(#freqBlueGradientDaily)"
                  barSize={14}
                  radius={[5, 5, 5, 5]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Trades / week */}
        <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-base font-bold text-white tracking-tight">Trades / week</h3>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm font-medium">
                Avg <span className="text-white font-bold text-base ml-1">{weekly.avg}</span>
              </span>
              <Info className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>

          {/* Chart */}
          <div className="h-[180px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weekly.data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="freqBlueGradientWeekly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0084ff" stopOpacity={1} />
                    <stop offset="100%" stopColor="#003fa3" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#1f242e"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#737c8c', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#737c8c', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, (dataMax: number) => Math.max(3, Math.ceil(dataMax))]}
                  allowDecimals={true}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#12151b] border border-[#232834] px-2.5 py-1.5 rounded-lg text-xs shadow-lg">
                          <span className="text-slate-400 block">Week {d.week}</span>
                          <span className="text-white font-bold font-mono">
                            {d.count} {d.count === 1 ? 'Trade' : 'Trades'}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="url(#freqBlueGradientWeekly)"
                  barSize={14}
                  radius={[5, 5, 5, 5]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Trades / month */}
        <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-base font-bold text-white tracking-tight">Trades / month</h3>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm font-medium">
                Avg <span className="text-white font-bold text-base ml-1">{monthly.avg}</span>
              </span>
              <Info className="w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>

          {/* Chart */}
          <div className="h-[180px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthly.data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="freqBlueGradientMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0084ff" stopOpacity={1} />
                    <stop offset="100%" stopColor="#003fa3" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#1f242e"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#737c8c', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#737c8c', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, (dataMax: number) => Math.max(8, Math.ceil(dataMax))]}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#12151b] border border-[#232834] px-2.5 py-1.5 rounded-lg text-xs shadow-lg">
                          <span className="text-slate-400 block">{d.month}</span>
                          <span className="text-white font-bold font-mono">
                            {d.count} {d.count === 1 ? 'Trade' : 'Trades'}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="url(#freqBlueGradientMonthly)"
                  barSize={22}
                  radius={[5, 5, 5, 5]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
