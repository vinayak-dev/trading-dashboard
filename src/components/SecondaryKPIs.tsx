import React, { useMemo } from 'react';
import {
  TrendingDown,
  Flame,
  Sigma,
  Timer,
  Trophy,
} from 'lucide-react';
import { TradeRecord, KPIMetrics } from '../types/trade';
import { Card, CardContent, StatHeader } from './ui/card';
import { calculateStreakStats } from '../lib/calculations';

interface SecondaryKPIsProps {
  trades: TradeRecord[];
  metrics: KPIMetrics;
}

export const SecondaryKPIs: React.FC<SecondaryKPIsProps> = ({
  trades,
  metrics,
}) => {
  const streaks = useMemo(() => calculateStreakStats(trades), [trades]);
  const currentStreak = streaks.currentStreak;
  const maxWins = streaks.maxConsecutiveWins || 0;
  const maxLosses = streaks.maxConsecutiveLosses || 0;

  // Best & worst day calculations from executed trades
  const dayTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of trades) {
      if (!t.isExecutedTrade) continue;
      const date = t.date || 'Unknown';
      const pnl = t.dollarPnl ?? (t.realizedR ? t.realizedR * 500 : 0);
      map.set(date, (map.get(date) ?? 0) + pnl);
    }
    const arr = Array.from(map.entries()).map(([date, pnl]) => ({ date, pnl }));
    if (arr.length === 0) return { best: null, worst: null };
    arr.sort((a, b) => b.pnl - a.pnl);
    return {
      best: arr[0],
      worst: arr[arr.length - 1],
    };
  }, [trades]);

  const hasExecuted = metrics.executedTrades > 0;
  const maxDrawdownDollar =
    metrics.maxDrawdownR !== null && metrics.maxDrawdownR !== undefined
      ? metrics.maxDrawdownR * 500
      : 0;
  const recoveryFactor =
    metrics.maxDrawdownR && metrics.maxDrawdownR > 0
      ? (Math.max(0, metrics.netRealizedR ?? 0) / metrics.maxDrawdownR).toFixed(1)
      : metrics.profitFactor && metrics.profitFactor !== Infinity
      ? metrics.profitFactor.toFixed(1)
      : '–';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. Max Drawdown */}
      <Card className="h-full flex flex-col justify-between">
        <StatHeader
          title="Max drawdown"
          icon={TrendingDown}
          hint="Largest peak-to-trough decline on the cumulative equity curve."
        />
        <CardContent>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums text-loss">
            {hasExecuted ? `-$${Math.abs(maxDrawdownDollar).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {hasExecuted && metrics.maxDrawdownR
              ? `-${metrics.maxDrawdownR.toFixed(1)}R · recovery ${recoveryFactor}x`
              : 'No drawdown'}
          </div>
        </CardContent>
      </Card>

      {/* 2. Streaks */}
      <Card className="h-full flex flex-col justify-between">
        <StatHeader
          title="Streaks"
          icon={Flame}
          hint="Current run of consecutive winning or losing trades, with all-time historical extremes."
        />
        <CardContent>
          <div
            className={`text-xl sm:text-2xl font-semibold tabular-nums ${
              currentStreak.type === 'win'
                ? 'text-profit'
                : currentStreak.type === 'loss'
                ? 'text-loss'
                : 'text-foreground'
            }`}
          >
            {hasExecuted
              ? currentStreak.type === 'win'
                ? `+${currentStreak.count}W`
                : currentStreak.type === 'loss'
                ? `-${currentStreak.count}L`
                : '0'
              : '0'}
          </div>
          <div className="mt-1 text-xs text-muted-foreground tabular-nums">
            {hasExecuted ? `best ${maxWins}W · worst ${maxLosses}L` : 'No streak recorded'}
          </div>
        </CardContent>
      </Card>

      {/* 3. Expectancy / trade */}
      <Card className="h-full flex flex-col justify-between">
        <StatHeader
          title="Expectancy / trade"
          icon={Sigma}
          hint="Average expected net return per closed trade based on current performance stats."
        />
        <CardContent>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums text-profit">
            {hasExecuted && metrics.expectancy !== null
              ? `${metrics.expectancy >= 0 ? '+' : '-'}$${Math.abs(metrics.expectancy * 100).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}`
              : '–'}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {hasExecuted && metrics.expectancy !== null
              ? `avg ${metrics.expectancy >= 0 ? '+' : ''}${metrics.expectancy.toFixed(2)}R per trade`
              : 'No trade expectancy'}
          </div>
        </CardContent>
      </Card>

      {/* 4. Avg duration */}
      <Card className="h-full flex flex-col justify-between">
        <StatHeader
          title="Avg duration"
          icon={Timer}
          hint="Average time elapsed between position entry fill and final execution close."
        />
        <CardContent>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground">
            {metrics.avgWinDuration ? metrics.avgWinDuration : '–'}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            intraday hold duration
          </div>
        </CardContent>
      </Card>

      {/* 5. Best / worst day */}
      <Card className="h-full flex flex-col justify-between col-span-2 md:col-span-1">
        <StatHeader
          title="Best / worst day"
          icon={Trophy}
          hint="Highest and lowest single-day net profit & loss in the selected date range."
        />
        <CardContent className="space-y-1">
          {dayTotals.best ? (
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">{dayTotals.best.date.slice(5)}</span>
              <span className="tabular-nums text-profit font-semibold">
                +${Math.abs(dayTotals.best.pnl).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No closed trading days</div>
          )}
          {dayTotals.worst && dayTotals.worst !== dayTotals.best && (
            <div className="flex items-baseline justify-between text-xs border-t border-border pt-1 mt-1">
              <span className="text-muted-foreground">{dayTotals.worst.date.slice(5)}</span>
              <span className="tabular-nums text-loss font-semibold">
                -${Math.abs(dayTotals.worst.pnl).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
