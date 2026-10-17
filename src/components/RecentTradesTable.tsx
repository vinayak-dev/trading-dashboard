import React, { useState, useMemo } from 'react';
import {
  Table,
  ArrowUpDown,
  Search,
  ExternalLink,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { TradeRecord, ScreenshotFile } from '../types/trade';

interface RecentTradesTableProps {
  trades: TradeRecord[];
}

type SortField = 'date' | 'ticker' | 'position' | 'result' | 'realizedR' | 'ruleAdherence';

export const RecentTradesTable: React.FC<RecentTradesTableProps> = ({ trades }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotFile | null>(null);

  // Filter by search query
  const searchedTrades = useMemo(() => {
    if (!searchTerm.trim()) return trades;
    const q = searchTerm.toLowerCase();
    return trades.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.ticker && t.ticker.toLowerCase().includes(q)) ||
      (t.sequence && t.sequence.toLowerCase().includes(q)) ||
      (t.result && t.result.toLowerCase().includes(q)) ||
      (t.date && t.date.toLowerCase().includes(q)) ||
      t.mistakes.some(m => m.toLowerCase().includes(q)) ||
      t.cic.some(c => c.toLowerCase().includes(q))
    );
  }, [trades, searchTerm]);

  // Sort
  const sortedTrades = useMemo(() => {
    return [...searchedTrades].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'date') {
        valA = a.date || '';
        valB = b.date || '';
      } else if (sortField === 'realizedR') {
        valA = a.realizedR ?? -999;
        valB = b.realizedR ?? -999;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchedTrades, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / pageSize));
  const paginatedTrades = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTrades.slice(start, start + pageSize);
  }, [sortedTrades, page, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatR = (val: number | null) => {
    if (val === null) return '—';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}R`;
  };

  return (
    <div className="bg-[#111726] border border-[#1e2a42] rounded-xl p-5 shadow-sm">
      {/* Table Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">Trade Journal Log</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Showing {searchedTrades.length} records matching current criteria
          </p>
        </div>

        {/* Search input & Page Size */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search setups, mistakes, tickers..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="bg-[#141c2c] border border-[#202c46] focus:border-cyan-500/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 w-48 sm:w-64 focus:outline-none transition-colors"
            />
          </div>

          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-[#141c2c] border border-[#202c46] text-xs text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#1b253b]">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="bg-[#0e1422] border-b border-[#1b253b] text-slate-400 text-[11px] uppercase tracking-wider font-semibold select-none">
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('ticker')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Ticker</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('position')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Pos</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3">Sequence</th>
              <th
                onClick={() => handleSort('result')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Result</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('realizedR')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Realized R</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('ruleAdherence')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Adherence</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-3">Mistake Tags</th>
              <th className="py-3 px-2 text-center">Media</th>
              <th className="py-3 px-2 text-center">Notion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#182236] font-mono">
            {paginatedTrades.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500 font-sans text-xs">
                  No trades match your search criteria.
                </td>
              </tr>
            ) : (
              paginatedTrades.map(trade => (
                <tr key={trade.id} className="hover:bg-[#151d30] transition-colors">
                  {/* Date */}
                  <td className="py-2.5 px-3 font-semibold text-slate-300">
                    {trade.date || 'Unspecified'}
                  </td>

                  {/* Ticker */}
                  <td className="py-2.5 px-3">
                    {trade.ticker ? (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold text-[11px] border border-slate-700/60">
                        {trade.ticker}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Position */}
                  <td className="py-2.5 px-3">
                    {trade.position ? (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                          trade.position === 'Long'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                            : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                        }`}
                      >
                        {trade.position}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Sequence */}
                  <td className="py-2.5 px-3 font-sans text-slate-300 text-xs">
                    {trade.sequence || <span className="text-slate-600 font-mono">—</span>}
                  </td>

                  {/* Result */}
                  <td className="py-2.5 px-3">
                    {trade.result ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          trade.result === 'Win'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : trade.result === 'Loss'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : trade.result === 'Break Even'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {trade.result}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>

                  {/* Realized R */}
                  <td className="py-2.5 px-3 text-right font-bold">
                    <span
                      className={
                        (trade.realizedR ?? 0) > 0
                          ? 'text-emerald-400'
                          : (trade.realizedR ?? 0) < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }
                    >
                      {formatR(trade.realizedR)}
                    </span>
                  </td>

                  {/* Rule Adherence */}
                  <td className="py-2.5 px-3 font-sans">
                    {trade.ruleAdherence ? (
                      <span className="flex items-center gap-1.5">
                        {trade.ruleAdherence === 'Followed' && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        {trade.ruleAdherence === 'Partially Followed' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        {trade.ruleAdherence === 'Broke Rules' && (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span
                          className={`text-xs ${
                            trade.ruleAdherence === 'Followed'
                              ? 'text-emerald-300'
                              : trade.ruleAdherence === 'Partially Followed'
                              ? 'text-amber-300'
                              : 'text-rose-300'
                          }`}
                        >
                          {trade.ruleAdherence}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-600 font-mono">—</span>
                    )}
                  </td>

                  {/* Mistake Tags */}
                  <td className="py-2.5 px-3 font-sans max-w-xs truncate">
                    {trade.mistakes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {trade.mistakes.map(m => (
                          <span
                            key={m}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950/40 text-rose-300 border border-rose-900/40"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600 font-mono text-xs">—</span>
                    )}
                  </td>

                  {/* Screenshots */}
                  <td className="py-2.5 px-2 text-center">
                    {trade.screenshots.length > 0 ? (
                      <button
                        onClick={() => setSelectedScreenshot(trade.screenshots[0])}
                        className="text-cyan-400 hover:text-cyan-300 p-1 hover:bg-cyan-950/30 rounded transition-colors"
                        title="View trade screenshot"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>

                  {/* Notion Link */}
                  <td className="py-2.5 px-2 text-center">
                    {trade.notionUrl ? (
                      <a
                        href={trade.notionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-slate-300 p-1 inline-block transition-colors"
                        title="Open page in Notion"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-xs text-slate-400">
        <div>
          Showing {(page - 1) * pageSize + 1} to{' '}
          {Math.min(page * pageSize, sortedTrades.length)} of {sortedTrades.length} entries
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1 rounded bg-[#141c2c] border border-[#202c46] hover:bg-[#1a2438] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-300">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1 rounded bg-[#141c2c] border border-[#202c46] hover:bg-[#1a2438] text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Screenshot Modal Viewer */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1522] border border-[#24334f] rounded-xl max-w-3xl w-full p-4 relative shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="font-medium text-slate-200 text-xs truncate">
                {selectedScreenshot.name}
              </span>
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-hidden rounded-lg bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={selectedScreenshot.url}
                alt={selectedScreenshot.name}
                className="object-contain max-h-[70vh] w-auto"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                  alert('Notion file URL expired. Notion presigned URLs expire after 1 hour. Refresh trades to regenerate temporary URL.');
                }}
              />
            </div>

            <p className="text-[11px] text-slate-500 mt-2 text-center">
              Note: Direct Notion S3 file URLs are temporary presigned URLs that expire periodically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
