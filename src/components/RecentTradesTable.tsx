import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  X,
  Search,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { TradeRecord, ScreenshotFile } from '../types/trade';

interface RecentTradesTableProps {
  trades: TradeRecord[];
}

export const RecentTradesTable: React.FC<RecentTradesTableProps> = ({ trades }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [showExtendedColumns, setShowExtendedColumns] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotFile | null>(null);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  // Filter by search
  const filteredTrades = useMemo(() => {
    if (!searchTerm.trim()) return trades;
    const q = searchTerm.toLowerCase();
    return trades.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.ticker && t.ticker.toLowerCase().includes(q)) ||
        (t.position && t.position.toLowerCase().includes(q)) ||
        (t.sequence && t.sequence.toLowerCase().includes(q)) ||
        (t.result && t.result.toLowerCase().includes(q)) ||
        t.mistakes.some((m) => m.toLowerCase().includes(q))
    );
  }, [trades, searchTerm]);

  // Sort descending by date
  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [filteredTrades]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / pageSize));
  const paginatedTrades = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTrades.slice(start, start + pageSize);
  }, [sortedTrades, page, pageSize]);

  const startIndex = sortedTrades.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, sortedTrades.length);

  const formatROI = (trade: TradeRecord) => {
    const pnl = (trade.dollarPnl ?? trade.pnlDollar) ?? (trade.realizedR !== null ? trade.realizedR * 500 : 0);
    const isWin = pnl >= 0;
    const formattedDollar = `${isWin ? '+$' : '-$'}${Math.abs(pnl).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    const rText = trade.realizedR !== null ? ` (${trade.realizedR >= 0 ? '+' : ''}${trade.realizedR.toFixed(2)}R)` : '';
    return { formattedDollar, rText, isWin };
  };

  return (
    <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-6 shadow-xl space-y-4">
      {/* Table Header matching Image 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Recent Trades</h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search trades..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="bg-[#191d26] border border-[#2b313e] focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 w-36 sm:w-48 focus:outline-none transition-colors"
            />
          </div>

          {/* Toggle Full Columns / Extended Notion properties */}
          <button
            onClick={() => setShowExtendedColumns(!showExtendedColumns)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showExtendedColumns
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : 'bg-[#191d26] border-[#2b313e] text-slate-400 hover:text-white'
            }`}
            title="Toggle Notion columns: Adherence, Mistakes, Screenshots"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Details</span>
          </button>

          {/* Journal Pill Button matching Image 1 */}
          <button
            onClick={() => {
              // Open Notion or journal view
              if (trades[0]?.notionUrl) {
                window.open(trades[0].notionUrl, '_blank');
              } else {
                setShowExtendedColumns(true);
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-[#191d26] hover:bg-[#252c3b] border border-[#2b313e] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-300" />
            <span>Journal</span>
          </button>
        </div>
      </div>

      {/* Table Content matching Image 1 layout: Name, Date, Symbol, ROI */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-[#1f242e] text-slate-400 text-xs font-medium select-none">
              <th className="py-3 px-4 font-semibold">Name</th>
              <th className="py-3 px-4 font-semibold">Date</th>
              <th className="py-3 px-4 font-semibold">Symbol</th>
              <th className="py-3 px-4 text-right font-semibold">ROI</th>
              {showExtendedColumns && (
                <>
                  <th className="py-3 px-4 font-semibold">Adherence</th>
                  <th className="py-3 px-4 font-semibold">Mistakes</th>
                  <th className="py-3 px-3 text-center font-semibold">Media</th>
                  <th className="py-3 px-3 text-center font-semibold">Notion</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171a22]">
            {paginatedTrades.length === 0 ? (
              <tr>
                <td colSpan={showExtendedColumns ? 8 : 4} className="py-8 text-center text-slate-500 font-sans text-xs">
                  No trades found matching current criteria.
                </td>
              </tr>
            ) : (
              paginatedTrades.map((trade) => {
                const { formattedDollar, rText, isWin } = formatROI(trade);
                const isExpanded = expandedTradeId === trade.id;

                return (
                  <React.Fragment key={trade.id}>
                    <tr
                      onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                      className="hover:bg-[#161a23] transition-colors cursor-pointer group"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{trade.title}</span>
                          {trade.position && (
                            <span
                              className={`px-1.5 py-0.5 text-[10px] rounded font-bold ${
                                trade.position === 'Long'
                                  ? 'bg-[#00c076]/10 text-[#00c076]'
                                  : 'bg-[#0084ff]/10 text-[#0084ff]'
                              }`}
                            >
                              {trade.position}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {trade.date || '—'}
                      </td>

                      {/* Symbol */}
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {trade.ticker || '—'}
                      </td>

                      {/* ROI */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span className={isWin ? 'text-[#00c076]' : 'text-[#ff4d4d]'}>
                          {formattedDollar}
                        </span>
                        <span className="text-slate-500 text-[11px] font-normal ml-1">
                          {rText}
                        </span>
                      </td>

                      {/* Extended Notion Columns */}
                      {showExtendedColumns && (
                        <>
                          {/* Adherence */}
                          <td className="py-3.5 px-4">
                            {trade.ruleAdherence ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  trade.ruleAdherence === 'Followed'
                                    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                                    : trade.ruleAdherence === 'Partially Followed'
                                    ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40'
                                    : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                                }`}
                              >
                                {trade.ruleAdherence}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Mistakes */}
                          <td className="py-3.5 px-4 max-w-[200px] truncate">
                            {trade.mistakes.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {trade.mistakes.map((m, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded bg-rose-950/30 text-rose-300 text-[10px] border border-rose-900/40"
                                  >
                                    {m}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Media */}
                          <td className="py-3.5 px-3 text-center">
                            {trade.screenshots.length > 0 ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedScreenshot(trade.screenshots[0]);
                                }}
                                className="p-1 rounded bg-[#1e2430] hover:bg-[#2b3345] text-blue-400 transition-colors inline-flex items-center justify-center"
                                title="View screenshot"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Notion Link */}
                          <td className="py-3.5 px-3 text-center">
                            {trade.notionUrl ? (
                              <a
                                href={trade.notionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded bg-[#1e2430] hover:bg-[#2b3345] text-slate-400 hover:text-white transition-colors inline-flex items-center justify-center"
                                title="Open in Notion"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>

                    {/* Expandable details when row is clicked */}
                    {isExpanded && !showExtendedColumns && (
                      <tr className="bg-[#0e1015]/60 text-xs">
                        <td colSpan={4} className="py-3 px-6 text-slate-300">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Sequence</span>
                              <span className="font-medium text-white">{trade.sequence || 'None'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Rule Adherence</span>
                              <span className="font-medium text-white">{trade.ruleAdherence || 'Not set'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Mistakes</span>
                              <span className="font-medium text-white">
                                {trade.mistakes.length > 0 ? trade.mistakes.join(', ') : 'None'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Actions</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {trade.screenshots.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedScreenshot(trade.screenshots[0]);
                                    }}
                                    className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                                  >
                                    <ImageIcon className="w-3 h-3" /> Image
                                  </button>
                                )}
                                {trade.notionUrl && (
                                  <a
                                    href={trade.notionUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-slate-400 hover:text-white hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Notion
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer matching Image 1: Rows per page [ 5 v ] and 1-5 of 10  <  > */}
      <div className="flex items-center justify-between pt-3 border-t border-[#1f242e] text-xs text-slate-400">
        {/* Left: Rows per page selector */}
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-[#191d26] border border-[#2b313e] text-white text-xs font-semibold rounded-lg px-2.5 py-1 pr-6 appearance-none focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Pagination controls */}
        <div className="flex items-center gap-3">
          <span>
            {startIndex}-{endIndex} of {sortedTrades.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-[#191d26] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-1 rounded hover:bg-[#191d26] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Screenshot Modal Viewer */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div
            className="bg-[#12141a] border border-[#1f242e] rounded-2xl max-w-4xl w-full p-4 overflow-hidden relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1f242e] mb-3">
              <span className="text-xs font-semibold text-white truncate max-w-md">
                {selectedScreenshot.name}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedScreenshot.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Full Size
                </a>
                <button
                  onClick={() => setSelectedScreenshot(null)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#191d26]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] flex items-center justify-center bg-black/50 rounded-lg overflow-auto">
              <img
                src={selectedScreenshot.url}
                alt={selectedScreenshot.name}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).alt =
                    'Failed to load screenshot. AWS S3 Notion image link may have expired (refresh dashboard to renew).';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
