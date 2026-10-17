import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Header,
  DashboardTab
} from './components/Header';
import { FilterBar } from './components/FilterBar';
import { TopOverviewCharts } from './components/TopOverviewCharts';
import { KPISixCards } from './components/KPISixCards';
import { ProfitLossSection } from './components/ProfitLossSection';
import { WinnersLosersSection } from './components/WinnersLosersSection';
import { PerformanceCalendarSection } from './components/PerformanceCalendarSection';
import { MonthlyMatrixSection } from './components/MonthlyMatrixSection';
import { RecentTradesTable } from './components/RecentTradesTable';
import { TradeFrequencySection } from './components/TradeFrequencySection';
import { DrawdownSection } from './components/DrawdownSection';

// Additional in-depth analytical sections
import { KPICards } from './components/KPICards';
import { EquityCurveChart } from './components/EquityCurveChart';
import { WinRateAnalysis } from './components/WinRateAnalysis';
import { TickerPerformance } from './components/TickerPerformance';
import { PositionPerformance } from './components/PositionPerformance';
import { RuleAdherenceSection } from './components/RuleAdherenceSection';
import { MistakeAnalysisSection } from './components/MistakeAnalysisSection';
import { SequenceSection } from './components/SequenceSection';
import { DayOfWeekSection } from './components/DayOfWeekSection';
import { NewsPerformanceSection } from './components/NewsPerformanceSection';
import { InsightsPanel } from './components/InsightsPanel';
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
  aggregateByCategory,
  aggregateByMistakes,
  aggregateByDayOfWeek,
  generateQuantitativeInsights,
  generateBilateralMonthlyPerformance,
  generateDailyPerformance,
  generateMonthlyMatrix,
  calculateTradeFrequency,
  calculateDrawdownAnalytics
} from './lib/calculations';
import { fetchTradesData } from './lib/api-client';
import { Database, Sparkles } from 'lucide-react';

export function App() {
  const [mode, setMode] = useState<'live' | 'demo'>('live');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
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
    news: [],
  });

  // Load trades on mount or mode switch
  const loadTrades = useCallback(async (selectedMode: 'live' | 'demo', forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    const response = await fetchTradesData({
      mode: selectedMode,
      forceRefresh,
    });

    setApiResponse(response);

    if (response.success) {
      setTrades(response.trades);
      setLastRefreshed(new Date(response.fetchedAt));
      setError(null);
    } else {
      setError(response.error || 'Failed to fetch trade data.');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadTrades(mode, false);
  }, [mode, loadTrades]);

  const handleRefresh = () => {
    loadTrades(mode, true);
  };

  const handleToggleMode = (newMode: 'live' | 'demo') => {
    setMode(newMode);
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

  // 4. Compute Ticker & Position stats
  const tickerStats = useMemo(() => {
    return aggregateByCategory(filteredTrades, (t) => t.ticker, ['NQ', 'ES', 'YM']);
  }, [filteredTrades]);

  const positionStats = useMemo(() => {
    return aggregateByCategory(filteredTrades, (t) => t.position, ['Long', 'Short']);
  }, [filteredTrades]);

  // 5. Compute Rule Adherence stats
  const ruleStats = useMemo(() => {
    return aggregateByCategory(filteredTrades, (t) => t.ruleAdherence, [
      'Followed',
      'Partially Followed',
      'Broke Rules',
    ]);
  }, [filteredTrades]);

  // 6. Compute Mistake stats
  const mistakeStats = useMemo(() => {
    return aggregateByMistakes(filteredTrades);
  }, [filteredTrades]);

  // 7. Compute Sequence & Day-of-week & News stats
  const sequenceStats = useMemo(() => {
    return aggregateByCategory(filteredTrades, (t) => t.sequence);
  }, [filteredTrades]);

  const weekdayStats = useMemo(() => {
    return aggregateByDayOfWeek(filteredTrades);
  }, [filteredTrades]);

  const newsStats = useMemo(() => {
    return aggregateByCategory(filteredTrades, (t) => t.news);
  }, [filteredTrades]);

  // 8. Generate statistical insights
  const insights = useMemo(() => {
    return generateQuantitativeInsights(filteredTrades);
  }, [filteredTrades]);

  // 9. Generate Monthly, Daily, and Matrix distributions matching TradeZella screenshots
  const monthlyPerfData = useMemo(() => {
    return generateBilateralMonthlyPerformance(filteredTrades);
  }, [filteredTrades]);

  const dailyPerfData = useMemo(() => {
    return generateDailyPerformance(filteredTrades);
  }, [filteredTrades]);

  const monthlyMatrixData = useMemo(() => {
    return generateMonthlyMatrix(filteredTrades);
  }, [filteredTrades]);

  const tradeFrequencyStats = useMemo(() => {
    return calculateTradeFrequency(filteredTrades);
  }, [filteredTrades]);

  const drawdownAnalytics = useMemo(() => {
    return calculateDrawdownAnalytics(filteredTrades, 50000);
  }, [filteredTrades]);

  // Check if live dataset is missing RR
  const isLiveMissingRR = mode === 'live' && !kpiMetrics.hasRealizedRData && trades.length > 0;

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Top Header with Tab Navigation */}
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
        onTabChange={setActiveTab}
      />

      {/* Global Filter Bar */}
      <FilterBar filters={filters} onFilterChange={setFilters} trades={trades} />

      {/* Main Dashboard Container - utilizes 90% full width */}
      <main className="w-full max-w-[90%] mx-auto px-2 sm:px-4 py-6 flex-1 space-y-6">
        {/* Notice for Live Notion data when RR is not yet entered */}
        {isLiveMissingRR && (
          <div className="bg-[#17141f] border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Database className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-100">
                  Live Notion Connected ({trades.length} records retrieved) • RR Property Unpopulated
                </p>
                <p className="text-slate-400 mt-0.5 leading-relaxed">
                  Your live Notion database has <strong>Date</strong> and <strong>Result</strong> entries, but the{' '}
                  <strong>RR</strong> property is currently blank. Win Rate, adherence, and record counts are actively
                  calculated. To see cumulative Realized R, Expectancy, and Equity Curve, enter numbers into the{' '}
                  <code>RR</code> column in Notion, or toggle to <strong>Demo Data</strong> to preview full analytics.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggleMode('demo')}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Switch to Demo Data</span>
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW (Image 1) */}
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

            {/* Average Trade Frequency Section matching TradeZella analytics (Trades / day, Trades / week, Trades / month) */}
            <TradeFrequencySection stats={tradeFrequencyStats} />

            {/* Bottom: Recent Trades Table matching Image 1 */}
            <RecentTradesTable trades={filteredTrades} />
          </div>
        )}

        {/* TAB 2: PROFIT & LOSS (Image 2) */}
        {activeTab === 'pnl' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ProfitLossSection metrics={kpiMetrics} equityPoints={equityPoints} />
          </div>
        )}

        {/* TAB 3: DRAWDOWN (Drawdown on Equity, MAE, Recovery) */}
        {activeTab === 'drawdown' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <DrawdownSection
              analytics={drawdownAnalytics}
              onNavigateTab={(tab) => setActiveTab(tab as DashboardTab)}
            />
          </div>
        )}

        {/* TAB 4: WINNERS & LOSERS (Image 3) */}
        {activeTab === 'winners-losers' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <WinnersLosersSection metrics={kpiMetrics} />
          </div>
        )}

        {/* TAB 4: CALENDAR (Image 5) */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <PerformanceCalendarSection trades={filteredTrades} initialBalance={50000} />
          </div>
        )}

        {/* TAB 5: MONTHLY MATRIX (Image 4) */}
        {activeTab === 'matrix' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <MonthlyMatrixSection matrixData={monthlyMatrixData} totalGainPct={kpiMetrics.accountGainPct} />
          </div>
        )}

        {/* TAB 6: ALL VIEWS (Comprehensive Full Analytics) */}
        {activeTab === 'all' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* 1. Overview Top 3 Charts */}
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">1. Overview Charts</h2>
              <TopOverviewCharts
                equityPoints={equityPoints}
                monthlyData={monthlyPerfData}
                dailyData={dailyPerfData}
              />
            </section>

            {/* 2. 6 KPI Cards */}
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">2. Performance KPIs</h2>
              <KPISixCards metrics={kpiMetrics} />
            </section>

            {/* 3. Trade Frequency Section */}
            <section className="space-y-3">
              <TradeFrequencySection stats={tradeFrequencyStats} />
            </section>

            {/* 4. Profit & Loss Interactive Curve */}
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">4. Profit & Loss Curve</h2>
              <ProfitLossSection metrics={kpiMetrics} equityPoints={equityPoints} />
            </section>

            {/* 5. Drawdown on Equity & MAE */}
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">5. Drawdown & MAE Analysis</h2>
              <DrawdownSection
                analytics={drawdownAnalytics}
                onNavigateTab={(tab) => setActiveTab(tab as DashboardTab)}
              />
            </section>

            {/* 6. Winners & Losers Analysis */}
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">6. Winners & Losers</h2>
              <WinnersLosersSection metrics={kpiMetrics} />
            </section>

            {/* 5. Performance Calendar */}
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">5. Performance Calendar</h2>
              <PerformanceCalendarSection trades={filteredTrades} initialBalance={50000} />
            </section>

            {/* 6. Monthly Matrix */}
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">6. Monthly Matrix</h2>
              <MonthlyMatrixSection matrixData={monthlyMatrixData} totalGainPct={kpiMetrics.accountGainPct} />
            </section>

            {/* 7. Quantitative Insights Panel */}
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">7. Quantitative Insights</h2>
              <InsightsPanel insights={insights} />
            </section>

            {/* 8. Full KPI Summary Cards & Equity Curve */}
            <section className="space-y-4">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">8. Detailed R Statistics</h2>
              <KPICards metrics={kpiMetrics} />
              <EquityCurveChart data={equityPoints} hasRealizedRData={kpiMetrics.hasRealizedRData} />
            </section>

            {/* 9. Win Rate & Planned RR Distribution */}
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">9. Win Rate & Planned RR</h2>
              <WinRateAnalysis trades={filteredTrades} metrics={kpiMetrics} />
            </section>

            {/* 10. Ticker & Position Breakdown */}
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">10. Ticker & Position Performance</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TickerPerformance stats={tickerStats} />
                <PositionPerformance stats={positionStats} />
              </div>
            </section>

            {/* 11. Rule Adherence & Sequence Analysis */}
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">11. Execution Discipline</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RuleAdherenceSection stats={ruleStats} />
                <SequenceSection stats={sequenceStats} />
              </div>
            </section>

            {/* 12. Mistake Analysis Table */}
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">12. Mistake Analysis</h2>
              <MistakeAnalysisSection stats={mistakeStats} />
            </section>

            {/* 13. Day of Week & News Performance */}
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">13. Timing & News Catalysts</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DayOfWeekSection stats={weekdayStats} />
                <NewsPerformanceSection stats={newsStats} />
              </div>
            </section>

            {/* 14. Recent Trades Table */}
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-wider font-bold text-slate-400">14. Journal Entries</h2>
              <RecentTradesTable trades={filteredTrades} />
            </section>
          </div>
        )}
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
