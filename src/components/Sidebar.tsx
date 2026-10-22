import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  ListOrdered,
  BarChart3,
  TrendingDown,
  FlaskConical,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Zap,
} from 'lucide-react';

export type DashboardTab = 'overview' | 'trades' | 'pnl' | 'drawdown' | 'calendar' | 'backtest';

interface NavItem {
  id: DashboardTab;
  label: string;
  badge?: string;
  icon: React.FC<{ className?: string }>;
}

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalRecords: number;
  mode: 'live' | 'demo';
  error: string | null;
  databaseId?: string;
  onOpenDiagnostics: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onSetTheme?: (theme: 'dark' | 'light') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
  totalRecords,
  mode,
  error,
  databaseId,
  onOpenDiagnostics,
  theme = 'dark',
  onToggleTheme,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: CalendarDays,
    },
    {
      id: 'trades',
      label: 'Trades',
      badge: totalRecords > 0 ? String(totalRecords) : undefined,
      icon: ListOrdered,
    },
    {
      id: 'pnl',
      label: 'Reports & P&L',
      icon: BarChart3,
    },
    {
      id: 'drawdown',
      label: 'Draw Down',
      icon: TrendingDown,
    },
    {
      id: 'backtest',
      label: 'Backtest Lab',
      icon: FlaskConical,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-background border-r border-border transition-all duration-300 ease-in-out lg:static ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-[250px]'} w-[260px]`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* LuxAlgo / Journal style geometric emblem */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand via-brand/90 to-brand/70 flex items-center justify-center shrink-0 shadow-md shadow-brand/20">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0 truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-foreground">
                    Trade Journal
                  </span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-accent text-brand border border-brand/30">
                    NOTION
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  NQ &amp; ES Day Trading
                </div>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className={`px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70 ${isCollapsed ? 'hidden' : 'block'}`}>
            Analytics
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-accent text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-brand' : 'text-muted-foreground'
                  }`}
                />
                {!isCollapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="text-[10px] tabular-nums font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section: Mode, Diagnostics, Theme & Collapse */}
        <div className="p-3 border-t border-border space-y-2">
          {/* Notion Status / Diagnostics Card */}
          {!isCollapsed && (
            <button
              onClick={onOpenDiagnostics}
              className="w-full text-left p-2.5 rounded-xl bg-card border border-border hover:bg-muted transition-all group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {error ? (
                    <AlertCircle className="w-3.5 h-3.5 text-loss" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-profit" />
                  )}
                  <span className="text-[11px] font-medium text-foreground">
                    {mode === 'live' ? 'Notion Live' : 'Demo Dataset'}
                  </span>
                </div>
                <span className="text-[10px] text-brand group-hover:underline">
                  Settings
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground tabular-nums mt-1 truncate">
                {databaseId ? `DB: ${databaseId.slice(0, 8)}...` : `${totalRecords} entries cached`}
              </div>
            </button>
          )}

          {/* Quick Controls Row */}
          <div className="flex items-center justify-between gap-1 pt-1">
            {/* Theme Toggle */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-brand" />
                )}
              </button>
            )}

            {/* Collapse / Expand Button */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-auto"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
