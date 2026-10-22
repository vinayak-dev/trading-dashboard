import React from 'react';
import {
  TrendingUp,
  Scale,
  Award,
  Zap,
  Flame,
  ShieldAlert,
  Percent,
  Receipt
} from 'lucide-react';
import { BacktestKPIMetrics } from '../../types/backtest';

interface BacktestAnalyticsCardsProps {
  kpis: BacktestKPIMetrics;
}

export const BacktestAnalyticsCards: React.FC<BacktestAnalyticsCardsProps> = ({ kpis }) => {
  const cards = [
    {
      id: 'net-pnl',
      label: 'Net Realized P&L',
      value: `${kpis.totalNetPnl >= 0 ? '+$' : '-$'}${Math.abs(kpis.totalNetPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: `Gross: $${kpis.totalGrossPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })} • Fees: $${kpis.totalCommissions.toFixed(2)}`,
      icon: TrendingUp,
      color: kpis.totalNetPnl >= 0 ? 'text-[#00c076]' : 'text-[#ff4d4f]',
      glow: kpis.totalNetPnl >= 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'
    },
    {
      id: 'win-rate',
      label: 'Win Rate',
      value: `${kpis.winRate}%`,
      subtext: `${kpis.winningTrades}W / ${kpis.losingTrades}L / ${kpis.breakevenTrades}BE (${kpis.totalTrades} total)`,
      icon: Percent,
      color: 'text-blue-400',
      glow: 'border-blue-500/25 bg-blue-500/5'
    },
    {
      id: 'profit-factor',
      label: 'Profit Factor',
      value: kpis.profitFactor !== null ? kpis.profitFactor.toFixed(2) : 'N/A',
      subtext: kpis.profitFactor && kpis.profitFactor >= 1.5 ? 'Strong edge (> 1.5)' : 'Gross win / gross loss',
      icon: Scale,
      color: kpis.profitFactor && kpis.profitFactor >= 1.0 ? 'text-emerald-400' : 'text-amber-400',
      glow: 'border-[#1f242e] bg-[#12141a]'
    },
    {
      id: 'expectancy',
      label: 'Expectancy / Trade',
      value: `${kpis.expectancy >= 0 ? '+$' : '-$'}${Math.abs(kpis.expectancy).toFixed(2)}`,
      subtext: kpis.expectancyR !== null ? `${kpis.expectancyR >= 0 ? '+' : ''}${kpis.expectancyR}R avg reward` : 'Expected avg return',
      icon: Zap,
      color: kpis.expectancy >= 0 ? 'text-[#00c076]' : 'text-[#ff4d4f]',
      glow: 'border-[#1f242e] bg-[#12141a]'
    },
    {
      id: 'avg-win-loss',
      label: 'Avg Win / Avg Loss',
      value: `$${kpis.averageWin.toFixed(0)} / -$${kpis.averageLoss.toFixed(0)}`,
      subtext: kpis.winLossRatio ? `Payoff ratio: ${kpis.winLossRatio}:1` : 'Win/Loss magnitude',
      icon: Receipt,
      color: 'text-slate-100',
      glow: 'border-[#1f242e] bg-[#12141a]'
    },
    {
      id: 'max-drawdown',
      label: 'Max Drawdown',
      value: `-$${kpis.maxDrawdownDollar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: `-${kpis.maxDrawdownPct.toFixed(2)}% peak-to-trough equity`,
      icon: ShieldAlert,
      color: 'text-rose-400',
      glow: 'border-rose-500/25 bg-rose-500/5'
    },
    {
      id: 'streaks',
      label: 'Streaks (W / L)',
      value: `${kpis.maxConsecutiveWins}W / ${kpis.maxConsecutiveLosses}L`,
      subtext: 'Consecutive winning / losing runs',
      icon: Flame,
      color: 'text-amber-400',
      glow: 'border-[#1f242e] bg-[#12141a]'
    },
    {
      id: 'best-trade',
      label: 'Largest Win',
      value: `+$${kpis.largestWin.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      subtext: `Worst: -$${Math.abs(kpis.largestLoss).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: Award,
      color: 'text-emerald-400',
      glow: 'border-[#1f242e] bg-[#12141a]'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className={`rounded-2xl border p-4 flex flex-col justify-between transition-all hover:border-[#2f384a] shadow-md group ${c.glow}`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">
                {c.label}
              </span>
              <Icon className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>

            <div>
              <div className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${c.color}`}>
                {c.value}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1 truncate">
                {c.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
