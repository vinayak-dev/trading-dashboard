import React, { useMemo } from 'react';
import { Flame, TrendingDown, Minus } from 'lucide-react';
import { TradeRecord, KPIMetrics } from '../types/trade';
import { calculateStreakStats } from '../lib/calculations';

interface TradeOutcomesStreakSectionProps {
  trades: TradeRecord[];
  metrics?: KPIMetrics;
}

export const TradeOutcomesStreakSection: React.FC<TradeOutcomesStreakSectionProps> = ({
  trades,
  metrics,
}) => {
  // Current streak calculation
  const streakStats = useMemo(() => calculateStreakStats(trades), [trades]);
  const currentStreak = streakStats.currentStreak || metrics?.currentStreak || { type: 'none', count: 0 };

  const streakConfig = useMemo(() => {
    if (currentStreak.type === 'win' && currentStreak.count > 0) {
      return {
        title: 'Winning Streak',
        value: `+${currentStreak.count} ${currentStreak.count === 1 ? 'Win' : 'Wins'}`,
        subtext: `${currentStreak.count} consecutive winning ${currentStreak.count === 1 ? 'trade' : 'trades'}`,
        icon: Flame,
        iconBox: 'bg-[#00c076]/10 border-[#00c076]/30',
        iconColor: 'text-[#00c076]',
        dotColor: 'bg-[#00c076]',
        badge: 'text-[#00c076] bg-[#00c076]/15 border-[#00c076]/30',
      };
    }

    if (currentStreak.type === 'loss' && currentStreak.count > 0) {
      return {
        title: 'Losing Streak',
        value: `-${currentStreak.count} ${currentStreak.count === 1 ? 'Loss' : 'Losses'}`,
        subtext: `${currentStreak.count} consecutive losing ${currentStreak.count === 1 ? 'trade' : 'trades'}`,
        icon: TrendingDown,
        iconBox: 'bg-[#ff4d4d]/10 border-[#ff4d4d]/30',
        iconColor: 'text-[#ff4d4d]',
        dotColor: 'bg-[#ff4d4d]',
        badge: 'text-[#ff4d4d] bg-[#ff4d4d]/15 border-[#ff4d4d]/30',
      };
    }

    return {
      title: 'No Active Streak',
      value: '0 Trades',
      subtext: 'Neutral • Awaiting next closed trade',
      icon: Minus,
      iconBox: 'bg-slate-800/60 border-slate-700/60',
      iconColor: 'text-slate-400',
      dotColor: 'bg-slate-500',
      badge: 'text-slate-400 bg-slate-800/60 border-slate-700/60',
    };
  }, [currentStreak]);

  const Icon = streakConfig.icon;

  return (
    <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-3.5 sm:px-4 sm:py-3 shadow-md">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Icon + What streak am I in */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border ${streakConfig.iconBox}`}
          >
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${streakConfig.iconColor}`} />
          </div>

          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${streakConfig.dotColor}`} />
              Current Streak
            </div>
            <div className="text-base sm:text-lg font-bold text-white mt-0.5 truncate">
              {streakConfig.title}
            </div>
          </div>
        </div>

        {/* Right: Streak count pill & subtext */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden md:block">
            <span className="text-xs text-slate-400 block font-medium">
              {streakConfig.subtext}
            </span>
          </div>
          <span
            className={`text-sm sm:text-base font-bold font-mono px-3 py-1 rounded-xl border ${streakConfig.badge}`}
          >
            {streakConfig.value}
          </span>
        </div>
      </div>
    </div>
  );
};

export const CurrentStreakSection = TradeOutcomesStreakSection;
