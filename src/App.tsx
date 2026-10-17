import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar, DashboardTab } from './components/Sidebar';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { TopOverviewCharts } from './components/TopOverviewCharts';
import { KPISixCards } from './components/KPISixCards';
import { ExpectancyProfitFactorSection } from './components/ExpectancyProfitFactorSection';
import { ProfitLossSection } from './components/ProfitLossSection';
import { WinnersLosersSection } from './components/WinnersLosersSection';
import { PerformanceCalendarSection } from './components/PerformanceCalendarSection';
import { RecentTradesTable } from './components/RecentTradesTable';
import { TradeFrequencySection } from './components/TradeFrequencySection';
import { DrawdownSection } from './components/DrawdownSection';
import { BacktestSection } from './components/backtest/BacktestSection';
import { NotionConnectionModal } from './components/NotionConnectionModal';

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

  // 3. Compute Equity Curve
  const equityPoints = useMemo(() => {
    return generateEquityCurve(filteredTrades);
  }, [filteredTrades]);

  // 4. Generate Monthly and Daily distributions for Overview
  const monthlyPerfData = useMemo(() => {
    return generateBilateralMonthlyPerformance(filteredTrades);
  }, [filteredTrades]);

  const dailyPerfData = useMemo(() => {
    return generateDailyPerformance(filteredTrades);
  }, [filteredTrades]);

  const tradeFrequencyStats = useMemo(() => {
    return calculateTradeFrequency(filteredTrades);
  }, [filteredTrades]);

  const drawdownAnalytics = useMemo(() => {
    return calculateDrawdownAnalytics(filteredTrades, 50000);
  }, [filteredTrades]);

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex font-sans selection:bg-blue-500/30 selection:text-blue-200">
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

          {/* TAB 2: PROFIT & LOSS + WINNERS & LOSERS */}
          {activeTab === 'pnl' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <ProfitLossSection metrics={kpiMetrics} equityPoints={equityPoints} />
              <WinnersLosersSection metrics={kpiMetrics} />
            </div>
          )}

          {/* TAB 3: DRAW DOWN */}
          {activeTab === 'drawdown' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <DrawdownSection
                analytics={drawdownAnalytics}
                onNavigateTab={(tab) => setActiveTab(tab as DashboardTab)}
              />
            </div>
          )}

          {/* TAB 4: CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <PerformanceCalendarSection trades={filteredTrades} initialBalance={50000} />
            </div>
          )}

          {/* TAB 5: BACKTEST LAB */}
          {activeTab === 'backtest' && <BacktestSection />}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#1f242e] py-6 px-4 text-center text-xs text-slate-500 mt-12 bg-[#090b0f]">
          <div className="w-full max-w-[90%] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              Notion Trading Analytics • Built for NQ & ES Day Traders • Read-Only Notion API Integration
            </span>
            <span className="font-mono text-slate-600">
              Cloudflare Workers Static Assets • Edge Zero-Node Runtime
            </span>
          </div>
        </footer>
      </div>

      {/* Notion Connection & Diagnostics Modal */}
      <NotionConnectionModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        apiResponse={apiResponse}
        mode={mode}
      />
    </div>
  );
}

export default App;
