import React from 'react';
import { Info } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { KPIMetrics } from '../types/trade';

interface WinnersLosersSectionProps {
  metrics: KPIMetrics;
}

export const WinnersLosersSection: React.FC<WinnersLosersSectionProps> = ({ metrics }) => {
  // Donut data for Total Trades by side
  const tradesBySideData = [
    { name: 'buy', value: metrics.buyTradesCount || 5, color: '#00c076' },
    { name: 'sell', value: metrics.sellTradesCount || 5, color: '#0084ff' },
  ];

  // Data for Win Rate by side (outer ring buy, inner ring sell)
  const buyWinData = [
    { name: 'win', value: metrics.buyWinRate || 80, color: '#00c076' },
    { name: 'loss', value: 100 - (metrics.buyWinRate || 80), color: '#252a36' },
  ];

  const sellWinData = [
    { name: 'win', value: metrics.sellWinRate || 40, color: '#0084ff' },
    { name: 'loss', value: 100 - (metrics.sellWinRate || 40), color: '#1c202a' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Winners and Losers Section */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-4">
          Winners and Losers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Winners Card (Green Border) */}
          <div className="bg-[#12141a] border-2 border-[#00c076] rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-white mb-4">Winners</h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1 text-slate-400">
                  <span>Total winners</span>
                  <Info className="w-3 h-3 text-slate-600" />
                </span>
                <span className="text-sm font-bold text-white font-sans">{metrics.wins}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1 text-slate-400">
                  <span>Best win</span>
                  <Info className="w-3 h-3 text-slate-600" />
                </span>
                <span className="text-sm font-bold text-white font-sans">{metrics.bestWinPct}%</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1 text-slate-400">
                  <span>Average win</span>
                  <Info className="w-3 h-3 text-slate-600" />
                </span>
                <span className="text-sm font-bold text-white font-sans">{metrics.avgWinPct}%</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1 text-slate-400">
                  <span>Average duration</span>
                  <Info className="w-3 h-3 text-slate-600" />
                </span>
                <span className="text-sm font-bold text-white font-sans">{metrics.avgWinDuration}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1 text-slate-400">
                  <span>Max consecutive wins</span>
                  <Info className="w-3 h-3 text-slate-600" />
                </span>
                <span className="text-sm font-bold text-white font-sans">{metrics.maxConsecutiveWins}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1 text-slate-400">
                  <span>Avg consecutive wins</span>
                  <Info className="w-3 h-3 text-slate-600" />
                </span>
                <span className="text-sm font-bold text-white font-sans">{metrics.avgConsecutiveWins}</span>
              </div>
            </div>
          </div>

          {/* Losers Card (Red Border) */}
          <div className="bg-[#12141a] border-2 border-[#ff4d4d] rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-white mb-4">Losers</h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1 text-slate-400">
                  <span>Total losers</span>
                  <Info className="w-3 h-3 text-slate-600" />
                </span>
                <span className="text-sm font-bold text-white font-sans">{metrics.losses}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1 text-slate-400">
                  <span>Worst loss</span>
                  <Info className="w-3 h-3 text-slate-600" />
                </span>
                <span className="text-sm font-bold text-white font-sans">{metrics.worstLossPct}%</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1 text-slate-400">
                  <span>Average loss</span>
                  <Info className="w-3 h-3 text-slate-600" />
                </span>
                <span className="text-sm font-bold text-white font-sans">{metrics.avgLossPct}%</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1 text-slate-400">
                  <span>Average duration</span>
                  <Info className="w-3 h-3 text-slate-600" />
                </span>
                <span className="text-sm font-bold text-white font-sans">{metrics.avgLossDuration}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1 text-slate-400">
                  <span>Max consecutive losses</span>
                  <Info className="w-3 h-3 text-slate-600" />
                </span>
                <span className="text-sm font-bold text-white font-sans">{metrics.maxConsecutiveLosses}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1 text-slate-400">
                  <span>Avg consecutive losses</span>
                  <Info className="w-3 h-3 text-slate-600" />
                </span>
                <span className="text-sm font-bold text-white font-sans">{metrics.avgConsecutiveLosses}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Performance by side Section */}
      <div>
        <div className="flex items-center gap-1.5 mb-4">
          <h2 className="text-xl font-bold tracking-tight text-white">Performance by side</h2>
          <Info className="w-4 h-4 text-slate-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Trades Donut */}
          <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">Total Trades</span>
              <Info className="w-3.5 h-3.5 text-slate-600" />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00c076]" />
                buy
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0084ff]" />
                sell
              </span>
            </div>

            {/* Donut Chart */}
            <div className="h-[210px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tradesBySideData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {tradesBySideData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#12141a" strokeWidth={3} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Win Rate Concentric Rings */}
          <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">Win Rate</span>
              <Info className="w-3.5 h-3.5 text-slate-600" />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00c076]" />
                buy
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0084ff]" />
                sell
              </span>
            </div>

            {/* Concentric Double Rings */}
            <div className="h-[210px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* Outer Ring: Buy Win Rate */}
                  <Pie
                    data={buyWinData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={84}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    {buyWinData.map((entry, index) => (
                      <Cell key={`buy-${index}`} fill={entry.color} stroke="#12141a" strokeWidth={2} />
                    ))}
                  </Pie>

                  {/* Inner Ring: Sell Win Rate */}
                  <Pie
                    data={sellWinData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={64}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    {sellWinData.map((entry, index) => (
                      <Cell key={`sell-${index}`} fill={entry.color} stroke="#12141a" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
