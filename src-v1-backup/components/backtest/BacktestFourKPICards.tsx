import React from 'react';
import {
  DollarSign,
  Percent,
  Layers,
  Scale
} from 'lucide-react';
import { KPIMetrics } from '../../types/trade';

interface BacktestFourKPICardsProps {
  metrics: KPIMetrics;
  totalCommissions?: number;
}

export const BacktestFourKPICards: React.FC<BacktestFourKPICardsProps> = ({
  metrics,
  totalCommissions = 0
}) => {
  const cards = [
    {
      id: 'total-pnl',
      label: 'Total Pnl',
      value: `${metrics.totalPnl >= 0 ? '+$' : '-$'}${Math.abs(metrics.totalPnl).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
      subtext: totalCommissions > 0 ? `Fees: -$${totalCommissions.toFixed(2)}` : 'Net realized performance',
      icon: DollarSign,
      color: metrics.totalPnl >= 0 ? 'text-[#00c076]' : 'text-[#ff4d4f]',
      badge: metrics.totalPnl >= 0 ? 'Profitable' : 'Drawdown',
      badgeColor: metrics.totalPnl >= 0 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    },
    {
      id: 'win-rate',
      label: 'Win Rate',
      value: `${metrics.winRate !== null ? metrics.winRate.toFixed(1) : 0}%`,
      subtext: `${metrics.wins} Wins • ${metrics.losses} Losses`,
      icon: Percent,
      color: 'text-blue-400',
      badge: `${metrics.wins}W / ${metrics.losses}L`,
      badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    },
    {
      id: 'total-trades',
      label: 'Total Trades',
      value: metrics.totalTrades.toString(),
      subtext: `${metrics.executedTrades} closed positions`,
      icon: Layers,
      color: 'text-slate-100',
      badge: 'Executed',
      badgeColor: 'bg-slate-700/30 text-slate-300 border-slate-600/30'
    },
    {
      id: 'breakeven-trades',
      label: 'Breakeven Trades',
      value: metrics.breakEvens.toString(),
      subtext: metrics.totalTrades > 0 ? `${((metrics.breakEvens / metrics.totalTrades) * 100).toFixed(1)}% of total trades` : '0% of total',
      icon: Scale,
      color: 'text-amber-300',
      badge: '0.0 P&L',
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:border-[#2b3547] group"
          >
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">
                {c.label}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${c.badgeColor}`}>
                  {c.badge}
                </span>
                <Icon className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </div>
            </div>

            <div>
              <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${c.color}`}>
                {c.value}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                {c.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
