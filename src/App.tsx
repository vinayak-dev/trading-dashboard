import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Header
} from './components/Header';
import { FilterBar } from './components/FilterBar';
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
import { RecentTradesTable } from './components/RecentTradesTable';
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
  generateQuantitativeInsights
} from './lib/calculations';
import { fetchTradesData } from './lib/api-client';
import { Database, Sparkles } from 'lucide-react';

export function App() {
  const [mode, setMode] = useState<'live' | 'demo'>('live');
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
      // If live mode failed on initial load, show error but don't blow up
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
    return aggregateByCategory(filteredTrades, t => t.ticker, ['NQ', 'ES', 'YM']);
  }, [filteredTrades]);

  const positionStats = useMemo(() => {
    return aggregateByCategory(filteredTrades, t => t.position, ['Long', 'Short']);
  }, [filteredTrades]);

  // 5. Compute Rule Adherence stats
  const ruleStats = useMemo(() => {
    return aggregateByCategory(filteredTrades, t => t.ruleAdherence, [
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
    return aggregateByCategory(filteredTrades, t => t.sequence);
  }, [filteredTrades]);

  const weekdayStats = useMemo(() => {
    return aggregateByDayOfWeek(filteredTrades);
  }, [filteredTrades]);

  const newsStats = useMemo(() => {
    return aggregateByCategory(filteredTrades, t => t.news);
  }, [filteredTrades]);

  // 8. Generate statistical insights
  const insights = useMemo(() => {
    return generateQuantitativeInsights(filteredTrades);
  }, [filteredTrades]);

  // Check if live dataset is missing RR
  const isLiveMissingRR = mode === 'live' && !kpiMetrics.hasRealizedRData && trades.length > 0;

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
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
      />

      {/* Global Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        trades={trades}
      />

      {/* Main Dashboard Container */}
      <main className="w-full max-w-[90%] mx-auto px-2 sm:px-4 py-6 flex-1 space-y-6">
        {/* Notice for Live Notion data when RR is not yet entered */}
        {isLiveMissingRR && (
          <div className="bg-[#17141f] border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Database className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-100">
                  Live Notion Connected ({trades.length} records retrieved) • RR Property Unpopulated
                </p>
                <p className="text-slate-400 mt-0.5 leading-relaxed">
                  Your live Notion database has <strong>Date</strong> and <strong>Result</strong> entries, but the <strong>RR</strong> property is currently blank. Win Rate, adherence, and record counts are actively calculated. To see cumulative Realized R, Expectancy, and Equity Curve, enter numbers into the <code>RR</code> column in Notion, or toggle to <strong>Demo Data</strong> to preview full analytics.
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

        {/* 1. KPI Cards */}
        <KPICards metrics={kpiMetrics} />

        {/* 2. Statistical Insights Panel */}
        <InsightsPanel insights={insights} />

        {/* 3. Equity Curve (Cumulative Realized R & Drawdown) */}
        <EquityCurveChart
          data={equityPoints}
          hasRealizedRData={kpiMetrics.hasRealizedRData}
        />

        {/* 4. Win Rate & Planned RR Distribution */}
        <WinRateAnalysis trades={filteredTrades} metrics={kpiMetrics} />

        {/* 5. Ticker Performance (NQ vs ES) & Position Performance (Long vs Short) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TickerPerformance stats={tickerStats} />
          <PositionPerformance stats={positionStats} />
        </div>

        {/* 6. Rule Adherence & Setup Sequence Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RuleAdherenceSection stats={ruleStats} />
          <SequenceSection stats={sequenceStats} />
        </div>

        {/* 7. Mistake Analysis Table */}
        <MistakeAnalysisSection stats={mistakeStats} />

        {/* 8. Day-of-Week & News Catalyst Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DayOfWeekSection stats={weekdayStats} />
          <NewsPerformanceSection stats={newsStats} />
        </div>

        {/* 9. Recent Trades Table with Search & Pagination */}
        <RecentTradesTable trades={filteredTrades} />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#161f33] py-6 px-4 text-center text-xs text-slate-500 mt-12 bg-[#0a0d15]">
        <div className="w-full max-w-[90%] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Notion Trading Analytics • Built for NQ & ES Day Traders • Read-Only Notion API Integration
          </span>
          <span className="font-mono text-slate-600">
            Cloudflare Native • Edge Zero-Node Runtime
          </span>
        </div>
      </footer>

      {/* Diagnostics Modal */}
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
