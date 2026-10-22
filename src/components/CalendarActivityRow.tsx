import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { ActivityWidget } from './ActivityWidget';
import { TradeRecord } from '../types/trade';

interface CalendarActivityRowProps {
  trades: TradeRecord[];
  onNavigateCalendar?: () => void;
}

export const CalendarActivityRow: React.FC<CalendarActivityRowProps> = ({
  trades,
  onNavigateCalendar,
}) => {
  // Compute monthly calendar data
  const calendarData = useMemo(() => {
    const executed = trades.filter((t) => t.isExecutedTrade && t.date);
    if (executed.length === 0) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      const totalDays = new Date(year, month, 0).getDate();
      const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
      const days = [];
      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({ dayNumber: null, pnl: 0, count: 0, isTraded: false });
      }
      for (let d = 1; d <= totalDays; d++) {
        days.push({
          dayNumber: d,
          date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          pnl: 0,
          count: 0,
          isTraded: false,
        });
      }
      return { days, monthName, totalPnl: 0 };
    }

    // Group P&L by day
    const dayMap = new Map<string, { pnl: number; count: number }>();
    let total = 0;
    for (const t of executed) {
      const date = t.date!;
      const val =
        t.dollarPnl !== undefined && t.dollarPnl !== null
          ? t.dollarPnl
          : t.realizedR !== null && t.realizedR !== undefined
          ? t.realizedR * 500
          : 0;
      const prev = dayMap.get(date) || { pnl: 0, count: 0 };
      dayMap.set(date, { pnl: prev.pnl + val, count: prev.count + 1 });
      total += val;
    }

    // Determine current month from trades (use the latest trade date)
    const sortedDates = [...executed].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const latestDate = sortedDates[0]?.date || '2026-10-01';
    const year = parseInt(latestDate.slice(0, 4), 10) || 2026;
    const month = parseInt(latestDate.slice(5, 7), 10) || 10;
    const dateObj = new Date(year, month - 1, 1);
    const monthName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Days in month
    const totalDays = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 is Sunday

    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ dayNumber: null, pnl: 0, count: 0, isTraded: false });
    }
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const entry = dayMap.get(dateStr);
      days.push({
        dayNumber: d,
        date: dateStr,
        pnl: entry ? entry.pnl : 0,
        count: entry ? entry.count : 0,
        isTraded: !!entry,
      });
    }

    return { days, monthName, totalPnl: total };
  }, [trades]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* Calendar Widget (2 Cols on lg) */}
      <Card className="lg:col-span-2 h-full flex flex-col justify-between">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <CardTitle>{calendarData.monthName}</CardTitle>
            <span
              className={`text-xs tabular-nums font-semibold px-2 py-0.5 rounded-full ${
                calendarData.totalPnl >= 0
                  ? 'bg-profit/10 text-profit'
                  : 'bg-loss/10 text-loss'
              }`}
            >
              {calendarData.totalPnl >= 0 ? '+' : '-'}$
              {Math.abs(calendarData.totalPnl).toLocaleString('en-US', {
                minimumFractionDigits: 0,
              })}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onNavigateCalendar}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors mr-2"
            >
              Full calendar
            </button>
            <div className="flex items-center gap-1">
              <span className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
                <ChevronLeft className="w-3.5 h-3.5" />
              </span>
              <span className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-center">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-[11px] font-semibold text-muted-foreground text-center mb-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarData.days.map((item, index) => {
              if (item.dayNumber === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="h-12 rounded-lg bg-transparent"
                  />
                );
              }

              const isGreen = item.isTraded && item.pnl > 0;
              const isRed = item.isTraded && item.pnl < 0;
              const isBe = item.isTraded && item.pnl === 0;

              return (
                <div
                  key={`day-${item.dayNumber}`}
                  className={`h-12 rounded-lg p-1.5 flex flex-col justify-between border transition-all ${
                    isGreen
                      ? 'bg-profit/10 border-profit/30 hover:border-profit/60'
                      : isRed
                      ? 'bg-loss/10 border-loss/30 hover:border-loss/60'
                      : isBe
                      ? 'bg-muted border-border'
                      : 'bg-muted/30 border-border hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{item.dayNumber}</span>
                    {item.count > 0 && (
                      <span className="text-[9px] tabular-nums text-muted-foreground/80">
                        {item.count}t
                      </span>
                    )}
                  </div>

                  {item.isTraded && (
                    <div
                      className={`text-[11px] font-bold tabular-nums text-right truncate ${
                        isGreen
                          ? 'text-profit'
                          : isRed
                          ? 'text-loss'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item.pnl >= 0 ? '+' : '-'}$
                      {Math.abs(item.pnl).toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activity Widget (1 Col on lg) */}
      <div className="lg:col-span-1">
        <ActivityWidget trades={trades} />
      </div>
    </div>
  );
};
