import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Upload,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  BacktestTrade,
  BacktestFilters
} from '../../types/backtest';
import { TradeRecord } from '../../types/trade';
import {
  getAllBacktestTrades,
  saveBacktestTrades,
  updateBacktestTrade,
  deleteBacktestTrades,
  clearAllBacktestTrades
} from '../../lib/backtest-storage';
import { filterBacktestTrades } from '../../lib/backtest-calculations';
import {
  calculateKPIMetrics,
  generateEquityCurve,
  calculateTradeFrequency
} from '../../lib/calculations';

// Reusable Analytical Components matching existing design system
import { BacktestFourKPICards } from './BacktestFourKPICards';
import { ProfitLossSection } from '../ProfitLossSection';
import { ExpectancyProfitFactorSection } from '../ExpectancyProfitFactorSection';
import { WinnersLosersSection } from '../WinnersLosersSection';
import { BacktestMonthlyPerformance } from './BacktestMonthlyPerformance';
import { TradeFrequencySection } from '../TradeFrequencySection';
import { PerformanceCalendarSection } from '../PerformanceCalendarSection';
import { BacktestTable } from './BacktestTable';
import { BacktestUploadModal } from './BacktestUploadModal';
import { SAMPLE_BACKTEST_CSV } from '../../lib/backtest-sample-data';
import { parseCsvText, detectColumnMapping, validateAndConvertRows } from '../../lib/backtest-csv-parser';

/**
 * Converts a BacktestTrade record into a standard TradeRecord to power
 * all existing trading analytics components seamlessly.
 */
export function convertBacktestTradeToTradeRecord(b: BacktestTrade): TradeRecord {
  return {
    id: b.id,
    date: b.entryDate,
    dateTime: b.entryTime ? `${b.entryDate}T${b.entryTime}` : `${b.entryDate}T00:00:00Z`,
    formattedDate: b.entryTime ? `${b.entryDate}, ${b.entryTime}` : b.entryDate,
    title: b.strategy ? `${b.instrument} (${b.strategy})` : `${b.instrument} ${b.direction}`,
    ticker: b.instrument,
    symbol: b.rawRow?.pair || b.instrument,
    position: b.direction,
    sequence: b.strategy || null,
    result: b.result === 'Win' ? 'Win' : b.result === 'Loss' ? 'Loss' : 'Break Even',
    cic: b.strategy ? [b.strategy] : [],
    news: b.session || null,
    ruleAdherence: 'Followed',
    mistakes: [],
    plannedRR: b.riskReward ?? null,
    realizedR: b.riskReward ?? (b.netPnl !== 0 ? Number((b.netPnl / 500).toFixed(2)) : 0),
    rawRR: b.riskReward ?? null,
    dollarPnl: b.netPnl,
    pnlDollar: b.netPnl,
    duration: b.entryTime && b.exitTime ? `${b.entryTime} - ${b.exitTime}` : undefined,
    screenshots: [],
    notionUrl: null,
    isExecutedTrade: true,
  };
}

export const BacktestSection: React.FC = () => {
  const [trades, setTrades] = useState<BacktestTrade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Filters state
  const [filters, setFilters] = useState<BacktestFilters>({
    search: '',
    dateRange: 'all',
    startDate: null,
    endDate: null,
    instruments: [],
    directions: [],
    results: [],
    strategies: [],
    sessions: []
  });

  // Load from IndexedDB
  const loadTrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = await getAllBacktestTrades();
      setTrades(stored);
    } catch (err) {
      console.error('Failed to load backtest trades from storage', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  // Existing IDs set for duplicate detection
  const existingTradeIds = useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => {
      set.add(t.id);
      if (t.tradeId) set.add(t.tradeId);
    });
    return set;
  }, [trades]);

  // Handle Import
  const handleImportTrades = async (
    newTrades: BacktestTrade[],
    duplicatePolicy: 'skip' | 'overwrite'
  ) => {
    const result = await saveBacktestTrades(newTrades, duplicatePolicy);
    await loadTrades();
    setNotification({
      message: `Successfully imported ${result.saved} trade(s) (${result.skipped} skipped, ${result.updated} updated). Stored permanently in IndexedDB.`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 6000);
  };

  // Quick Load Sample
  const handleLoadSampleData = async () => {
    try {
      const { headers, rows } = parseCsvText(SAMPLE_BACKTEST_CSV);
      const mapping = detectColumnMapping(headers);
      const preview = validateAndConvertRows(rows, mapping, existingTradeIds);
      if (preview.validRows.length > 0) {
        await handleImportTrades(preview.validRows, 'skip');
      }
    } catch (err: any) {
      setNotification({
        message: `Failed to load sample data: ${err?.message}`,
        type: 'error'
      });
    }
  };

  // Handle Update Trade
  const handleUpdateTrade = async (trade: BacktestTrade) => {
    await updateBacktestTrade(trade);
    await loadTrades();
    setNotification({
      message: `Trade ${trade.tradeId || trade.id} updated successfully.`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle Delete Trades
  const handleDeleteTrades = async (ids: string[]) => {
    await deleteBacktestTrades(ids);
    await loadTrades();
    setNotification({
      message: `Deleted ${ids.length} trade record(s) from storage.`,
      type: 'info'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle Clear All
  const handleClearAll = async () => {
    await clearAllBacktestTrades();
    await loadTrades();
    setNotification({
      message: 'All backtest trades have been cleared.',
      type: 'info'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Filtered trades
  const filteredTrades = useMemo(() => {
    return filterBacktestTrades(trades, filters);
  }, [trades, filters]);

  // Total fees across filtered trades
  const totalCommissions = useMemo(() => {
    return filteredTrades.reduce((sum, t) => sum + (t.commission || 0), 0);
  }, [filteredTrades]);

  // 2. Convert to standard TradeRecord[]
  const convertedTradeRecords = useMemo(() => {
    return filteredTrades.map(convertBacktestTradeToTradeRecord);
  }, [filteredTrades]);

  // 3. Calculate full institutional KPI metrics
  const kpiMetrics = useMemo(() => {
    return calculateKPIMetrics(convertedTradeRecords);
  }, [convertedTradeRecords]);

  // 4. Generate equity points
  const equityPoints = useMemo(() => {
    return generateEquityCurve(convertedTradeRecords);
  }, [convertedTradeRecords]);

  // 5. Calculate trade frequency stats
  const tradeFrequencyStats = useMemo(() => {
    return calculateTradeFrequency(convertedTradeRecords);
  }, [convertedTradeRecords]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : notification.type === 'error'
              ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              : 'bg-blue-500/15 border border-blue-500/30 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs hover:opacity-80 ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12141a] border border-[#1f242e] rounded-2xl p-4 sm:p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Backtesting &amp; Strategy Lab
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              IndexedDB Persistent
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete institutional backtesting analytics: P&amp;L curves, expectancy, winners &amp; losers, trade frequency, monthly performance, and interactive calendar
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Backtest Data</span>
          </button>

          {trades.length === 0 && (
            <button
              onClick={handleLoadSampleData}
              className="px-3.5 py-2 rounded-xl bg-[#191d28] hover:bg-[#232938] text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Sample CSV</span>
            </button>
          )}

          <button
            onClick={loadTrades}
            disabled={isLoading}
            className="p-2 rounded-xl bg-[#191d28] hover:bg-[#232938] text-slate-400 hover:text-white border border-[#262c3b] transition-colors"
            title="Reload from local database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-mono">Loading backtest trades from IndexedDB...</div>
        </div>
      ) : trades.length === 0 ? (
        /* Empty State */
        <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-10 sm:p-16 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#181c28] border border-[#283144] flex items-center justify-center text-blue-400 mx-auto shadow-xl">
            <FileSpreadsheet className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-white">No Backtest Trades Uploaded Yet</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload your backtesting CSV data to unlock your Profit &amp; Loss equity curve, Expectancy &amp; Profit Factor, Winners &amp; Losers breakdown, Performance Calendar, and Trade Frequency in this single page.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Backtest CSV</span>
            </button>

            <button
              onClick={handleLoadSampleData}
              className="px-4 py-2.5 rounded-xl bg-[#191d28] hover:bg-[#232938] text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Load 6 Sample Trades</span>
            </button>
          </div>
        </div>
      ) : (
        /* Populated Single-Page Dashboard with All 8 Requested Components */
        <div className="space-y-8">
          {/* 1. TOP 4 KPIS: Total Pnl, Win Rate, Total Trades, Breakeven Trades */}
          <section className="space-y-2">
            <BacktestFourKPICards
              metrics={kpiMetrics}
              totalCommissions={totalCommissions}
            />
          </section>

          {/* 2. PROFIT LOSS EQUITY CURVE */}
          <section className="space-y-3">
            <ProfitLossSection
              metrics={kpiMetrics}
              equityPoints={equityPoints}
            />
          </section>

          {/* 3. EXPECTANCY & PROFIT FACTOR */}
          <section className="space-y-3">
            <ExpectancyProfitFactorSection
              trades={convertedTradeRecords}
              metrics={kpiMetrics}
            />
          </section>

          {/* 4. WINNERS AND LOSERS */}
          <section className="space-y-3">
            <WinnersLosersSection
              metrics={kpiMetrics}
            />
          </section>

          {/* 5. PERFORMANCE BY MONTH */}
          <section className="space-y-3">
            <BacktestMonthlyPerformance
              trades={convertedTradeRecords}
              initialBalance={50000}
            />
          </section>

          {/* 6. AVERAGE TRADE FREQUENCY */}
          <section className="space-y-3">
            <TradeFrequencySection
              stats={tradeFrequencyStats}
            />
          </section>

          {/* 7. PERFORMANCE CALENDAR (Month View & Year View) */}
          <section className="space-y-3">
            <PerformanceCalendarSection
              trades={convertedTradeRecords}
              initialBalance={50000}
            />
          </section>

          {/* 8. BACKTEST TRADES DATA TABLE (Search, Filters, Pagination, Edit, Bulk Delete & Export) */}
          <section className="space-y-3">
            <BacktestTable
              trades={trades}
              filteredTrades={filteredTrades}
              filters={filters}
              onFilterChange={setFilters}
              onUpdateTrade={handleUpdateTrade}
              onDeleteTrades={handleDeleteTrades}
              onClearAll={handleClearAll}
            />
          </section>
        </div>
      )}

      {/* Upload Modal */}
      <BacktestUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportComplete={handleImportTrades}
        existingTradeIds={existingTradeIds}
      />
    </div>
  );
};
