import React, { useState } from 'react';
import { TradeRecord } from '../types/trade';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

interface ActivityWidgetProps {
  trades: TradeRecord[];
  onSelectTrade?: (trade: TradeRecord) => void;
}

export const ActivityWidget: React.FC<ActivityWidgetProps> = ({
  trades,
}) => {
  const [tab, setTab] = useState<'recent' | 'flagged'>('recent');

  const executedTrades = trades.filter((t) => t.isExecutedTrade);
  const recentTrades = executedTrades.slice(0, 6);
  const flaggedTrades = executedTrades.filter((t) => (t.mistakes && t.mistakes.length > 0) || t.result === 'Loss').slice(0, 6);

  const displayList = tab === 'recent' ? recentTrades : flaggedTrades;

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Activity</CardTitle>
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setTab('recent')}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                tab === 'recent'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Recent trades
            </button>
            <button
              onClick={() => setTab('flagged')}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                tab === 'flagged'
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Review / Flagged
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-1.5 flex-1 overflow-y-auto max-h-[300px]">
        {displayList.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No recorded trades in this view.
          </div>
        ) : (
          displayList.map((t) => {
            const pnl =
              t.dollarPnl !== undefined && t.dollarPnl !== null
                ? t.dollarPnl
                : t.realizedR
                ? t.realizedR * 500
                : t.result === 'Win'
                ? 500
                : t.result === 'Loss'
                ? -500
                : 0;

            const isWin = t.result === 'Win' || pnl > 0;
            const isLoss = t.result === 'Loss' || pnl < 0;

            return (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors hover:bg-accent/60 border border-transparent hover:border-border"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isWin
                        ? 'bg-profit/15 text-profit'
                        : isLoss
                        ? 'bg-loss/15 text-loss'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {t.result ? t.result.toUpperCase() : 'TRADE'}
                  </span>
                  <span className="font-semibold text-foreground truncate">
                    {t.ticker || 'NQ'}
                  </span>
                  {t.position && (
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {t.position.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {t.date ? t.date.slice(5) : ''}
                  </span>
                  <span
                    className={`tabular-nums font-semibold text-xs ${
                      pnl > 0
                        ? 'text-profit'
                        : pnl < 0
                        ? 'text-loss'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {pnl >= 0 ? '+' : '-'}$
                    {Math.abs(pnl).toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
