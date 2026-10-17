import { Layers } from 'lucide-react';
import { CategoryMetric } from '../types/trade';

interface TickerPerformanceProps {
  stats: CategoryMetric[];
}

export const TickerPerformance: React.FC<TickerPerformanceProps> = ({ stats }) => {
  const formatR = (val: number | null) => {
    if (val === null) return 'N/A';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}R`;
  };

  const getPf = (pf: number | null) => {
    if (pf === null) return 'N/A';
    if (pf === Infinity) return '∞';
    return pf.toFixed(2);
  };

  return (
    <div className="bg-[#111726] border border-[#1e2a42] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">Performance by Ticker</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">NQ vs ES Futures</span>
      </div>

      {stats.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
          No ticker data available in current filter selection.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map(t => {
            const isNQ = t.name.toUpperCase() === 'NQ';
            const isES = t.name.toUpperCase() === 'ES';
            const accentBorder = isNQ
              ? 'border-blue-500/30 bg-[#0f172a]/60'
              : isES
              ? 'border-red-500/30 bg-[#1c1218]/60'
              : 'border-slate-800 bg-[#141b2c]/60';

            return (
              <div
                key={t.name}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all hover:border-cyan-500/30 ${accentBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold font-mono tracking-wider text-slate-100">
                        {t.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {isNQ ? 'Nasdaq 100' : isES ? 'S&P 500' : 'Futures'}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {t.executedCount} executed
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Win Rate</span>
                      <span className="text-base font-bold font-mono text-slate-100">
                        {t.winRate !== null ? `${t.winRate}%` : 'N/A'}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        {t.wins}W / {t.losses}L / {t.breakEvens}BE
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Net Realized R</span>
                      <span
                        className={`text-base font-bold font-mono ${
                          (t.netRealizedR ?? 0) > 0
                            ? 'text-emerald-400'
                            : (t.netRealizedR ?? 0) < 0
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {formatR(t.netRealizedR)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Total cumulative</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Expectancy</span>
                      <span
                        className={`text-sm font-semibold font-mono ${
                          (t.expectancy ?? 0) > 0 ? 'text-cyan-400' : 'text-slate-300'
                        }`}
                      >
                        {t.expectancy !== null ? `${t.expectancy > 0 ? '+' : ''}${t.expectancy}R` : 'N/A'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">per trade</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Profit Factor</span>
                      <span className="text-sm font-semibold font-mono text-slate-200">
                        {getPf(t.profitFactor)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">gain/loss ratio</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Avg Win: <strong className="text-emerald-400">{formatR(t.avgWinR)}</strong></span>
                  <span>Avg Loss: <strong className="text-rose-400">{t.avgLossR !== null ? `-${t.avgLossR}R` : 'N/A'}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
