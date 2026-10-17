import React from 'react';
import {
  RefreshCw,
  Database,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Scale,
  CalendarDays,
  Grid3X3
} from 'lucide-react';
import { FilterState } from '../types/trade';

export type DashboardTab = 'overview' | 'pnl' | 'drawdown' | 'winners-losers' | 'calendar' | 'matrix' | 'all';

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
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
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
  activeTab,
  onTabChange,
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

  const navTabs: { id: DashboardTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'pnl', label: 'Profit & Loss', icon: TrendingUp },
    { id: 'drawdown', label: 'Drawdown', icon: TrendingDown },
    { id: 'winners-losers', label: 'Winners & Losers', icon: Scale },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'matrix', label: 'Monthly Matrix', icon: Grid3X3 },
    { id: 'all', label: 'All Views', icon: Layers },
  ];

  return (
    <header className="border-b border-[#1f242e] bg-[#0c0e14]/95 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors shadow-lg">
      <div className="w-full max-w-[90%] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Title & Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#191d26] border border-[#2b313e] flex items-center justify-center text-blue-500 shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Notion Trading Analytics
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#191d26] text-slate-300 border border-[#2b313e] uppercase font-semibold">
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
                <span className="text-slate-500">Trades:</span>
                <span className="text-white font-mono font-bold">{totalRecords}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: Mode Toggle, Refresh, Diagnostics */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Live vs Demo Toggle */}
          <div className="bg-[#12141a] border border-[#1f242e] p-0.5 rounded-lg flex items-center shadow-inner">
            <button
              onClick={() => onToggleMode('live')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                mode === 'live'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  mode === 'live'
                    ? error
                      ? 'bg-rose-500 animate-pulse'
                      : 'bg-[#00c076] shadow-[0_0_8px_rgba(0,192,118,0.8)]'
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
                  ? 'bg-[#241014] border-[#481c22] text-rose-300'
                  : 'bg-[#0d2218] border-[#1b432e] text-emerald-300'
              }`}
            >
              {error ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Connection Issue</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00c076] shrink-0" />
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
                : 'bg-[#191d26] hover:bg-[#252c3b] active:bg-[#2e374a] text-slate-200 border-[#2b313e] hover:border-blue-500/50 shadow-sm'
            }`}
            title="Fetch latest updates from Notion"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
            <span>{isLoading ? 'Fetching...' : 'Refresh'}</span>
          </button>

          {/* Setup / Diagnostic Info */}
          <button
            onClick={onOpenDiagnostics}
            className="p-1.5 rounded-lg bg-[#191d26] hover:bg-[#252c3b] text-slate-400 hover:text-white border border-[#2b313e] transition-colors"
            title="Notion Database Connection & Schema Details"
          >
            <Database className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar matching Dashboard Sections */}
      <div className="w-full max-w-[90%] mx-auto mt-3 pt-2.5 border-t border-[#1f242e] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#252c3b] text-white border border-[#384257] shadow-sm'
                    : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-[#191d26]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sync Info */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>Synced:</span>
          <span className="font-mono text-slate-300">{formatTime(lastRefreshed)}</span>
          {mode === 'demo' && (
            <span className="text-amber-400/90 font-medium hidden sm:inline">
              (Demo Mode)
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
