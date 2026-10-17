import React from 'react';
import {
  RefreshCw,
  Database,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { FilterState } from '../types/trade';

interface HeaderProps {
  mode: 'live' | 'demo';
  onToggleMode: (newMode: 'live' | 'demo') => void;
  onRefresh: () => void;
  isLoading: boolean;
  lastRefreshed: Date | null;
  error: string | null;
  totalRecords: number;
  databaseId?: string;
  filters: FilterState;
  onOpenDiagnostics: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onToggleMode,
  onRefresh,
  isLoading,
  lastRefreshed,
  error,
  totalRecords,
  databaseId,
  filters,
  onOpenDiagnostics,
}) => {
  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getDateRangeLabel = () => {
    if (filters.dateRange === 'all') return 'All Historical Trades';
    if (filters.dateRange === '7d') return 'Past 7 Days';
    if (filters.dateRange === '30d') return 'Past 30 Days';
    if (filters.dateRange === '90d') return 'Past 90 Days';
    if (filters.dateRange === 'ytd') return 'Year to Date';
    if (filters.dateRange === 'custom') {
      return `${filters.startDate || 'Start'} to ${filters.endDate || 'End'}`;
    }
    return 'Custom Range';
  };

  return (
    <header className="border-b border-[#1b2438] bg-[#0c101a]/95 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3.5 transition-colors">
      <div className="w-full max-w-[90%] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Title & Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-950">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-100">
                Notion Trading Analytics
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 uppercase">
                NQ / ES Futures
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-300 font-medium">{getDateRangeLabel()}</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <span className="text-slate-500">Records:</span>
                <span className="text-slate-200 font-mono font-semibold">{totalRecords}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: Mode Toggle, Refresh, Diagnostics */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Live vs Demo Toggle */}
          <div className="bg-[#121826] border border-[#1e293f] p-0.5 rounded-lg flex items-center shadow-inner">
            <button
              onClick={() => onToggleMode('live')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                mode === 'live'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  mode === 'live'
                    ? error
                      ? 'bg-rose-500 animate-pulse'
                      : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-slate-600'
                }`}
              />
              Live Notion
            </button>
            <button
              onClick={() => onToggleMode('demo')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                mode === 'demo'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${mode === 'demo' ? 'bg-amber-400' : 'bg-slate-600'}`} />
              Demo Data
            </button>
          </div>

          {/* Connection Status Pill */}
          {mode === 'live' && (
            <div
              className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border font-mono ${
                error
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
              }`}
            >
              {error ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Connection Issue</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[130px]">
                    {databaseId ? `DB: ${databaseId.slice(0, 8)}...` : 'Connected'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isLoading
                ? 'bg-slate-800/60 text-slate-500 border-slate-700/40 cursor-not-allowed'
                : 'bg-[#151c2d] hover:bg-[#1a233a] active:bg-[#1f2b46] text-slate-200 border-[#22304d] hover:border-cyan-500/40 shadow-sm'
            }`}
            title="Fetch latest updates from Notion"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
            <span>{isLoading ? 'Fetching...' : 'Refresh'}</span>
          </button>

          {/* Setup / Diagnostic Info */}
          <button
            onClick={onOpenDiagnostics}
            className="p-1.5 rounded-lg bg-[#121826] hover:bg-[#1a233a] text-slate-400 hover:text-slate-200 border border-[#1e293f] transition-colors"
            title="Notion Database Connection & Schema Details"
          >
            <Database className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-bar for Last Updated timestamp and any active warning */}
      <div className="w-full max-w-[90%] mx-auto flex items-center justify-between text-[11px] text-slate-500 pt-2">
        <div className="flex items-center gap-2">
          <span>Last sync:</span>
          <span className="font-mono text-slate-400">{formatTime(lastRefreshed)}</span>
          {mode === 'demo' && (
            <span className="text-amber-400/90 font-medium">
              (Viewing synthetic demo dataset with simulated outcomes)
            </span>
          )}
        </div>

        {error && mode === 'live' && (
          <div className="text-rose-400 flex items-center gap-1 text-xs truncate max-w-md">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}
      </div>
    </header>
  );
};
