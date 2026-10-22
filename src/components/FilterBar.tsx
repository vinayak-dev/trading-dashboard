import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import {
  FilterState,
  TradePosition,
  TradeResult,
  RuleAdherence,
  TradeRecord,
} from '../types/trade';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  trades: TradeRecord[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  trades,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract unique values
  const availableSequences = Array.from(new Set(trades.map((t) => t.sequence).filter(Boolean))) as string[];
  const availableTickers = Array.from(new Set(trades.map((t) => t.ticker).filter(Boolean))) as string[];

  // Active filter count
  let activeCount = 0;
  if (filters.dateRange !== 'all') activeCount++;
  if (filters.tickers.length > 0) activeCount += filters.tickers.length;
  if (filters.positions.length > 0) activeCount += filters.positions.length;
  if (filters.results.length > 0) activeCount += filters.results.length;
  if (filters.ruleAdherence.length > 0) activeCount += filters.ruleAdherence.length;
  if (filters.mistakes.length > 0) activeCount += filters.mistakes.length;
  if (filters.sequences.length > 0) activeCount += filters.sequences.length;

  const handleReset = () => {
    onFilterChange({
      dateRange: 'all',
      startDate: null,
      endDate: null,
      tickers: [],
      positions: [],
      results: [],
      ruleAdherence: [],
      mistakes: [],
      sequences: [],
      news: [],
    });
  };

  const handleDatePreset = (preset: FilterState['dateRange']) => {
    onFilterChange({
      ...filters,
      dateRange: preset,
      startDate: null,
      endDate: null,
    });
  };

  const toggleArrayFilter = <K extends keyof FilterState>(
    key: K,
    val: FilterState[K] extends (infer U)[] ? U : never
  ) => {
    const currentList = (filters[key] as unknown as string[]) || [];
    const exists = currentList.includes(val as string);
    const updated = exists
      ? currentList.filter((item) => item !== val)
      : [...currentList, val];

    onFilterChange({
      ...filters,
      [key]: updated,
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-sm transition-all text-card-foreground">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left Side: Range Pills matching trade-journal */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-brand" />
            Range:
          </span>

          {(['all', '7d', '30d', '90d', 'ytd'] as const).map((r) => {
            const active = filters.dateRange === r;
            const label = r === 'all' ? 'All' : r.toUpperCase();
            return (
              <button
                key={r}
                type="button"
                onClick={() => handleDatePreset(r)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  active
                    ? 'bg-accent text-brand border border-brand/40 shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                }`}
              >
                {label}
              </button>
            );
          })}

          <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />

          {/* Quick Outcome Filter Pills */}
          {(['Win', 'Loss', 'Break Even'] as TradeResult[]).map((res) => {
            const active = filters.results.includes(res);
            return (
              <button
                key={res}
                type="button"
                onClick={() => toggleArrayFilter('results', res as any)}
                className={`px-2 py-0.5 text-xs rounded-lg font-medium transition-all ${
                  active
                    ? res === 'Win'
                      ? 'bg-profit/15 text-profit border border-profit/30 font-semibold'
                      : res === 'Loss'
                      ? 'bg-loss/15 text-loss border border-loss/30 font-semibold'
                      : 'bg-muted text-foreground border border-border font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                }`}
              >
                {res === 'Break Even' ? 'BE' : res}
              </button>
            );
          })}
        </div>

        {/* Right Side: Detailed Filter Drawer Toggle + Reset */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              activeCount > 0
                ? 'bg-accent text-brand border-brand/40 shadow-sm'
                : 'bg-muted/70 text-muted-foreground hover:text-foreground border-border'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {activeCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors border border-border"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Detailed Filters */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-in fade-in duration-150">
          {/* Tickers */}
          <div>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1.5">
              Instrument / Ticker
            </span>
            <div className="flex flex-wrap gap-1">
              {(availableTickers.length > 0 ? availableTickers : ['NQ', 'ES']).map((tick) => {
                const active = filters.tickers.includes(tick);
                return (
                  <button
                    key={tick}
                    onClick={() => toggleArrayFilter('tickers', tick as any)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                      active
                        ? 'bg-brand/15 text-brand border border-brand/40'
                        : 'bg-muted text-muted-foreground border border-border hover:text-foreground'
                    }`}
                  >
                    {tick}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direction */}
          <div>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1.5">
              Direction
            </span>
            <div className="flex gap-1.5">
              {(['Long', 'Short'] as TradePosition[]).map((pos) => {
                const active = filters.positions.includes(pos);
                return (
                  <button
                    key={pos}
                    onClick={() => toggleArrayFilter('positions', pos as any)}
                    className={`px-2.5 py-0.5 rounded text-xs font-medium transition-all ${
                      active
                        ? 'bg-brand/15 text-brand border border-brand/40'
                        : 'bg-muted text-muted-foreground border border-border hover:text-foreground'
                    }`}
                  >
                    {pos}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rule Adherence */}
          <div>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1.5">
              Rule Adherence
            </span>
            <div className="flex gap-1.5">
              {(['Followed', 'Broken'] as RuleAdherence[]).map((rule) => {
                const active = filters.ruleAdherence.includes(rule);
                return (
                  <button
                    key={rule}
                    onClick={() => toggleArrayFilter('ruleAdherence', rule as any)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                      active
                        ? rule === 'Followed'
                          ? 'bg-profit/15 text-profit border border-profit/40'
                          : 'bg-loss/15 text-loss border border-loss/40'
                        : 'bg-muted text-muted-foreground border border-border hover:text-foreground'
                    }`}
                  >
                    {rule}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sequences */}
          {availableSequences.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1.5">
                Setup Sequences
              </span>
              <div className="flex flex-wrap gap-1">
                {availableSequences.slice(0, 3).map((seq) => {
                  const active = filters.sequences.includes(seq);
                  return (
                    <button
                      key={seq}
                      onClick={() => toggleArrayFilter('sequences', seq as any)}
                      className={`px-2 py-0.5 rounded text-xs transition-all ${
                        active
                          ? 'bg-brand/15 text-brand border border-brand/40'
                          : 'bg-muted text-muted-foreground border border-border hover:text-foreground'
                      }`}
                    >
                      {seq}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
