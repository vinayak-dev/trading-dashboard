import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Sidebar, DashboardTab } from './components/Sidebar';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { TopOverviewCharts } from './components/TopOverviewCharts';
import { KPISixCards } from './components/KPISixCards';
import { ExpectancyProfitFactorSection } from './components/ExpectancyProfitFactorSection';
import { RecentTradesTable } from './components/RecentTradesTable';
import { TradeFrequencySection } from './components/TradeFrequencySection';
import { TradeOutcomesStreakSection } from './components/TradeOutcomesStreakSection';

// Code-split secondary tabs and modal to minimize initial bundle size and startup time
const ProfitLossSection = lazy(() => import('./components/ProfitLossSection').then(m => ({ default: m.ProfitLossSection })));
const WinnersLosersSection = lazy(() => import('./components/WinnersLosersSection').then(m => ({ default: m.WinnersLosersSection })));
const DrawdownSection = lazy(() => import('./components/DrawdownSection').then(m => ({ default: m.DrawdownSection })));
const PerformanceCalendarSection = lazy(() => import('./components/PerformanceCalendarSection').then(m => ({ default: m.PerformanceCalendarSection })));
const BacktestSection = lazy(() => import('./components/backtest/BacktestSection').then(m => ({ default: m.BacktestSection })));
const NotionConnectionModal = lazy(() => import('./components/NotionConnectionModal').then(m => ({ default: m.NotionConnectionModal })));

const TabLoadingFallback = () => (
  <div className="py-24 flex flex-col items-center justify-center space-y-3 text-slate-400">
    <div className="w-7 h-7 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-mono text-slate-500">Loading module...</span>
  </div>
);

import {
  TradeRecord,
  FilterState,
  NotionFetchResponse
} from './types/trade';
import {
  filterTrades,
  calculateKPIMetrics,
  generateEquityCurve,
  generateBilateralMonthlyPerformance,
  generateDailyPerformance,
  calculateTradeFrequency,
  calculateDrawdownAnalytics
} from './lib/calculations';
import { fetchTradesData } from './lib/api-client';

export function App() {
  const [mode, setMode] = useState<'live' | 'demo'>('live');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Theme state ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [apiResponse, setApiResponse] = useState<NotionFetchResponse | null>(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);

  // Global filters
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    startDate: null,
    endDate: null,
    tickers: [],
    positions: [],
    results: [],
    ruleAdherence: [],
    mistakes: [],
    sequences: [],
    news: []
  });

  // Fetch or load demo data
  const loadData = useCallback(async (selectedMode: 'live' | 'demo', forceRefresh: boolean = false) => {
    setIsLoading(true);
    try {
      const response = await fetchTradesData({ mode: selectedMode, forceRefresh });
      setApiResponse(response);
      setTrades(response.trades);
      setError(response.error || null);
      setLastRefreshed(new Date(response.fetchedAt));
    } catch (err: any) {
      console.error('Failed to load trades data:', err);
      setError(err?.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData(mode);
  }, [loadData, mode]);

  // Handle switching live / demo mode
  const handleToggleMode = (newMode: 'live' | 'demo') => {
    if (newMode !== mode) {
      setMode(newMode);
    }
  };

  // Manual refresh trigger
  const handleRefresh = () => {
    loadData(mode, true);
  };

  // 1. Filter trades according to active filter state
  const filteredTrades = useMemo(() => {
    return filterTrades(trades, filters);
  }, [trades, filters]);

  // 2. Compute KPI Metrics
  const kpiMetrics = useMemo(() => {
    return calculateKPIMetrics(filteredTrades);
  }, [filteredTrades]);

  // 3. Compute Equity Curve (only needed on overview and pnl)
  const equityPoints = useMemo(() => {
    if (activeTab !== 'overview' && activeTab !== 'pnl') return [];
    return generateEquityCurve(filteredTrades);
  }, [filteredTrades, activeTab]);

  // 4. Generate Monthly and Daily distributions for Overview
  const monthlyPerfData = useMemo(() => {
    if (activeTab !== 'overview') return [];
    return generateBilateralMonthlyPerformance(filteredTrades);
  }, [filteredTrades, activeTab]);

  const dailyPerfData = useMemo(() => {
    if (activeTab !== 'overview') return [];
    return generateDailyPerformance(filteredTrades);
  }, [filteredTrades, activeTab]);

  const tradeFrequencyStats = useMemo(() => {
    if (activeTab !== 'overview') {
      return {
        daily: { data: [], avg: 0 },
        weekly: { data: [], avg: 0 },
        monthly: { data: [], avg: 0 },
      };
    }
    return calculateTradeFrequency(filteredTrades);
  }, [filteredTrades, activeTab]);

  const drawdownAnalytics = useMemo(() => {
    if (activeTab !== 'drawdown') return null;
    return calculateDrawdownAnalytics(filteredTrades, 50000);
  }, [filteredTrades, activeTab]);

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex font-sans selection:bg-white/15 selection:text-slate-100">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        totalRecords={trades.length}
        mode={mode}
        error={error}
        databaseId={apiResponse?.databaseId}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSetTheme={setTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header with breadcrumb & actions */}
        <Header
          mode={mode}
          onToggleMode={handleToggleMode}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          lastRefreshed={lastRefreshed}
          error={error}
          totalRecords={trades.length}
          databaseId={apiResponse?.databaseId}
          filters={filters}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Global Filter Bar (Live/Demo Notion) */}
        {activeTab !== 'backtest' && (
          <FilterBar filters={filters} onFilterChange={setFilters} trades={trades} />
        )}

        {/* Main Dashboard Container */}
        <main className="w-full max-w-[95%] lg:max-w-[92%] xl:max-w-[90%] mx-auto px-2 sm:px-4 py-6 flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top 3 Charts: Equity mini spline, Monthly Performance bilateral bars, Daily Performance blue bars */}
              <TopOverviewCharts
                equityPoints={equityPoints}
                monthlyData={monthlyPerfData}
                dailyData={dailyPerfData}
              />

              {/* Middle Row: 6 KPI Cards (Total PnL, Win Rate, Risk/Reward, Month Gain, Week Gain, Daily Gain) */}
              <KPISixCards metrics={kpiMetrics} />

              {/* Current Streak */}
              <TradeOutcomesStreakSection
                trades={filteredTrades}
                metrics={kpiMetrics}
              />

              {/* Expectancy & Profit Factor Section */}
              <ExpectancyProfitFactorSection
                trades={filteredTrades}
                metrics={kpiMetrics}
              />

              {/* Average Trade Frequency Section */}
              <TradeFrequencySection stats={tradeFrequencyStats} />

              {/* Recent Trades Table */}
              <RecentTradesTable trades={filteredTrades} />
            </div>
          )}

          {/* TAB 2: TRADES (Only Trades Rows) */}
          {activeTab === 'trades' && (
            <div className="animate-in fade-in duration-200">
              <RecentTradesTable trades={filteredTrades} title="Trades" defaultPageSize={15} />
            </div>
          )}

          {/* TAB 3: PROFIT & LOSS + WINNERS & LOSERS */}
          {activeTab === 'pnl' && (
            <Suspense fallback={<TabLoadingFallback />}>
              <div className="space-y-6 animate-in fade-in duration-200">
                <ProfitLossSection metrics={kpiMetrics} equityPoints={equityPoints} />
                <WinnersLosersSection metrics={kpiMetrics} />
              </div>
            </Suspense>
          )}

          {/* TAB 4: DRAW DOWN */}
          {activeTab === 'drawdown' && drawdownAnalytics && (
            <Suspense fallback={<TabLoadingFallback />}>
              <div className="space-y-6 animate-in fade-in duration-200">
                <DrawdownSection
                  analytics={drawdownAnalytics}
                  onNavigateTab={(tab) => setActiveTab(tab as DashboardTab)}
                />
              </div>
            </Suspense>
          )}

          {/* TAB 5: CALENDAR */}
          {activeTab === 'calendar' && (
            <Suspense fallback={<TabLoadingFallback />}>
              <div className="space-y-6 animate-in fade-in duration-200">
                <PerformanceCalendarSection trades={filteredTrades} initialBalance={50000} />
              </div>
            </Suspense>
          )}

          {/* TAB 6: BACKTEST LAB */}
          {activeTab === 'backtest' && (
            <Suspense fallback={<TabLoadingFallback />}>
              <BacktestSection />
            </Suspense>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#1f242e] py-6 px-4 text-center text-xs text-slate-500 mt-12 bg-[#090b0f]">
          <div className="w-full max-w-[90%] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              Notion Trading Analytics • Built for NQ &amp; ES Day Traders • Read-Only Notion API Integration
            </span>
            <span className="font-mono text-slate-600">
              Cloudflare Workers Static Assets • Edge Zero-Node Runtime
            </span>
          </div>
        </footer>
      </div>

      {/* Notion Connection & Diagnostics Modal (Lazy Loaded only when opened) */}
      {isDiagnosticsOpen && (
        <Suspense fallback={null}>
          <NotionConnectionModal
            isOpen={isDiagnosticsOpen}
            onClose={() => setIsDiagnosticsOpen(false)}
            apiResponse={apiResponse}
            mode={mode}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
