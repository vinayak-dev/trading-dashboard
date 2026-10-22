import { AlertCircle, Info } from 'lucide-react';
import { CategoryMetric } from '../types/trade';

interface MistakeAnalysisSectionProps {
  stats: CategoryMetric[];
}

export const MistakeAnalysisSection: React.FC<MistakeAnalysisSectionProps> = ({ stats }) => {
  const formatR = (val: number | null) => {
    if (val === null) return 'N/A';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}R`;
  };

  const mistakesOnly = stats.filter(s => s.name !== 'No Mistakes');
  const noMistakes = stats.find(s => s.name === 'No Mistakes');

  return (
    <div className="bg-[#111726] border border-[#1e2a42] rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-semibold text-slate-100">Mistake Analysis</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-amber-400/90 bg-amber-950/20 px-2.5 py-1 rounded-md border border-amber-900/40">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Trades may carry multiple mistake tags; counts overlap</span>
        </div>
      </div>

      {mistakesOnly.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
          No mistake tags identified in current trades selection.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1b253b] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Mistake Tag</th>
                <th className="py-2.5 px-3 text-center">Frequency</th>
                <th className="py-2.5 px-3 text-center">Win Rate</th>
                <th className="py-2.5 px-3 text-right">Avg Realized R</th>
                <th className="py-2.5 px-3 text-right">Net Realized R</th>
                <th className="py-2.5 px-3 text-right">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182236] font-mono">
              {mistakesOnly.map(item => (
                <tr key={item.name} className="hover:bg-[#161f33] transition-colors">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-2" />
                    {item.name}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 font-semibold">
                      {item.count}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`font-semibold ${
                        (item.winRate ?? 0) >= 50 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.winRate !== null ? `${item.winRate}%` : 'N/A'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={
                        (item.expectancy ?? 0) < 0
                          ? 'text-rose-400 font-semibold'
                          : (item.expectancy ?? 0) > 0
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-400'
                      }
                    >
                      {item.expectancy !== null ? `${item.expectancy > 0 ? '+' : ''}${item.expectancy}R` : 'N/A'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold">
                    <span
                      className={
                        (item.netRealizedR ?? 0) < 0
                          ? 'text-rose-400'
                          : (item.netRealizedR ?? 0) > 0
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }
                    >
                      {formatR(item.netRealizedR)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                    {item.wins}W / {item.losses}L / {item.breakEvens}BE
                  </td>
                </tr>
              ))}

              {noMistakes && (
                <tr className="bg-emerald-950/10 hover:bg-emerald-950/20 transition-colors border-t-2 border-emerald-900/40">
                  <td className="py-2.5 px-3 font-sans font-semibold text-emerald-300">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                    Clean Trades (No Mistakes Tagged)
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-300">
                    {noMistakes.count}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-300">
                    {noMistakes.winRate !== null ? `${noMistakes.winRate}%` : 'N/A'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-300">
                    {noMistakes.expectancy !== null ? `+${noMistakes.expectancy}R` : 'N/A'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    {formatR(noMistakes.netRealizedR)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                    {noMistakes.wins}W / {noMistakes.losses}L / {noMistakes.breakEvens}BE
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
