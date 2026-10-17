import React from 'react';
import { Info } from 'lucide-react';
import { KPIMetrics } from '../types/trade';

interface KPISixCardsProps {
  metrics: KPIMetrics;
}

export const KPISixCards: React.FC<KPISixCardsProps> = ({ metrics }) => {
  const cards = [
    {
      id: 'total-pnl',
      label: 'Total Pnl',
      value: `$${metrics.totalPnl.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`,
      info: 'Net cumulative profit and loss across all closed trades.',
    },
    {
      id: 'win-rate',
      label: 'Win Rate',
      value: `${metrics.winRate ?? 60}%`,
      info: 'Percentage of winning trades out of total decided trades.',
    },
    {
      id: 'risk-reward',
      label: 'Risk/Reward',
      value: metrics.riskRewardRatio.toFixed(2),
      info: 'Average realized reward-to-risk ratio.',
    },
    {
      id: 'month-gain-loss',
      label: 'Month Gain/Loss',
      value: `$${metrics.monthGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      info: 'Net gain/loss for the current month.',
    },
    {
      id: 'week-gain-loss',
      label: 'Week Gain/Loss',
      value: `$${metrics.weekGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      info: 'Net gain/loss for the current week.',
    },
    {
      id: 'daily-gain-loss',
      label: 'Daily Gain/Loss',
      value: `$${metrics.dailyGainLoss.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`,
      info: 'Net gain/loss for the most recent trading session.',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {cards.map(c => (
        <div
          key={c.id}
          className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-[#2a3240] shadow-md group"
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
              {c.label}
            </span>
            <button
              type="button"
              className="text-slate-600 hover:text-slate-400 p-0.5 transition-colors focus:outline-none"
              title={c.info}
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
};
