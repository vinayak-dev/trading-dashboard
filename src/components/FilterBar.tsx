import React, { useState } from 'react';
import {
  Filter,
  ChevronDown,
  Calendar,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  FilterState,
  TradePosition,
  TradeResult,
  RuleAdherence,
  TradeRecord
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

  // Extract unique tags present in current dataset
  const availableMistakes = Array.from(new Set(trades.flatMap(t => t.mistakes).filter(Boolean))) as string[];
  const availableSequences = Array.from(new Set(trades.map(t => t.sequence).filter(Boolean))) as string[];

  // Calculate active filter count
  let activeCount = 0;
  if (filters.dateRange !== 'all') activeCount++;
  if (filters.tickers.length > 0) activeCount += filters.tickers.length;
  if (filters.positions.length > 0) activeCount += filters.positions.length;
  if (filters.results.length > 0) activeCount += filters.results.length;
  if (filters.ruleAdherence.length > 0) activeCount += filters.ruleAdherence.length;
  if (filters.mistakes.length > 0) activeCount += filters.mistakes.length;
  if (filters.sequences.length > 0) activeCount += filters.sequences.length;
  if (filters.news.length > 0) activeCount += filters.news.length;

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
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let startDate: string | null = null;

    if (preset === '7d') {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split('T')[0];
    } else if (preset === '30d') {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString().split('T')[0];
    } else if (preset === '90d') {
      const d = new Date(today);
      d.setDate(d.getDate() - 90);
      startDate = d.toISOString().split('T')[0];
    } else if (preset === 'ytd') {
      startDate = `${today.getFullYear()}-01-01`;
    }

    onFilterChange({
      ...filters,
      dateRange: preset,
      startDate: preset === 'all' ? null : startDate,
      endDate: preset === 'all' ? null : todayStr,
    });
  };

  const toggleArrayFilter = <T extends string>(
    key: keyof FilterState,
    value: T
  ) => {
    const current = (filters[key] as T[]) || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];

    onFilterChange({
      ...filters,
      [key]: updated,
    });
  };

  return (
    <div className="bg-[#0f1422] border-b border-[#1b253b] px-4 lg:px-8 py-3 transition-all">
      <div className="w-full max-w-[90%] mx-auto flex flex-col gap-3">
        {/* Top Filter Controls: Date presets & quick toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Date Range Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Range:
            </span>
            {(['all', '7d', '30d', '90d', 'ytd'] as const).map(preset => (
              <button
                key={preset}
                onClick={() => handleDatePreset(preset)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  filters.dateRange === preset
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-[#151c2d] hover:bg-[#1c263d] text-slate-400 hover:text-slate-200 border border-[#1e2a44]'
                }`}
              >
                {preset.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Right Action: Expand/Collapse detailed filters & Clear */}
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-950/30 border border-rose-900/50 transition-colors"
                title="Reset all active filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ({activeCount})</span>
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium border transition-colors ${
                isExpanded || activeCount > 0
                  ? 'bg-[#182338] text-cyan-300 border-cyan-500/30'
                  : 'bg-[#141b2c] text-slate-300 border-[#202c46] hover:bg-[#192237]'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filters</span>
              {activeCount > 0 && (
                <span className="bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {activeCount}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Collapsible Detailed Filters Grid */}
        {isExpanded && (
          <div className="pt-3 border-t border-[#1a2338] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {/* Tickers */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Ticker
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['NQ', 'ES', 'YM'].map(ticker => {
                  const active = filters.tickers.includes(ticker);
                  return (
                    <button
                      key={ticker}
                      onClick={() => toggleArrayFilter('tickers', ticker)}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors font-mono ${
                        active
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold'
                          : 'bg-[#141c2c] border-[#1f2b42] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {ticker}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Position */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Position
              </span>
              <div className="flex gap-1.5">
                {(['Long', 'Short'] as TradePosition[]).map(pos => {
                  const active = filters.positions.includes(pos);
                  return (
                    <button
                      key={pos}
                      onClick={() => toggleArrayFilter('positions', pos)}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                        active
                          ? pos === 'Long'
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-semibold'
                            : 'bg-rose-600/20 border-rose-500 text-rose-300 font-semibold'
                          : 'bg-[#141c2c] border-[#1f2b42] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pos}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Result */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Result
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(['Win', 'Loss', 'Break Even', 'No Trade'] as TradeResult[]).map(res => {
                  const active = filters.results.includes(res);
                  return (
                    <button
                      key={res}
                      onClick={() => toggleArrayFilter('results', res)}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                        active
                          ? res === 'Win'
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                            : res === 'Loss'
                            ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                            : res === 'Break Even'
                            ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                            : 'bg-slate-600/20 border-slate-400 text-slate-200'
                          : 'bg-[#141c2c] border-[#1f2b42] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {res}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rule Adherence */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Rule Adherence
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(['Followed', 'Partially Followed', 'Broke Rules'] as RuleAdherence[]).map(adh => {
                  const active = filters.ruleAdherence.includes(adh);
                  return (
                    <button
                      key={adh}
                      onClick={() => toggleArrayFilter('ruleAdherence', adh)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        active
                          ? adh === 'Followed'
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                            : adh === 'Partially Followed'
                            ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                            : 'bg-rose-600/20 border-rose-500 text-rose-300'
                          : 'bg-[#141c2c] border-[#1f2b42] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {adh}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sequence Selection */}
            {availableSequences.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Sequence
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {availableSequences.map(seq => {
                    const active = filters.sequences.includes(seq);
                    return (
                      <button
                        key={seq}
                        onClick={() => toggleArrayFilter('sequences', seq)}
                        className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                          active
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-medium'
                            : 'bg-[#141c2c] border-[#1f2b42] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {seq}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mistakes Multi-Select */}
            {availableMistakes.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Mistake Tags ({availableMistakes.length} recorded)
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {availableMistakes.map(mistake => {
                    const active = filters.mistakes.includes(mistake);
                    return (
                      <button
                        key={mistake}
                        onClick={() => toggleArrayFilter('mistakes', mistake)}
                        className={`px-2 py-0.5 text-xs rounded border transition-colors flex items-center gap-1 ${
                          active
                            ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                            : 'bg-[#141c2c] border-[#1e2a44] text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-rose-400" />}
                        <span>{mistake}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
