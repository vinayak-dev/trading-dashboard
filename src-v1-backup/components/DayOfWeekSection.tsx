import React from 'react';
import { CalendarDays } from 'lucide-react';
import { CategoryMetric } from '../types/trade';

interface DayOfWeekSectionProps {
  stats: CategoryMetric[];
}

export const DayOfWeekSection: React.FC<DayOfWeekSectionProps> = ({ stats }) => {
  const formatR = (val: number | null) => {
    if (val === null) return 'N/A';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}R`;
  };

  return (
    <div className="bg-[#111726] border border-[#1e2a42] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">Day-of-Week Performance</h3>
        </div>
        <span className="text-xs text-slate-400">Monday - Friday Historical Edge</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(day => (
          <div
            key={day.name}
            className="rounded-lg border border-[#1e2c47] bg-[#141b2c]/60 p-3 flex flex-col justify-between transition-all hover:border-cyan-500/30 hover:bg-[#161f33]"
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                <span className="text-xs font-bold text-slate-200">{day.name}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {day.executedCount} tr
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-sans text-slate-400">Win Rate:</span>
                  <span
                    className={`font-bold ${
                      (day.winRate ?? 0) >= 50 ? 'text-emerald-400' : 'text-slate-300'
                    }`}
                  >
                    {day.winRate !== null ? `${day.winRate}%` : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-sans text-slate-400">Net R:</span>
                  <span
                    className={`font-bold ${
                      (day.netRealizedR ?? 0) > 0
                        ? 'text-emerald-400'
                        : (day.netRealizedR ?? 0) < 0
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {formatR(day.netRealizedR)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-sans text-slate-400">Avg R:</span>
                  <span className="text-slate-300">
                    {day.expectancy !== null ? `${day.expectancy > 0 ? '+' : ''}${day.expectancy}R` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono text-center">
              {day.wins}W / {day.losses}L / {day.breakEvens}BE
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
