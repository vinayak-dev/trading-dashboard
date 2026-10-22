import React from 'react';
import {
  RefreshCw,
  Database,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Menu,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  FlaskConical,
  ArrowLeftRight,
  Sun,
  Moon
} from 'lucide-react';
import { FilterState } from '../types/trade';
import { DashboardTab } from './Sidebar';

export type { DashboardTab };

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
  onOpenMobileSidebar?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
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
  onOpenMobileSidebar,
  theme = 'dark',
  onToggleTheme,
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

  const getTabTitle = (tab: DashboardTab) => {
    switch (tab) {
      case 'overview':
        return { label: 'Overview', icon: LayoutDashboard };
      case 'trades':
        return { label: 'Trades Journal', icon: ArrowLeftRight };
      case 'pnl':
        return { label: 'Profit & Loss', icon: TrendingUp };
      case 'drawdown':
        return { label: 'Draw Down', icon: TrendingDown };
      case 'calendar':
        return { label: 'Calendar', icon: CalendarDays };
      case 'backtest':
        return { label: 'Backtest Lab', icon: FlaskConical };
    }
  };

  const currentTab = getTabTitle(activeTab);
  const CurrentIcon = currentTab.icon;

  return (
    <header className="border-b border-[#1f242e] bg-[#0c0e14]/95 backdrop-blur sticky top-0 z-20 px-4 lg:px-6 py-3 transition-colors shadow-lg">
      <div className="w-full mx-auto flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button + Current Active Section */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="p-2 rounded-lg bg-[#191d26] text-slate-300 hover:text-white border border-[#2b313e] md:hidden transition-colors"
              aria-label="Open Sidebar Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Mobile Logo Badge */}
          <div className="w-8 h-8 rounded-lg bg-[#131620] border border-[#232938] flex items-center justify-center p-1 shrink-0 shadow-sm md:hidden">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <CurrentIcon className="w-4 h-4 text-slate-300" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                {currentTab.label}
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#191d26] text-slate-300 border border-[#2b313e] hidden sm:inline-block">
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-300 font-medium">{getDateRangeLabel()}</span>
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1">
                <span className="text-slate-500">Trades:</span>
                <span className="text-white font-mono font-bold">{totalRecords}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: Mode Toggle, Refresh, Sync Status, Diagnostics */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
          {/* Live vs Demo Toggle */}
          <div className="bg-[#12141a] border border-[#1f242e] p-0.5 rounded-lg flex items-center shadow-inner">
            <button
              onClick={() => onToggleMode('live')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${mode === 'live'
                ? 'bg-[#1e232e] text-slate-200 border border-[#323b4c] shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${mode === 'live'
                  ? error
                    ? 'bg-rose-500 animate-pulse'
                    : 'bg-[#00c076] shadow-[0_0_8px_rgba(0,192,118,0.8)]'
                  : 'bg-slate-600'
                  }`}
              />
              <span className="hidden xs:inline">Live Notion</span>
              <span className="xs:hidden">Live</span>
            </button>
            <button
              onClick={() => onToggleMode('demo')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${mode === 'demo'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <span className={`w-2 h-2 rounded-full ${mode === 'demo' ? 'bg-amber-400' : 'bg-slate-600'}`} />
              <span className="hidden xs:inline">Demo Data</span>
              <span className="xs:hidden">Demo</span>
            </button>
          </div>

          {/* Connection Status Pill */}
          {mode === 'live' && (
            <div
              className={`hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border font-mono ${error
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
                  <span className="truncate max-w-[120px]">
                    {databaseId ? `DB: ${databaseId.slice(0, 8)}...` : 'Connected'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Sync Info */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-500 px-1">
            <span>Synced:</span>
            <span className="font-mono text-slate-300">{formatTime(lastRefreshed)}</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${isLoading
              ? 'bg-slate-800/60 text-slate-500 border-slate-700/40 cursor-not-allowed'
              : 'bg-[#191d26] hover:bg-[#252c3b] active:bg-[#2e374a] text-slate-200 border-[#2b313e] hover:border-slate-500/50 shadow-sm'
              }`}
            title="Fetch latest updates from Notion"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-slate-300' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{isLoading ? 'Fetching...' : 'Refresh'}</span>
          </button>

          {/* Setup / Diagnostic Info */}
          <button
            onClick={onOpenDiagnostics}
            className="p-1.5 rounded-lg bg-[#191d26] hover:bg-[#252c3b] text-slate-400 hover:text-white border border-[#2b313e] transition-colors"
            title="Notion Database Connection & Schema Details"
          >
            <Database className="w-4 h-4" />
          </button>

          {/* Dark / Light Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg bg-[#191d26] hover:bg-[#252c3b] text-slate-400 hover:text-white border border-[#2b313e] transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-slate-300" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
