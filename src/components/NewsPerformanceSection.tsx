import { Radio } from 'lucide-react';
import { CategoryMetric } from '../types/trade';

interface NewsPerformanceSectionProps {
  stats: CategoryMetric[];
}

export const NewsPerformanceSection: React.FC<NewsPerformanceSectionProps> = ({ stats }) => {
  const formatR = (val: number | null) => {
    if (val === null) return 'N/A';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}R`;
  };

  return (
    <div className="bg-[#111726] border border-[#1e2a42] rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">Macro News Catalyst Analysis</h3>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
          High-Impact Economic Catalysts (NFP, CPI, FOMC, PPI, PCE)
        </span>
      </div>

      {stats.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
          No news catalyst classifications found in the current trade dataset.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.map(item => (
            <div
              key={item.name}
              className="rounded-lg border border-[#1e2c47] bg-[#141b2c]/80 p-3.5 flex flex-col justify-between hover:border-cyan-500/30 transition-all"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="text-xs font-bold text-slate-200">{item.name}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {item.executedCount} trades
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] font-sans text-slate-400 block">Win Rate</span>
                    <span
                      className={`font-bold ${
                        (item.winRate ?? 0) >= 50 ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {item.winRate !== null ? `${item.winRate}%` : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-sans text-slate-400 block">Net R</span>
                    <span
                      className={`font-bold ${
                        (item.netRealizedR ?? 0) > 0
                          ? 'text-emerald-400'
                          : (item.netRealizedR ?? 0) < 0
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {formatR(item.netRealizedR)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex justify-between">
                <span>Record:</span>
                <span>{item.wins}W / {item.losses}L / {item.breakEvens}BE</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
