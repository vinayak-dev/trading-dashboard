import { GitBranch } from 'lucide-react';
import { CategoryMetric } from '../types/trade';

interface SequenceSectionProps {
  stats: CategoryMetric[];
}

export const SequenceSection: React.FC<SequenceSectionProps> = ({ stats }) => {
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
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">Setup Sequence Analysis</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Reversal • Continuation • Aligned</span>
      </div>

      {stats.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
          No sequence property values found in selected records.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {stats.map(seq => (
            <div
              key={seq.name}
              className="rounded-xl border border-[#1e2c47] bg-[#141b2c]/80 p-4 flex flex-col justify-between transition-all hover:border-cyan-500/30 hover:bg-[#161f33]"
            >
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <span className="font-semibold text-slate-100 text-sm">{seq.name}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {seq.executedCount} trades
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Win Rate</span>
                    <span className="text-base font-bold font-mono text-slate-100">
                      {seq.winRate !== null ? `${seq.winRate}%` : 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {seq.wins}W / {seq.losses}L
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Net Realized R</span>
                    <span
                      className={`text-base font-bold font-mono ${
                        (seq.netRealizedR ?? 0) > 0
                          ? 'text-emerald-400'
                          : (seq.netRealizedR ?? 0) < 0
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {formatR(seq.netRealizedR)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Expectancy</span>
                    <span className="text-xs font-semibold font-mono text-cyan-400">
                      {seq.expectancy !== null ? `${seq.expectancy > 0 ? '+' : ''}${seq.expectancy}R` : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Profit Factor</span>
                    <span className="text-xs font-semibold font-mono text-slate-200">
                      {getPf(seq.profitFactor)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
