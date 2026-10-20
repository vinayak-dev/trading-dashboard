import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Database,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  ArrowLeftRight,
  Sun,
  Moon
} from 'lucide-react';

export type DashboardTab = 'overview' | 'trades' | 'pnl' | 'drawdown' | 'calendar' | 'backtest';

interface NavItem {
  id: DashboardTab;
  label: string;
  sublabel: string;
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
  onSetTheme,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      sublabel: '',
      icon: LayoutDashboard,
    },
    {
      id: 'trades',
      label: 'Trades',
      sublabel: '',
      badge: totalRecords > 0 ? String(totalRecords) : undefined,
      icon: ArrowLeftRight,
    },
    {
      id: 'pnl',
      label: 'Profit & Loss',
      sublabel: '',
      icon: TrendingUp,
    },
    {
      id: 'drawdown',
      label: 'Draw Down',
      sublabel: '',
      icon: TrendingDown,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      sublabel: '',
      icon: CalendarDays,
    },
    {
      id: 'backtest',
      label: 'Backtest',
      sublabel: '',
      icon: FlaskConical,
    },
  ];

  const handleSelectTab = (tabId: DashboardTab) => {
    onTabChange(tabId);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0c0e14] border-r border-[#1f242e] select-none">
      {/* Top Brand Header */}
      <div className="p-4 border-b border-[#1f242e] flex items-center justify-between gap-3 min-h-[65px]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-[#131620] border border-[#232938] flex items-center justify-center p-1 shrink-0 shadow-sm shadow-purple-500/10">
            <img src="/logo.png" alt="Trading Analytics Logo" className="w-7 h-7 object-contain" />
          </div>
          {(!isCollapsed || isOpenMobile) && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold tracking-tight text-white truncate">
                Dashboard
              </h1>

            </div>
          )}
        </div>

        {/* Mobile close button */}
        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1f2c] transition-colors md:hidden"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto scrollbar-none">


        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              title={isCollapsed && !isOpenMobile ? `${item.label} (${item.sublabel})` : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all relative group ${isActive
                ? 'bg-[#1a1e27] text-white border border-[#2e3544] shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#151922] border border-transparent'
                } ${isCollapsed && !isOpenMobile ? 'justify-center px-2' : ''}`}
            >
              {/* Active Left Pill Indicator */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-slate-300 rounded-r-full" />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
              />

              {(!isCollapsed || isOpenMobile) && (
                <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                  <div className="truncate">
                    <div className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {item.sublabel}
                    </div>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-[#1e232e] text-slate-300 border border-[#2c3342] shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Status Card & Collapse Toggle */}
      <div className="p-3 border-t border-[#1f242e] space-y-2">
        {(!isCollapsed || isOpenMobile) ? (
          <div className="bg-[#12151d] border border-[#232938] rounded-xl p-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Dataset Mode</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${mode === 'live'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}
              >
                {mode === 'live' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Live
                  </>
                ) : (
                  <>
                    <Sparkles className="w-2.5 h-2.5" />
                    Demo
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#1d2230]">
              <span>Trades Analyzed</span>
              <span className="font-mono font-bold text-white">{totalRecords}</span>
            </div>

            {mode === 'live' && (
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#1d2230]">
                <span className="text-slate-400">Connection</span>
                {error ? (
                  <span className="flex items-center gap-1 text-rose-400 font-mono text-[10px]">
                    <AlertCircle className="w-3 h-3" />
                    Error
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-[#00c076]" />
                    {databaseId ? `${databaseId.slice(0, 6)}...` : 'Connected'}
                  </span>
                )}
              </div>
            )}

            {/* Theme Switcher */}
            <div className="pt-1.5 border-t border-[#1d2230]">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 px-0.5">
                <span>Theme</span>
                <span className="capitalize font-mono text-[10px] text-slate-400">{theme} mode</span>
              </div>
              <div className="bg-[#191d26] border border-[#2b313e] rounded-xl p-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSetTheme ? onSetTheme('dark') : onToggleTheme?.()}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                    theme === 'dark'
                      ? 'bg-[#12151d] text-white shadow-sm border border-[#3b4457]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Switch to Dark Mode"
                >
                  <Moon className="w-3.5 h-3.5 text-slate-300" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSetTheme ? onSetTheme('light') : onToggleTheme?.()}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                    theme === 'light'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Switch to Light Mode"
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>
              </div>
            </div>

            <button
              onClick={onOpenDiagnostics}
              className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#1a1f2b] hover:bg-[#242b3b] text-slate-300 hover:text-white border border-[#2e374a] text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Database className="w-3 h-3 text-slate-400" />
              <span>Notion Settings</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <button
              type="button"
              onClick={() => onToggleTheme ? onToggleTheme() : onSetTheme?.(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2 rounded-lg bg-[#151922] hover:bg-[#202636] text-slate-400 hover:text-white border border-[#232938] transition-colors"
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-slate-300" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>
            <button
              onClick={onOpenDiagnostics}
              title="Notion Settings & Schema"
              className="p-2 rounded-lg bg-[#151922] hover:bg-[#202636] text-slate-400 hover:text-white border border-[#232938] transition-colors"
            >
              <Database className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}

        {/* Desktop Collapse / Expand Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex w-full items-center justify-center gap-2 p-2 rounded-lg bg-[#12151d] hover:bg-[#1a1f2b] text-slate-400 hover:text-slate-200 border border-[#232938] text-xs transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px] font-medium">Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 transition-all duration-300 ease-in-out sticky top-0 h-screen z-30 ${isCollapsed ? 'w-[72px]' : 'w-64'
          }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 z-50 md:hidden transition-transform duration-300 ease-in-out shadow-2xl ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
