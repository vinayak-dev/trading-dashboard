import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  RotateCcw
} from 'lucide-react';
import { TradeRecord } from '../types/trade';

interface PerformanceCalendarSectionProps {
  trades: TradeRecord[];
  initialBalance?: number;
}

type MetricType = 'dollar' | 'percent' | 'r';
type BalanceType = 'initial' | 'current';
type ViewType = 'month' | 'year';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const PerformanceCalendarSection: React.FC<PerformanceCalendarSectionProps> = ({
  trades,
  initialBalance = 50000,
}) => {
  const [metric, setMetric] = useState<MetricType>('dollar');
  const [balanceRef, setBalanceRef] = useState<BalanceType>('initial');
  const [viewType, setViewType] = useState<ViewType>('month');

  // Real-world current date for defaults
  const now = new Date();
  const currentRealMonth = now.getMonth();
  const currentRealYear = now.getFullYear();
  const todayStr = `${currentRealYear}-${String(currentRealMonth + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Default to CURRENT MONTH and CURRENT YEAR
  const [currentMonth, setCurrentMonth] = useState<number>(currentRealMonth);
  const [currentYear, setCurrentYear] = useState<number>(currentRealYear);

  // Month & Year Popup states
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  const [selectedDayTrades, setSelectedDayTrades] = useState<{ date: string; trades: TradeRecord[] } | null>(null);

  // Extract available years from trades dataset and current year
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentRealYear);
    years.add(currentRealYear - 1);
    years.add(currentRealYear + 1);
    years.add(2024);
    years.add(2025);
    years.add(2026);
    trades.forEach((t) => {
      if (t.date) {
        const y = parseInt(t.date.split('-')[0], 10);
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [trades, currentRealYear]);

  // Group trades by date string "YYYY-MM-DD"
  const tradesByDate = useMemo(() => {
    const map = new Map<string, TradeRecord[]>();
    trades.forEach((t) => {
      if (!t.date) return;
      const existing = map.get(t.date) || [];
      existing.push(t);
      map.set(t.date, existing);
    });
    return map;
  }, [trades]);

  // Navigate month
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const prevYear = () => setCurrentYear(currentYear - 1);
  const nextYear = () => setCurrentYear(currentYear + 1);

  // Calendar days grid generation (Mon - Sun)
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        trades: tradesByDate.get(dateStr) || [],
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        trades: tradesByDate.get(dateStr) || [],
      });
    }

    // Next month padding to fill out complete 7-day grid rows (35 or 42 cells)
    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextDayNum = 1;
    const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
    while (days.length < totalCells) {
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(nextDayNum).padStart(2, '0')}`;
      days.push({
        dayNumber: nextDayNum,
        dateStr,
        isCurrentMonth: false,
        trades: tradesByDate.get(dateStr) || [],
      });
      nextDayNum++;
    }

    return days;
  }, [currentYear, currentMonth, tradesByDate]);

  // Aggregate stats for the current view month
  const monthStats = useMemo(() => {
    let totalPnl = 0;
    let totalR = 0;
    let tradeCount = 0;
    let winDays = 0;
    let lossDays = 0;

    calendarGrid.forEach((cell) => {
      if (cell.isCurrentMonth && cell.trades.length > 0) {
        tradeCount += cell.trades.length;
        const dayPnl = cell.trades.reduce(
          (sum, t) => sum + ((t.dollarPnl ?? t.pnlDollar) ?? (t.realizedR !== null ? t.realizedR * 500 : 0)),
          0
        );
        const dayR = cell.trades.reduce((sum, t) => sum + (t.realizedR ?? 0), 0);
        totalPnl += dayPnl;
        totalR += dayR;
        if (dayPnl > 0) winDays++;
        else if (dayPnl < 0) lossDays++;
      }
    });

    const percentReturn = (totalPnl / initialBalance) * 100;

    return { totalPnl, totalR, tradeCount, winDays, lossDays, percentReturn };
  }, [calendarGrid, initialBalance]);

  const formatValue = (dayTrades: TradeRecord[]) => {
    if (dayTrades.length === 0) return null;
    const pnl = dayTrades.reduce(
      (sum, t) => sum + ((t.dollarPnl ?? t.pnlDollar) ?? (t.realizedR !== null ? t.realizedR * 500 : 0)),
      0
    );
    const r = dayTrades.reduce((sum, t) => sum + (t.realizedR ?? 0), 0);

    if (metric === 'dollar') {
      const formatted = Math.abs(pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${pnl >= 0 ? '+$' : '-$'}${formatted}`;
    }
    if (metric === 'percent') {
      const pct = (pnl / initialBalance) * 100;
      return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
    }
    return `${r >= 0 ? '+' : ''}${r.toFixed(2)}R`;
  };

  return (
    <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-6 shadow-xl space-y-6 relative">
      {/* Invisible backdrop to dismiss popups on outside click */}
      {(isMonthPickerOpen || isYearPickerOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsMonthPickerOpen(false);
            setIsYearPickerOpen(false);
          }}
        />
      )}

      {/* Top Controls Toolbar matching Image 5 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1f242e]">
        {/* Left: Metric dropdown & Balance radio buttons */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Dropdown Selector */}
          <div className="relative">
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricType)}
              className="bg-[#191d26] border border-[#2b313e] hover:border-[#384152] text-slate-100 text-xs font-medium rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer shadow-sm"
            >
              <option value="dollar">Dollar Profit</option>
              <option value="percent">Percentage Profit</option>
              <option value="r">R Multiple</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </div>
          </div>

          {/* Radio Buttons for Initial vs Current Balance */}
          <div className="flex items-center gap-4 text-xs text-slate-300">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="balanceRef"
                checked={balanceRef === 'initial'}
                onChange={() => setBalanceRef('initial')}
                className="w-3.5 h-3.5 text-blue-600 bg-[#191d26] border-[#2b313e] focus:ring-blue-500 focus:ring-offset-0"
              />
              <span className={balanceRef === 'initial' ? 'text-white font-medium' : 'text-slate-400'}>
                Initial Balance
              </span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="balanceRef"
                checked={balanceRef === 'current'}
                onChange={() => setBalanceRef('current')}
                className="w-3.5 h-3.5 text-blue-600 bg-[#191d26] border-[#2b313e] focus:ring-blue-500 focus:ring-offset-0"
              />
              <span className={balanceRef === 'current' ? 'text-white font-medium' : 'text-slate-400'}>
                Current Balance
              </span>
            </label>
          </div>
        </div>

        {/* Center: Month & Year Navigator with Clickable Popups */}
        <div className="flex items-center justify-center gap-2.5">
          {/* Month Stepper with clickable popup */}
          <div className="relative">
            <div className="flex items-center gap-1 bg-[#191d26] border border-[#2b313e] rounded-lg px-2 py-1">
              <button
                onClick={prevMonth}
                className="p-1 hover:text-white text-slate-400 hover:bg-[#252c3b] rounded transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setIsMonthPickerOpen(!isMonthPickerOpen);
                  setIsYearPickerOpen(false);
                }}
                className="text-xs font-semibold text-slate-100 hover:text-blue-400 px-2 min-w-[90px] text-center hover:bg-[#252c3b] rounded py-0.5 transition-colors flex items-center justify-center gap-1"
                title="Click to view all months"
              >
                <span>{MONTH_NAMES[currentMonth]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <button
                onClick={nextMonth}
                className="p-1 hover:text-white text-slate-400 hover:bg-[#252c3b] rounded transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Month Popup Grid Modal */}
            {isMonthPickerOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-[#161a23] border border-[#2b313e] rounded-xl p-3 shadow-2xl w-64 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#232938]">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Select Month
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">12 Months</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTH_NAMES.map((name, idx) => {
                    const isSelected = idx === currentMonth;
                    const isCurrentReal = idx === currentRealMonth && currentYear === currentRealYear;
                    return (
                      <button
                        key={name}
                        onClick={() => {
                          setCurrentMonth(idx);
                          setIsMonthPickerOpen(false);
                        }}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all text-center relative ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/40'
                            : 'text-slate-300 hover:bg-[#222a3a] hover:text-white'
                        }`}
                      >
                        <span>{name.slice(0, 3)}</span>
                        {isCurrentReal && !isSelected && (
                          <span className="absolute bottom-0.5 right-1 w-1.5 h-1.5 rounded-full bg-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Year Stepper with clickable popup */}
          <div className="relative">
            <div className="flex items-center gap-1 bg-[#191d26] border border-[#2b313e] rounded-lg px-2 py-1">
              <button
                onClick={prevYear}
                className="p-1 hover:text-white text-slate-400 hover:bg-[#252c3b] rounded transition-colors"
                title="Previous Year"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setIsYearPickerOpen(!isYearPickerOpen);
                  setIsMonthPickerOpen(false);
                }}
                className="text-xs font-semibold text-slate-100 hover:text-blue-400 px-2 min-w-[55px] text-center hover:bg-[#252c3b] rounded py-0.5 transition-colors flex items-center justify-center gap-1"
                title="Click to view all years"
              >
                <span>{currentYear}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <button
                onClick={nextYear}
                className="p-1 hover:text-white text-slate-400 hover:bg-[#252c3b] rounded transition-colors"
                title="Next Year"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Year Popup Grid Modal */}
            {isYearPickerOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-[#161a23] border border-[#2b313e] rounded-xl p-3 shadow-2xl w-56 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#232938]">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Select Year
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Years</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                  {availableYears.map((year) => {
                    const isSelected = year === currentYear;
                    const isCurrentReal = year === currentRealYear;
                    return (
                      <button
                        key={year}
                        onClick={() => {
                          setCurrentYear(year);
                          setIsYearPickerOpen(false);
                        }}
                        className={`px-2 py-2 rounded-lg text-xs font-medium transition-all text-center relative ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/40'
                            : 'text-slate-300 hover:bg-[#222a3a] hover:text-white'
                        }`}
                      >
                        <span>{year}</span>
                        {isCurrentReal && !isSelected && (
                          <span className="absolute bottom-0.5 right-1 w-1.5 h-1.5 rounded-full bg-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick jump to Current Month */}
          <button
            onClick={() => {
              setCurrentMonth(currentRealMonth);
              setCurrentYear(currentRealYear);
              setIsMonthPickerOpen(false);
              setIsYearPickerOpen(false);
            }}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 ${
              currentMonth === currentRealMonth && currentYear === currentRealYear
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-sm'
                : 'bg-[#191d26] text-slate-400 hover:text-white border-[#2b313e] hover:bg-[#252c3b]'
            }`}
            title="Jump to Current Month (Today)"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Today</span>
          </button>
        </div>

        {/* Right: Month / Year view tabs */}
        <div className="flex items-center self-end lg:self-auto bg-[#191d26] border border-[#2b313e] rounded-lg p-0.5">
          <button
            onClick={() => setViewType('month')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewType === 'month'
                ? 'bg-[#252c3b] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewType('year')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewType === 'year'
                ? 'bg-[#252c3b] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-400 pb-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* 7-column Date Cells Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarGrid.map((cell, idx) => {
            const hasTrades = cell.trades.length > 0;
            const dayPnl = cell.trades.reduce(
              (sum, t) => sum + ((t.dollarPnl ?? t.pnlDollar) ?? (t.realizedR !== null ? t.realizedR * 500 : 0)),
              0
            );
            const isProfit = dayPnl > 0;
            const isLoss = dayPnl < 0;
            const displayVal = formatValue(cell.trades);
            const isToday = cell.dateStr === todayStr;

            // Styling based on active trade outcome, month state, and today
            let bgClass = 'bg-[#12141a]/50 border-[#1f242e] text-slate-500';
            let hoverClass = 'hover:border-slate-600';

            if (!cell.isCurrentMonth) {
              bgClass = 'bg-[#0e1015]/40 border-[#171a22] opacity-35 text-slate-600';
            } else if (hasTrades) {
              if (isProfit) {
                bgClass = 'bg-[#0d2218] border-[#1b432e] text-emerald-300 shadow-sm shadow-emerald-950/20';
                hoverClass = 'hover:border-emerald-500 cursor-pointer';
              } else if (isLoss) {
                bgClass = 'bg-[#241014] border-[#481c22] text-rose-300 shadow-sm shadow-rose-950/20';
                hoverClass = 'hover:border-rose-500 cursor-pointer';
              } else {
                bgClass = 'bg-[#191d26] border-[#2b313e] text-slate-300';
                hoverClass = 'hover:border-slate-500 cursor-pointer';
              }
            } else if (isToday) {
              bgClass = 'bg-[#131b2c]/80 border-blue-500/50 shadow-sm shadow-blue-950/20';
            }

            return (
              <div
                key={idx}
                onClick={() => {
                  if (hasTrades) {
                    setSelectedDayTrades({ date: cell.dateStr, trades: cell.trades });
                  }
                }}
                className={`relative min-h-[90px] sm:min-h-[104px] p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between transition-all ${bgClass} ${hoverClass} ${
                  isToday ? 'ring-1 ring-blue-500/50' : ''
                }`}
              >
                {/* Top Row: Trade count or Today badge on left, Day number on right */}
                <div className="flex items-center justify-between text-[11px]">
                  {isToday ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40">
                      Today
                    </span>
                  ) : hasTrades && cell.isCurrentMonth ? (
                    <span className="text-[10px] font-medium text-slate-400">
                      {cell.trades.length} {cell.trades.length === 1 ? 'Trade' : 'Trades'}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span
                    className={`font-semibold ${
                      isToday
                        ? 'text-blue-400 font-bold'
                        : cell.isCurrentMonth
                        ? hasTrades
                          ? 'text-white'
                          : 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                </div>

                {/* Bottom Row: Profit / Loss amount */}
                <div className="mt-auto pt-2">
                  {displayVal && cell.isCurrentMonth ? (
                    <div
                      className={`text-sm sm:text-base font-bold font-mono tracking-tight ${
                        isProfit ? 'text-[#00c076]' : isLoss ? 'text-[#ff4d4d]' : 'text-slate-300'
                      }`}
                    >
                      {displayVal}
                    </div>
                  ) : (
                    <div className="h-5" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Bar for Active Month */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#1f242e] text-xs">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-slate-400">Month P&L: </span>
            <span
              className={`font-mono font-bold ${
                monthStats.totalPnl >= 0 ? 'text-[#00c076]' : 'text-[#ff4d4d]'
              }`}
            >
              {monthStats.totalPnl >= 0 ? '+$' : '-$'}
              {Math.abs(monthStats.totalPnl).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span
              className={`ml-1 text-[11px] font-medium ${
                monthStats.percentReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ({monthStats.percentReturn >= 0 ? '+' : ''}
              {monthStats.percentReturn.toFixed(2)}%)
            </span>
          </div>

          <div>
            <span className="text-slate-400">Total Trades: </span>
            <span className="font-semibold text-white">{monthStats.tradeCount}</span>
          </div>

          <div>
            <span className="text-slate-400">Days: </span>
            <span className="text-[#00c076] font-semibold">{monthStats.winDays}W</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-[#ff4d4d] font-semibold">{monthStats.lossDays}L</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 italic">
          Click month or year to choose from all dates • Click active days for trade breakdown
        </div>
      </div>

      {/* Selected Day Modal / Popover */}
      {selectedDayTrades && (
        <div className="p-4 bg-[#161a23] border border-[#283040] rounded-xl animate-in fade-in space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#242b3a]">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-semibold text-white">
                Trades for {selectedDayTrades.date} ({selectedDayTrades.trades.length})
              </h4>
            </div>
            <button
              onClick={() => setSelectedDayTrades(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-[#202635] transition-colors"
            >
              Close
            </button>
          </div>

          <div className="space-y-2">
            {selectedDayTrades.trades.map((t) => {
              const pnl = (t.dollarPnl ?? t.pnlDollar) ?? (t.realizedR !== null ? t.realizedR * 500 : 0);
              const isWin = pnl >= 0;
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#11141c] border border-[#1f2533] text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                        t.position === 'Long'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {t.position || 'Trade'}
                    </span>
                    <span className="font-semibold text-white">{t.title}</span>
                    {t.ticker && (
                      <span className="text-slate-400 font-mono text-[11px]">[{t.ticker}]</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 font-mono">
                    {t.realizedR !== null && (
                      <span className="text-slate-400 text-[11px]">
                        {t.realizedR >= 0 ? '+' : ''}
                        {t.realizedR.toFixed(2)}R
                      </span>
                    )}
                    <span className={`font-bold ${isWin ? 'text-[#00c076]' : 'text-[#ff4d4d]'}`}>
                      {pnl >= 0 ? '+$' : '-$'}
                      {Math.abs(pnl).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
