import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Scale } from 'lucide-react';
import { CategoryMetric } from '../types/trade';

interface RuleAdherenceSectionProps {
  stats: CategoryMetric[];
}

export const RuleAdherenceSection: React.FC<RuleAdherenceSectionProps> = ({ stats }) => {
  const formatR = (val: number | null) => {
    if (val === null) return 'N/A';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}R`;
  };

  const followed = stats.find(s => s.name === 'Followed');
  const partial = stats.find(s => s.name === 'Partially Followed');
  const broke = stats.find(s => s.name === 'Broke Rules');

  const groups = [
    {
      metric: followed,
      title: 'Followed Plan',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      toneBorder: 'border-emerald-500/30',
      toneBg: 'bg-[#0f1b1c]',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
    },
    {
      metric: partial,
      title: 'Partially Followed',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      toneBorder: 'border-amber-500/30',
      toneBg: 'bg-[#1a1715]',
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    {
      metric: broke,
      title: 'Broke Rules',
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      toneBorder: 'border-rose-500/30',
      toneBg: 'bg-[#1c1218]',
      badgeColor: 'bg-rose-500/20 text-rose-300',
    },
  ];

  return (
    <div className="bg-[#111726] border border-[#1e2a42] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">Rule Adherence Analysis</h3>
        </div>
        <span className="text-xs text-slate-400">Trading Discipline vs Edge</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {groups.map(({ metric, title, icon, toneBorder, toneBg, badgeColor }) => {
          const count = metric?.count ?? 0;

          return (
            <div
              key={title}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all hover:border-cyan-500/30 ${toneBg} ${toneBorder}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    {icon}
                    <h4 className="font-semibold text-slate-100 text-sm">{title}</h4>
                  </div>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${badgeColor}`}>
                    {count} logged
                  </span>
                </div>

                {metric && count > 0 ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Win Rate:</span>
                      <span className="font-mono font-bold text-slate-100">
                        {metric.winRate !== null ? `${metric.winRate}%` : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Net Realized R:</span>
                      <span
                        className={`font-mono font-bold ${
                          (metric.netRealizedR ?? 0) > 0
                            ? 'text-emerald-400'
                            : (metric.netRealizedR ?? 0) < 0
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {formatR(metric.netRealizedR)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Expectancy:</span>
                      <span className="font-mono font-semibold text-cyan-400">
                        {metric.expectancy !== null ? `${metric.expectancy > 0 ? '+' : ''}${metric.expectancy}R` : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Decided Record:</span>
                      <span className="font-mono text-slate-400">
                        {metric.wins}W • {metric.losses}L • {metric.breakEvens}BE
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No entries logged under {title}.
                  </p>
                )}
              </div>

              {metric && count > 0 && metric.avgWinR !== null && (
                <div className="pt-2.5 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Avg Win: {formatR(metric.avgWinR)}</span>
                  <span>Avg Loss: {metric.avgLossR !== null ? `-${metric.avgLossR}R` : 'N/A'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
