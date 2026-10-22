import React from 'react';
import {
  RefreshCw,
  Menu,
  LayoutDashboard,
  TrendingDown,
  CalendarDays,
  FlaskConical,
  BarChart3,
  ListOrdered,
  Sun,
  Moon,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { FilterState } from '../types/trade';
import { DashboardTab } from './Sidebar';

interface HeaderProps {
  mode: 'live' | 'demo';
  onToggleMode: (newMode: 'live' | 'demo') => void;
  onRefresh: () => void;
  isLoading: boolean;
  lastRefreshed?: Date | null;
  error: string | null;
  totalRecords?: number;
  databaseId?: string;
  filters?: FilterState;
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
  error,
  onOpenDiagnostics,
  activeTab,
  onOpenMobileSidebar,
  theme = 'dark',
  onToggleTheme,
}) => {
  const getTabTitle = (tab: DashboardTab) => {
    switch (tab) {
      case 'overview':
        return { label: 'Dashboard', desc: 'Quantitative overview & trading performance', icon: LayoutDashboard };
      case 'trades':
        return { label: 'Trades Journal', desc: 'Closed trade history & execution logs', icon: ListOrdered };
      case 'pnl':
        return { label: 'Reports & P&L', desc: 'Profitability analysis & distribution metrics', icon: BarChart3 };
      case 'drawdown':
        return { label: 'Draw Down', desc: 'Peak-to-trough risk & drawdown recovery', icon: TrendingDown };
      case 'calendar':
        return { label: 'Calendar', desc: 'Daily sessions & P&L timeline view', icon: CalendarDays };
      case 'backtest':
        return { label: 'Backtest Lab', desc: 'CSV strategy validation & performance modeling', icon: FlaskConical };
    }
  };

  const currentTab = getTabTitle(activeTab);
  const CurrentIcon = currentTab.icon;

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3 transition-colors">
      <div className="w-full mx-auto flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button + Title */}
        <div className="flex items-center gap-3 min-w-0">
          {onOpenMobileSidebar && (
            <button
              onClick={onOpenMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 shadow-sm">
              <CurrentIcon className="w-4 h-4 text-brand" />
            </div>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate leading-tight">
                {currentTab.label}
              </h1>
              <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
                {currentTab.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Mode Switch, Sync, Diagnostics, Theme */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Live vs Demo Toggle matching trade-journal's segmented control */}
          <div className="flex items-center bg-card p-1 rounded-xl border border-border shadow-sm">
            <button
              onClick={() => onToggleMode('live')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                mode === 'live'
                  ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${mode === 'live' ? 'bg-profit' : 'bg-muted-foreground'}`} />
              <span>Live</span>
            </button>
            <button
              onClick={() => onToggleMode('demo')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                mode === 'demo'
                  ? 'bg-accent text-accent-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Demo</span>
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              isLoading
                ? 'bg-muted text-muted-foreground border-border cursor-not-allowed'
                : 'bg-card hover:bg-accent text-foreground border-border shadow-sm'
            }`}
            title="Fetch latest updates from Notion"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-brand ${isLoading ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">
              {isLoading ? 'Syncing...' : 'Sync Notion'}
            </span>
          </button>

          {/* Notion Connection Settings */}
          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-card hover:bg-accent text-muted-foreground hover:text-foreground border border-border transition-all shadow-sm"
            title="Notion API Connection & Diagnostics"
          >
            {error ? (
              <WifiOff className="w-3.5 h-3.5 text-loss" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-profit" />
            )}
            <span className="hidden md:inline">Notion</span>
          </button>

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground bg-card hover:bg-accent border border-border transition-colors shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-brand" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
