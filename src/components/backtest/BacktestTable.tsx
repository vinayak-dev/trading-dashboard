import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  X
} from 'lucide-react';
import {
  BacktestTrade,
  BacktestFilters,
  BacktestDirection,
  BacktestResult,
  BacktestSession
} from '../../types/backtest';
import { exportBacktestTradesToCsv } from '../../lib/backtest-storage';

interface BacktestTableProps {
  trades: BacktestTrade[];
  filteredTrades: BacktestTrade[];
  filters: BacktestFilters;
  onFilterChange: (filters: BacktestFilters) => void;
  onUpdateTrade: (trade: BacktestTrade) => Promise<void>;
  onDeleteTrades: (ids: string[]) => Promise<void>;
  onClearAll: () => Promise<void>;
}

type SortField = 'date' | 'instrument' | 'direction' | 'netPnl' | 'quantity' | 'entryPrice' | 'exitPrice' | 'riskReward';
type SortOrder = 'asc' | 'desc';

export const BacktestTable: React.FC<BacktestTableProps> = ({
  trades,
  filteredTrades,
  filters,
  onFilterChange,
  onUpdateTrade,
  onDeleteTrades,
  onClearAll
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Modal states
  const [editingTrade, setEditingTrade] = useState<BacktestTrade | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);

  // Available unique values for filter dropdowns
  const availableInstruments = useMemo(() => {
    return Array.from(new Set(trades.map((t) => t.instrument).filter(Boolean))).sort();
  }, [trades]);

  const availableStrategies = useMemo(() => {
    return Array.from(new Set(trades.map((t) => t.strategy).filter(Boolean))) as string[];
  }, [trades]);

  // Sort trades
  const sortedTrades = useMemo(() => {
    const list = [...filteredTrades];
    list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date': {
          const dtA = `${a.entryDate} ${a.entryTime || ''}`;
          const dtB = `${b.entryDate} ${b.entryTime || ''}`;
          comparison = dtA.localeCompare(dtB);
          break;
        }
        case 'instrument':
          comparison = a.instrument.localeCompare(b.instrument);
          break;
        case 'direction':
          comparison = a.direction.localeCompare(b.direction);
          break;
        case 'netPnl':
          comparison = a.netPnl - b.netPnl;
          break;
        case 'quantity':
          comparison = (a.quantity || 0) - (b.quantity || 0);
          break;
        case 'entryPrice':
          comparison = (a.entryPrice || 0) - (b.entryPrice || 0);
          break;
        case 'exitPrice':
          comparison = (a.exitPrice || 0) - (b.exitPrice || 0);
          break;
        case 'riskReward':
          comparison = (a.riskReward || 0) - (b.riskReward || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredTrades, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTrades.slice(start, start + pageSize);
  }, [sortedTrades, currentPage, pageSize]);

  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedTrades.length) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(selectedIds);
      paginatedTrades.forEach((t) => newSet.add(t.id));
      setSelectedIds(newSet);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCsv = () => {
    const csvData = exportBacktestTradesToCsv(filteredTrades);
    if (!csvData) return;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `backtest-trades-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    await onDeleteTrades(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsBulkDeleteModalOpen(false);
  };

  const handleConfirmSingleDelete = async () => {
    if (!singleDeleteId) return;
    await onDeleteTrades([singleDeleteId]);
    setSingleDeleteId(null);
  };

  return (
    <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-5 shadow-xl space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search & Count */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, instrument, setup, notes..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="w-full bg-[#181c28] border border-[#262c3b] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs font-mono text-slate-400 shrink-0">
            <strong>{filteredTrades.length}</strong> / {trades.length} trades
          </div>
        </div>

        {/* Action Buttons: Export & Delete */}
        <div className="flex items-center flex-wrap gap-2.5">
          {selectedIds.size > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            disabled={filteredTrades.length === 0}
            className="px-3 py-1.5 rounded-lg bg-[#181c28] hover:bg-[#222838] text-slate-300 hover:text-white border border-[#2b3345] text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            title="Download currently filtered records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export CSV</span>
          </button>

          {trades.length > 0 && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#181c28] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-[#2b3345] text-xs font-medium transition-colors"
              title="Delete all backtest records"
            >
              Clear All Data
            </button>
          )}
        </div>
      </div>

      {/* Filter Row: Instrument, Direction, Result, Strategy, Session */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1a1f2b] text-xs">
        <div className="flex items-center gap-1 text-slate-400 font-semibold mr-1">
          <Filter className="w-3 h-3 text-slate-500" />
          <span>Filters:</span>
        </div>

        {/* Instrument Filter */}
        <select
          value={filters.instruments[0] || ''}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              instruments: e.target.value ? [e.target.value] : []
            })
          }
          className="bg-[#181c28] border border-[#262c3b] rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none"
        >
          <option value="">All Symbols</option>
          {availableInstruments.map((inst) => (
            <option key={inst} value={inst}>
              {inst}
            </option>
          ))}
        </select>

        {/* Direction Filter */}
        <select
          value={filters.directions[0] || ''}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              directions: e.target.value ? [e.target.value as BacktestDirection] : []
            })
          }
          className="bg-[#181c28] border border-[#262c3b] rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none"
        >
          <option value="">All Directions</option>
          <option value="Long">Long</option>
          <option value="Short">Short</option>
        </select>

        {/* Result Filter */}
        <select
          value={filters.results[0] || ''}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              results: e.target.value ? [e.target.value as BacktestResult] : []
            })
          }
          className="bg-[#181c28] border border-[#262c3b] rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none"
        >
          <option value="">All Results</option>
          <option value="Win">Wins Only</option>
          <option value="Loss">Losses Only</option>
          <option value="Breakeven">Breakeven Only</option>
        </select>

        {/* Session Filter */}
        <select
          value={filters.sessions[0] || ''}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              sessions: e.target.value ? [e.target.value as BacktestSession] : []
            })
          }
          className="bg-[#181c28] border border-[#262c3b] rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none"
        >
          <option value="">All Sessions</option>
          <option value="NY AM">NY AM (8:30-12:00)</option>
          <option value="NY PM">NY PM (12:00-16:00)</option>
          <option value="London">London (2:00-8:30)</option>
          <option value="Asia">Asia / Overnight</option>
        </select>

        {/* Strategy Filter */}
        {availableStrategies.length > 0 && (
          <select
            value={filters.strategies[0] || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                strategies: e.target.value ? [e.target.value] : []
              })
            }
            className="bg-[#181c28] border border-[#262c3b] rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none"
          >
            <option value="">All Setups</option>
            {availableStrategies.map((strat) => (
              <option key={strat} value={strat}>
                {strat}
              </option>
            ))}
          </select>
        )}

        {/* Reset Filters */}
        {(filters.search ||
          filters.instruments.length > 0 ||
          filters.directions.length > 0 ||
          filters.results.length > 0 ||
          filters.sessions.length > 0 ||
          filters.strategies.length > 0) && (
          <button
            onClick={() =>
              onFilterChange({
                search: '',
                dateRange: 'all',
                instruments: [],
                directions: [],
                results: [],
                strategies: [],
                sessions: []
              })
            }
            className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 ml-1"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-[#1f242e] bg-[#0c0e14]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#151822] text-slate-400 border-b border-[#1f242e] select-none">
            <tr>
              <th className="px-3 py-2.5 w-8">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-slate-400 hover:text-white"
                >
                  {selectedIds.size > 0 && selectedIds.size === paginatedTrades.length ? (
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>

              <th
                onClick={() => handleSort('date')}
                className="px-3 py-2.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Date / Time</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort('instrument')}
                className="px-3 py-2.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Symbol</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort('direction')}
                className="px-3 py-2.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Side</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort('quantity')}
                className="px-3 py-2.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Qty</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort('entryPrice')}
                className="px-3 py-2.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Entry</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort('exitPrice')}
                className="px-3 py-2.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>Exit</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort('netPnl')}
                className="px-3 py-2.5 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Net P&amp;L</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th
                onClick={() => handleSort('riskReward')}
                className="px-3 py-2.5 cursor-pointer hover:text-white text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>R:R</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th className="px-3 py-2.5">Session</th>
              <th className="px-3 py-2.5">Setup / Notes</th>
              <th className="px-3 py-2.5 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#181c26] text-slate-300">
            {paginatedTrades.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center text-slate-500">
                  No backtest trades found matching the current search &amp; filter settings.
                </td>
              </tr>
            ) : (
              paginatedTrades.map((t) => {
                const isSelected = selectedIds.has(t.id);
                const isWin = t.result === 'Win';
                const isLoss = t.result === 'Loss';

                return (
                  <tr
                    key={t.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-blue-600/10' : 'hover:bg-[#141722]'
                    }`}
                  >
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectOne(t.id)}
                        className="text-slate-400 hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    <td className="px-3 py-2">
                      <div className="text-white font-medium">{t.entryDate}</div>
                      {t.entryTime && (
                        <div className="text-[10px] text-slate-500">{t.entryTime}</div>
                      )}
                    </td>

                    <td className="px-3 py-2 font-bold text-white font-sans">
                      {t.instrument}
                    </td>

                    <td className="px-3 py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.direction === 'Long'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {t.direction}
                      </span>
                    </td>

                    <td className="px-3 py-2">{t.quantity ?? '-'}</td>
                    <td className="px-3 py-2">{t.entryPrice?.toFixed(2) ?? '-'}</td>
                    <td className="px-3 py-2">{t.exitPrice?.toFixed(2) ?? '-'}</td>

                    <td
                      className={`px-3 py-2 text-right font-bold font-mono ${
                        isWin ? 'text-[#00c076]' : isLoss ? 'text-[#ff4d4f]' : 'text-slate-400'
                      }`}
                    >
                      {t.netPnl >= 0 ? '+$' : '-$'}
                      {Math.abs(t.netPnl).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>

                    <td className="px-3 py-2 text-right text-slate-300 font-mono">
                      {t.riskReward !== undefined ? `${t.riskReward >= 0 ? '+' : ''}${t.riskReward}R` : '-'}
                    </td>

                    <td className="px-3 py-2 text-slate-400">{t.session || '-'}</td>

                    <td className="px-3 py-2 max-w-[150px] truncate text-slate-400">
                      {t.strategy && (
                        <span className="text-blue-300 font-semibold mr-1.5">
                          [{t.strategy}]
                        </span>
                      )}
                      <span>{t.notes || ''}</span>
                    </td>

                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingTrade({ ...t })}
                          className="p-1 rounded hover:bg-[#202636] text-slate-400 hover:text-white transition-colors"
                          title="Edit trade record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSingleDeleteId(t.id)}
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete trade"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-[#181c28] border border-[#262c3b] rounded-lg px-2 py-1 text-slate-200"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-slate-500">
            Showing {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, sortedTrades.length)} of {sortedTrades.length}
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg bg-[#181c28] border border-[#262c3b] text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>
            Page <strong className="text-white">{currentPage}</strong> of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg bg-[#181c28] border border-[#262c3b] text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Edit Trade Modal */}
      {editingTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#11141c] border border-[#232938] rounded-2xl p-5 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f242e]">
              <h4 className="text-sm font-bold text-white">Edit Backtest Trade</h4>
              <button
                onClick={() => setEditingTrade(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400">Entry Date</label>
                <input
                  type="date"
                  value={editingTrade.entryDate}
                  onChange={(e) => setEditingTrade({ ...editingTrade, entryDate: e.target.value })}
                  className="w-full bg-[#181c28] border border-[#2b3345] rounded-lg p-2 text-white mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400">Net Realized P&amp;L ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingTrade.netPnl}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setEditingTrade({
                      ...editingTrade,
                      netPnl: val,
                      result: val > 0.01 ? 'Win' : val < -0.01 ? 'Loss' : 'Breakeven'
                    });
                  }}
                  className="w-full bg-[#181c28] border border-[#2b3345] rounded-lg p-2 text-white mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400">Symbol</label>
                <input
                  type="text"
                  value={editingTrade.instrument}
                  onChange={(e) => setEditingTrade({ ...editingTrade, instrument: e.target.value })}
                  className="w-full bg-[#181c28] border border-[#2b3345] rounded-lg p-2 text-white mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400">Direction</label>
                <select
                  value={editingTrade.direction}
                  onChange={(e) => setEditingTrade({ ...editingTrade, direction: e.target.value as BacktestDirection })}
                  className="w-full bg-[#181c28] border border-[#2b3345] rounded-lg p-2 text-white mt-1"
                >
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400">Entry Price</label>
                <input
                  type="number"
                  step="0.25"
                  value={editingTrade.entryPrice ?? ''}
                  onChange={(e) => setEditingTrade({ ...editingTrade, entryPrice: parseFloat(e.target.value) || undefined })}
                  className="w-full bg-[#181c28] border border-[#2b3345] rounded-lg p-2 text-white mt-1"
                />
              </div>

              <div>
                <label className="text-slate-400">Exit Price</label>
                <input
                  type="number"
                  step="0.25"
                  value={editingTrade.exitPrice ?? ''}
                  onChange={(e) => setEditingTrade({ ...editingTrade, exitPrice: parseFloat(e.target.value) || undefined })}
                  className="w-full bg-[#181c28] border border-[#2b3345] rounded-lg p-2 text-white mt-1"
                />
              </div>

              <div className="col-span-2">
                <label className="text-slate-400">Strategy / Playbook</label>
                <input
                  type="text"
                  value={editingTrade.strategy ?? ''}
                  onChange={(e) => setEditingTrade({ ...editingTrade, strategy: e.target.value })}
                  className="w-full bg-[#181c28] border border-[#2b3345] rounded-lg p-2 text-white mt-1"
                />
              </div>

              <div className="col-span-2">
                <label className="text-slate-400">Notes / Journal</label>
                <textarea
                  rows={2}
                  value={editingTrade.notes ?? ''}
                  onChange={(e) => setEditingTrade({ ...editingTrade, notes: e.target.value })}
                  className="w-full bg-[#181c28] border border-[#2b3345] rounded-lg p-2 text-white mt-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f242e]">
              <button
                type="button"
                onClick={() => setEditingTrade(null)}
                className="px-4 py-1.5 rounded-lg bg-[#181c28] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (editingTrade) {
                    await onUpdateTrade(editingTrade);
                    setEditingTrade(null);
                  }
                }}
                className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12151e] border border-[#2b3347] rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Confirm Bulk Delete</span>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete {selectedIds.size} selected trade(s)? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#1a1f2c] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {singleDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12151e] border border-[#2b3347] rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Delete Trade Record</span>
            </div>
            <p className="text-xs text-slate-300">
              Permanently delete this trade from your persistent backtest dataset?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSingleDeleteId(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#1a1f2c] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12151e] border border-[#2b3347] rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-3">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Clear All Backtest Data</span>
            </div>
            <p className="text-xs text-slate-300">
              This will remove all {trades.length} backtest trades from IndexedDB storage.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#1a1f2c] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onClearAll();
                  setIsClearAllModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
