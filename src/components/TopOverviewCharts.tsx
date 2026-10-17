import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ReferenceLine,
  Cell
} from 'recharts';
import { EquityCurvePoint } from '../types/trade';

interface TopOverviewChartsProps {
  equityPoints: EquityCurvePoint[];
  monthlyData: { month: string; profit: number; loss: number }[];
  dailyData: { day: string; pnl: number }[];
}

export const TopOverviewCharts: React.FC<TopOverviewChartsProps> = ({
  equityPoints,
  monthlyData,
  dailyData,
}) => {
  const formatK = (val: number) => {
    if (Math.abs(val) >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    }
    return `${val}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Equity Mini Chart */}
      <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
        <h3 className="text-sm font-bold text-slate-100 tracking-tight mb-2">Equity</h3>
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityPoints} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="miniEquityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0084ff" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0084ff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1d222c" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#727b8c', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#1f242e' }}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#727b8c', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#1f242e' }}
                tickFormatter={formatK}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload as EquityCurvePoint;
                    return (
                      <div className="bg-[#101217] border border-[#232834] p-2 rounded-lg text-xs font-mono shadow-xl">
                        <span className="text-slate-400 block">{pt.date}</span>
                        <span className="font-bold text-cyan-400">
                          ${pt.accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="accountBalance"
                stroke="#0084ff"
                strokeWidth={2}
                fill="url(#miniEquityGradient)"
                dot={{ stroke: '#0084ff', strokeWidth: 2, r: 2.5, fill: '#ffffff' }}
                activeDot={{ r: 4.5, stroke: '#ffffff', strokeWidth: 2, fill: '#0084ff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Monthly Performance Bilateral Chart */}
      <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
        <h3 className="text-sm font-bold text-slate-100 tracking-tight mb-2">Monthly Performance</h3>
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={monthlyData}
              stackOffset="sign"
              margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="lossGradient" x1="1" y1="0" x2="0" y2="0">
                  <stop offset="0%" stopColor="#e55039" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#c0392b" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00b894" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#00cec9" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#1d222c" />
              <XAxis
                type="number"
                domain={[-2000, 3000]}
                tick={{ fill: '#727b8c', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#1f242e' }}
                tickFormatter={formatK}
              />
              <YAxis
                type="category"
                dataKey="month"
                tick={{ fill: '#8f98a8', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#1f242e' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#101217] border border-[#232834] p-2 rounded-lg text-xs font-mono shadow-xl">
                        <span className="text-slate-300 font-bold block mb-1">{d.month}</span>
                        <span className="text-emerald-400 block">+${d.profit.toLocaleString()}</span>
                        <span className="text-rose-400 block">-${Math.abs(d.loss).toLocaleString()}</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine x={0} stroke="#2e3644" />
              <Bar dataKey="loss" fill="url(#lossGradient)" radius={[4, 0, 0, 4]} barSize={26} />
              <Bar dataKey="profit" fill="url(#profitGradient)" radius={[0, 4, 4, 0]} barSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Daily Performance Weekday Chart */}
      <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
        <h3 className="text-sm font-bold text-slate-100 tracking-tight mb-2">Daily Performance</h3>
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 8, right: 8, left: -18, bottom: 20 }}>
              <defs>
                <linearGradient id="dailyBlueBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0084ff" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#0055b3" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#1d222c" />
              <XAxis
                dataKey="day"
                tick={{ fill: '#727b8c', fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: '#1f242e' }}
                interval={0}
                angle={-40}
                textAnchor="end"
              />
              <YAxis
                domain={[-2000, 3000]}
                tick={{ fill: '#727b8c', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#1f242e' }}
                tickFormatter={formatK}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#101217] border border-[#232834] p-2 rounded-lg text-xs font-mono shadow-xl">
                        <span className="text-slate-300 block mb-0.5">{d.day}</span>
                        <span className={d.pnl >= 0 ? 'text-cyan-400 font-bold' : 'text-rose-400 font-bold'}>
                          {d.pnl >= 0 ? '+' : ''}${d.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="#2e3644" />
              <Bar dataKey="pnl" fill="url(#dailyBlueBar)" radius={[4, 4, 0, 0]} barSize={22}>
                {dailyData.map((entry, index) => (
                  <Cell
                    key={`daily-cell-${index}`}
                    fill={entry.pnl < 0 ? '#0066cc' : 'url(#dailyBlueBar)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
