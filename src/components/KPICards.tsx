import React, { useState } from 'react';
import {
  TrendingUp,
  Percent,
  Coins,
  Scale,
  ShieldCheck,
  AlertOctagon,
  EyeOff,
  HelpCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { KPIMetrics } from '../types/trade';

interface KPICardsProps {
  metrics: KPIMetrics;
}

interface CardDef {
  id: string;
  title: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  tone: 'positive' | 'negative' | 'neutral' | 'warning' | 'unavailable';
  tooltip: string;
}

export const KPICards: React.FC<KPICardsProps> = ({ metrics }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const formatR = (val: number | null): string => {
    if (val === null) return 'N/A';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}R`;
  };

  const cards: CardDef[] = [
    {
      id: 'executed-trades',
      title: 'Executed Trades',
      value: metrics.executedTrades.toString(),
      subtext: `${metrics.wins}W • ${metrics.losses}L • ${metrics.breakEvens}BE (${metrics.noTradesCount} No Trade)`,
      icon: <Activity className="w-4 h-4 text-cyan-400" />,
      tone: 'neutral',
      tooltip: 'Total trades taken (Wins, Losses, Break Evens). Excludes No-Trade days.',
    },
    {
      id: 'win-rate',
      title: 'Win Rate',
      value: metrics.winRate !== null ? `${metrics.winRate}%` : 'N/A',
      subtext: metrics.winRate !== null ? `${metrics.wins} of ${metrics.wins + metrics.losses} decisions` : 'No decided trades',
      icon: <Percent className="w-4 h-4 text-emerald-400" />,
      tone: metrics.winRate === null ? 'unavailable' : metrics.winRate >= 50 ? 'positive' : 'warning',
      tooltip: 'Formula: Wins / (Wins + Losses) × 100. Breakeven and No-Trade entries are mathematically excluded.',
    },
    {
      id: 'net-r',
      title: 'Net Realized R',
      value: formatR(metrics.netRealizedR),
      subtext: metrics.hasRealizedRData ? 'Cumulative units of risk gained' : 'Awaiting RR entry in Notion',
      icon: <Coins className="w-4 h-4 text-emerald-400" />,
      tone: metrics.netRealizedR === null ? 'unavailable' : metrics.netRealizedR > 0 ? 'positive' : metrics.netRealizedR < 0 ? 'negative' : 'neutral',
      tooltip: 'Sum of realized R outcomes across all executed trades. Requires RR field data.',
    },
    {
      id: 'expectancy',
      title: 'Expectancy',
      value: metrics.expectancy !== null ? `${metrics.expectancy > 0 ? '+' : ''}${metrics.expectancy}R` : 'N/A',
      subtext: metrics.expectancy !== null ? 'Avg edge per executed trade' : 'Requires Realized R',
      icon: <TrendingUp className="w-4 h-4 text-blue-400" />,
      tone: metrics.expectancy === null ? 'unavailable' : metrics.expectancy > 0 ? 'positive' : 'negative',
      tooltip: 'Formula: Net Realized R / Total Executed Trades. Quantifies theoretical expected return per trade.',
    },
    {
      id: 'profit-factor',
      title: 'Profit Factor',
      value: metrics.profitFactor === null ? 'N/A' : metrics.profitFactor === Infinity ? '∞ (Zero Loss)' : metrics.profitFactor.toFixed(2),
      subtext: metrics.profitFactor !== null && metrics.profitFactor !== Infinity ? 'Gross Gain / Gross Loss' : metrics.profitFactor === Infinity ? 'No losing trades' : 'Requires Realized R',
      icon: <Scale className="w-4 h-4 text-purple-400" />,
      tone: metrics.profitFactor === null ? 'unavailable' : metrics.profitFactor >= 1.5 ? 'positive' : metrics.profitFactor >= 1.0 ? 'warning' : 'negative',
      tooltip: 'Formula: Gross Positive R / Absolute Gross Negative R. A value > 1.5 indicates a robust statistical edge.',
    },
    {
      id: 'avg-win',
      title: 'Avg Winning R',
      value: formatR(metrics.avgWinR),
      subtext: metrics.avgWinR !== null ? `Average reward on ${metrics.wins} wins` : 'No winning R data',
      icon: <ArrowUpRight className="w-4 h-4 text-emerald-400" />,
      tone: metrics.avgWinR !== null ? 'positive' : 'unavailable',
      tooltip: 'Average realized R achieved exclusively on winning trades.',
    },
    {
      id: 'avg-loss',
      title: 'Avg Losing R',
      value: metrics.avgLossR !== null ? `-${metrics.avgLossR}R` : 'N/A',
      subtext: metrics.avgLossR !== null ? `Average risk on ${metrics.losses} losses` : 'No losing R data',
      icon: <ArrowDownRight className="w-4 h-4 text-rose-400" />,
      tone: metrics.avgLossR !== null ? (metrics.avgLossR > 1.2 ? 'warning' : 'neutral') : 'unavailable',
      tooltip: 'Average absolute loss in R units. Standard trading risk models target 1.0R loss limit.',
    },
    {
      id: 'rule-adherence',
      title: 'Rule Adherence',
      value: metrics.ruleAdherenceRate !== null ? `${metrics.ruleAdherenceRate}%` : 'N/A',
      subtext: metrics.ruleAdherenceRate !== null ? 'Executed trades followed plan' : 'No adherence logged',
      icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />,
      tone: metrics.ruleAdherenceRate === null ? 'unavailable' : metrics.ruleAdherenceRate >= 85 ? 'positive' : metrics.ruleAdherenceRate >= 70 ? 'warning' : 'negative',
      tooltip: 'Formula: Followed Trades / Total Trades with Known Adherence × 100.',
    },
    {
      id: 'max-drawdown',
      title: 'Max Drawdown',
      value: metrics.maxDrawdownR !== null ? `-${metrics.maxDrawdownR}R` : 'N/A',
      subtext: metrics.maxDrawdownR !== null ? 'Largest peak-to-trough decline' : 'Requires Realized R',
      icon: <AlertOctagon className="w-4 h-4 text-rose-400" />,
      tone: metrics.maxDrawdownR === null ? 'unavailable' : metrics.maxDrawdownR > 4 ? 'negative' : 'warning',
      tooltip: 'Largest peak-to-trough decline experienced on the cumulative realized R equity curve.',
    },
    {
      id: 'setups-missed',
      title: 'Valid Setups Missed',
      value: metrics.validSetupsMissed.toString(),
      subtext: 'Flagged with "Missed valid setup"',
      icon: <EyeOff className="w-4 h-4 text-amber-400" />,
      tone: metrics.validSetupsMissed > 0 ? 'warning' : 'neutral',
      tooltip: 'Count of trades or journal entries recording hesitation or missed setup opportunities.',
    },
  ];

  const getToneClasses = (tone: CardDef['tone']) => {
    switch (tone) {
      case 'positive':
        return {
          border: 'border-emerald-500/30',
          valueColor: 'text-emerald-400',
          bg: 'bg-[#0f1922]',
        };
      case 'negative':
        return {
          border: 'border-rose-500/30',
          valueColor: 'text-rose-400',
          bg: 'bg-[#1b1219]',
        };
      case 'warning':
        return {
          border: 'border-amber-500/30',
          valueColor: 'text-amber-400',
          bg: 'bg-[#1a1715]',
        };
      case 'unavailable':
        return {
          border: 'border-slate-800/80',
          valueColor: 'text-slate-500',
          bg: 'bg-[#10141f]',
        };
      case 'neutral':
      default:
        return {
          border: 'border-[#1e2a42]',
          valueColor: 'text-slate-100',
          bg: 'bg-[#111726]',
        };
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {cards.map(card => {
        const toneStyle = getToneClasses(card.tone);
        const isTooltipOpen = activeTooltip === card.id;

        return (
          <div
            key={card.id}
            className={`relative rounded-xl border p-4 transition-all duration-200 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-black/40 ${toneStyle.bg} ${toneStyle.border}`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs font-medium text-slate-400 truncate flex items-center gap-1.5">
                {card.icon}
                <span className="truncate">{card.title}</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveTooltip(isTooltipOpen ? null : card.id)}
                onMouseEnter={() => setActiveTooltip(card.id)}
                onMouseLeave={() => setActiveTooltip(null)}
                className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors focus:outline-none"
                aria-label={`Definition for ${card.title}`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono tracking-tight ${toneStyle.valueColor}`}>
                {card.value}
              </span>
            </div>

            {card.subtext && (
              <p className="text-[11px] text-slate-400/80 mt-1 truncate" title={card.subtext}>
                {card.subtext}
              </p>
            )}

            {/* Tooltip Popup */}
            {isTooltipOpen && (
              <div className="absolute left-2 right-2 bottom-full mb-2 p-2.5 bg-slate-900/95 border border-slate-700/80 rounded-lg text-xs text-slate-200 shadow-2xl z-50 animate-in fade-in zoom-in-95 pointer-events-none">
                <p className="font-semibold text-cyan-300 mb-0.5">{card.title}</p>
                <p className="text-slate-300 text-[11px] leading-relaxed">{card.tooltip}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
