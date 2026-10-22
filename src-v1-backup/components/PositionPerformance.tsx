import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, Compass } from 'lucide-react';
import { CategoryMetric } from '../types/trade';

interface PositionPerformanceProps {
  stats: CategoryMetric[];
}

export const PositionPerformance: React.FC<PositionPerformanceProps> = ({ stats }) => {
  const formatR = (val: number | null) => {
    if (val === null) return 'N/A';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}R`;
  };

  const getPf = (pf: number | null) => {
    if (pf === null) return 'N/A';
    if (pf === Infinity) return '∞';
    return pf.toFixed(2);
  };

  const longStat = stats.find(s => s.name.toLowerCase() === 'long');
  const shortStat = stats.find(s => s.name.toLowerCase() === 'short');

  const positions = [
    { stat: longStat, label: 'Long', isLong: true },
    { stat: shortStat, label: 'Short', isLong: false },
  ];

  return (
    <div className="bg-[#111726] border border-[#1e2a42] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">Performance by Position</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Long vs Short Bias</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {positions.map(({ stat, label, isLong }) => {
          const count = stat?.executedCount ?? 0;
          const bgTone = isLong
            ? 'bg-emerald-950/10 border-emerald-500/20'
            : 'bg-rose-950/10 border-rose-500/20';

          return (
            <div
              key={label}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all hover:border-cyan-500/30 ${bgTone}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    {isLong ? (
                      <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <span className="text-base font-bold text-slate-100">{label} Setups</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{count} executed</span>
                </div>

                {stat ? (
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Win Rate</span>
                      <span className="text-base font-bold font-mono text-slate-100">
                        {stat.winRate !== null ? `${stat.winRate}%` : 'N/A'}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        {stat.wins}W / {stat.losses}L / {stat.breakEvens}BE
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Net Realized R</span>
                      <span
                        className={`text-base font-bold font-mono ${
                          (stat.netRealizedR ?? 0) > 0
                            ? 'text-emerald-400'
                            : (stat.netRealizedR ?? 0) < 0
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {formatR(stat.netRealizedR)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Total cumulative</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Expectancy</span>
                      <span
                        className={`text-sm font-semibold font-mono ${
                          (stat.expectancy ?? 0) > 0 ? 'text-cyan-400' : 'text-slate-300'
                        }`}
                      >
                        {stat.expectancy !== null ? `${stat.expectancy > 0 ? '+' : ''}${stat.expectancy}R` : 'N/A'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">per trade</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Profit Factor</span>
                      <span className="text-sm font-semibold font-mono text-slate-200">
                        {getPf(stat.profitFactor)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">gain/loss ratio</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No {label} trades recorded in this filter view.
                  </p>
                )}
              </div>

              {stat && (
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Avg Win: <strong className="text-emerald-400">{formatR(stat.avgWinR)}</strong></span>
                  <span>Avg Loss: <strong className="text-rose-400">{stat.avgLossR !== null ? `-${stat.avgLossR}R` : 'N/A'}</strong></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
