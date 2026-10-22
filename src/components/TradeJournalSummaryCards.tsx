import React, { useMemo } from "react";
import {
  CircleDollarSign,
  Target,
  Scale,
  CalendarCheck2,
  ArrowUpDown,
} from "lucide-react";
import { KPIMetrics, TradeRecord } from "../types/trade";
import { Card, CardContent, StatHeader } from "./ui/card";
import { Gauge } from "./charts/Gauge";

interface TradeJournalSummaryCardsProps {
  metrics: KPIMetrics;
  trades?: TradeRecord[];
}

export const TradeJournalSummaryCards: React.FC<TradeJournalSummaryCardsProps> = ({
  metrics,
  trades = [],
}) => {
  const isNetPositive = metrics.totalPnl >= 0;
  const closedCount = metrics.executedTrades;
  const wins = metrics.wins;
  const breakEvens = metrics.breakEvens;
  const losses = metrics.losses;

  // Real week delta from metrics
  const weekDelta = metrics.weekGainLoss;

  // Real Average Win / Loss values & bar scaling
  const avgWin = wins > 0 ? Math.abs((metrics.avgWinPct / 100) * 50000) : 0;
  const avgLoss = losses > 0 ? Math.abs((metrics.avgLossPct / 100) * 50000) : 0;
  const winLossSum = avgWin + avgLoss;
  const winBarPct = winLossSum > 0 ? (avgWin / winLossSum) * 100 : 50;

  // Real active trading sessions and day win rate calculation
  const dayStats = useMemo(() => {
    const executed = trades.filter((t) => t.isExecutedTrade && t.date);
    if (executed.length === 0) {
      return {
        dayWinPct: closedCount > 0 && metrics.winRate !== null ? Math.round(metrics.winRate) : null,
        activeDays: 0,
      };
    }
    const dayMap = new Map<string, number>();
    for (const t of executed) {
      const pnl =
        t.dollarPnl !== undefined && t.dollarPnl !== null
          ? t.dollarPnl
          : t.realizedR !== null && t.realizedR !== undefined
          ? t.realizedR * 500
          : 0;
      dayMap.set(t.date!, (dayMap.get(t.date!) || 0) + pnl);
    }
    const totalDays = dayMap.size;
    let greenDays = 0;
    for (const pnl of dayMap.values()) {
      if (pnl > 0) greenDays++;
    }
    const pct = totalDays > 0 ? Math.round((greenDays / totalDays) * 100) : 0;
    return { dayWinPct: pct, activeDays: totalDays };
  }, [trades, closedCount, metrics.winRate]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. Net P&L */}
      <Card className="h-full flex flex-col justify-between">
        <StatHeader
          title="Net P&L"
          icon={CircleDollarSign}
          hint="Realized profit and loss net of commissions and fees across all closed trades."
        />
        <CardContent>
          <div
            className={`text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums ${
              isNetPositive ? "text-profit" : "text-loss"
            }`}
          >
            {isNetPositive ? "+" : "-"}$
            {Math.abs(metrics.totalPnl).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {closedCount > 0 ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
                  weekDelta >= 0
                    ? "bg-profit/10 text-profit"
                    : "bg-loss/10 text-loss"
                }`}
              >
                {weekDelta >= 0 ? "▲" : "▼"} $
                {Math.abs(weekDelta).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}{" "}
                vs prior 7d
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                No closed trades
              </span>
            )}
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            {closedCount} closed trade{closedCount === 1 ? "" : "s"} · $0.00 fees
          </div>
        </CardContent>
      </Card>

      {/* 2. Trade win % */}
      <Card className="h-full flex flex-col justify-between">
        <StatHeader
          title="Trade win %"
          icon={Target}
          hint="Percentage of winning trades divided by all closed decided trades."
        />
        <CardContent className="flex items-center justify-between gap-2 pt-0">
          <Gauge value={closedCount > 0 ? metrics.winRate : null} label="Trade win rate" />
          <div className="space-y-0.5 text-xs tabular-nums text-muted-foreground">
            <div className="text-profit font-medium">{wins} W</div>
            <div className="text-muted-foreground">{breakEvens} BE</div>
            <div className="text-loss font-medium">{losses} L</div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Profit factor */}
      <Card className="h-full flex flex-col justify-between">
        <StatHeader
          title="Profit factor"
          icon={Scale}
          hint="Gross profit ÷ gross loss. Values above 1.0 indicate positive statistical edge."
        />
        <CardContent>
          <div className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {metrics.profitFactor === Infinity
              ? "∞"
              : metrics.profitFactor !== null
              ? metrics.profitFactor.toFixed(2)
              : "–"}
          </div>
          <div className="mt-1.5 text-xs text-muted-foreground">
            gross profit ÷ gross loss
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground/80 tabular-nums">
            Edge: {metrics.expectancy !== null ? `${metrics.expectancy >= 0 ? "+" : ""}${metrics.expectancy.toFixed(2)}R` : "–"}
          </div>
        </CardContent>
      </Card>

      {/* 4. Day win % */}
      <Card className="h-full flex flex-col justify-between">
        <StatHeader
          title="Day win %"
          icon={CalendarCheck2}
          hint="Profitable trading days divided by all recorded active trading sessions."
        />
        <CardContent className="flex items-center justify-between gap-2 pt-0">
          <Gauge value={dayStats.dayWinPct} label="Day win rate" />
          <div className="text-xs text-muted-foreground tabular-nums">
            <div>{dayStats.activeDays} active</div>
            <div className="text-[11px] text-muted-foreground/70">
              session{dayStats.activeDays === 1 ? "" : "s"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Avg win / loss */}
      <Card className="h-full flex flex-col justify-between col-span-2 md:col-span-1">
        <StatHeader
          title="Avg win / loss"
          icon={ArrowUpDown}
          hint="Average winning trade ÷ average losing trade. The bar shows win/loss ratio to scale."
        />
        <CardContent>
          <div className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {metrics.riskRewardRatio > 0
              ? metrics.riskRewardRatio.toFixed(2)
              : avgLoss > 0 && avgWin > 0
              ? (avgWin / avgLoss).toFixed(2)
              : "–"}
          </div>

          {/* Proportional visual bar */}
          <div
            className="mt-2 flex h-1.5 gap-0.5 rounded-full overflow-hidden bg-muted"
            role="img"
            aria-label="Average win vs average loss to scale"
          >
            {winLossSum > 0 ? (
              <>
                <span
                  className="bg-profit rounded-l-full"
                  style={{ width: `${winBarPct.toFixed(1)}%` }}
                />
                <span className="flex-1 bg-loss rounded-r-full" />
              </>
            ) : (
              <span className="w-full bg-muted" />
            )}
          </div>

          <div className="mt-2 text-xs text-muted-foreground tabular-nums flex items-center justify-between">
            {winLossSum > 0 ? (
              <>
                <span className="text-profit">+${avgWin.toFixed(0)} win</span>
                <span className="text-muted-foreground/60">·</span>
                <span className="text-loss">-${avgLoss.toFixed(0)} loss</span>
              </>
            ) : (
              <span className="text-muted-foreground">No decided trades</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
