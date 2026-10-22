import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { EdgeRadar, EdgeScoreData } from './charts/EdgeRadar';
import { EquityArea } from './charts/EquityArea';
import { DailyBars } from './charts/DailyBars';
import { EquityCurvePoint, KPIMetrics } from '../types/trade';

interface CoreVisualChartsProps {
  equityPoints: EquityCurvePoint[];
  dailyData: { day: string; pnl: number }[];
  metrics: KPIMetrics;
}

export const CoreVisualCharts: React.FC<CoreVisualChartsProps> = ({
  equityPoints,
  dailyData,
  metrics,
}) => {
  const hasExecuted = metrics.executedTrades > 0;

  // Compute Edge Score components from real metrics ONLY if executed trades exist
  const winRateScore = hasExecuted && metrics.winRate !== null ? Math.min(100, Math.round(metrics.winRate)) : 0;
  const pfScore =
    hasExecuted && metrics.profitFactor !== null
      ? metrics.profitFactor === Infinity
        ? 100
        : Math.min(100, Math.round(metrics.profitFactor * 35))
      : 0;
  const rrScore =
    hasExecuted && metrics.riskRewardRatio > 0
      ? Math.min(100, Math.round(metrics.riskRewardRatio * 40))
      : 0;
  const ddScore =
    hasExecuted && metrics.maxDrawdownR !== null
      ? Math.max(0, Math.min(100, Math.round(100 - metrics.maxDrawdownR * 12)))
      : hasExecuted
      ? 100
      : 0;
  const recoveryScore =
    hasExecuted && metrics.winRate !== null ? Math.min(100, Math.round(metrics.winRate * 0.9)) : 0;
  const consistencyScore =
    hasExecuted && metrics.ruleAdherenceRate !== null ? metrics.ruleAdherenceRate : 0;

  const edgeScoreComponents: EdgeScoreData = {
    winRate: winRateScore,
    profitFactor: pfScore,
    avgWinLoss: rrScore,
    drawdown: ddScore,
    recovery: recoveryScore,
    consistency: consistencyScore,
  };

  const totalEdgeScore = hasExecuted
    ? Math.round(
        (winRateScore + pfScore + rrScore + ddScore + recoveryScore + consistencyScore) / 6
      )
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* 1. Edge Score & Radar */}
      <Card className="h-full flex flex-col justify-between">
        <CardHeader className="flex-row items-center justify-between pb-1">
          <CardTitle>Edge Score</CardTitle>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums text-brand">
              {hasExecuted ? totalEdgeScore : "–"}
            </span>
            <span className="text-xs text-muted-foreground">{hasExecuted ? "/100" : "No trades"}</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center pt-0">
          <EdgeRadar components={edgeScoreComponents} height={230} />
        </CardContent>
      </Card>

      {/* 2. Cumulative P&L + Drawdown */}
      <Card className="h-full flex flex-col justify-between">
        <CardHeader className="flex-row items-center justify-between pb-1">
          <CardTitle>Daily net cumulative P&L</CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">
            {equityPoints.length} trades
          </span>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <EquityArea data={equityPoints} height={170} />
        </CardContent>
      </Card>

      {/* 3. Net Daily P&L */}
      <Card className="h-full flex flex-col justify-between">
        <CardHeader className="flex-row items-center justify-between pb-1">
          <CardTitle>Net daily P&L</CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">
            {dailyData.length} active sessions
          </span>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <DailyBars data={dailyData} height={230} />
        </CardContent>
      </Card>
    </div>
  );
};
