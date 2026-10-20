import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  title?: string;
  defaultPageSize?: number;
}

export const RecentTradesTable: React.FC<RecentTradesTableProps> = ({
  trades,
  title = 'Recent Trades',
  defaultPageSize = 5,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [showExtendedColumns, setShowExtendedColumns] = useState(false);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  // Gallery slider state for multi-screenshot viewing
  const [galleryState, setGalleryState] = useState<{
    tradeTitle?: string;
    screenshots: ScreenshotFile[];
    currentIndex: number;
  } | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const openGallery = (trade: TradeRecord, startIndex: number = 0) => {
    if (!trade.screenshots || trade.screenshots.length === 0) return;
    setGalleryState({
      tradeTitle: trade.title,
      screenshots: trade.screenshots,
      currentIndex: Math.max(0, Math.min(startIndex, trade.screenshots.length - 1)),
    });
  };

  const closeGallery = () => {
    setGalleryState(null);
    setTouchStartX(null);
  };

  const nextSlide = useCallback(() => {
    setGalleryState((prev) => {
      if (!prev || prev.screenshots.length <= 1) return prev;
      return {
        ...prev,
        currentIndex: (prev.currentIndex + 1) % prev.screenshots.length,
      };
    });
  }, []);

  const prevSlide = useCallback(() => {
    setGalleryState((prev) => {
      if (!prev || prev.screenshots.length <= 1) return prev;
      return {
        ...prev,
        currentIndex: (prev.currentIndex - 1 + prev.screenshots.length) % prev.screenshots.length,
      };
    });
  }, []);

  const goToSlide = (idx: number) => {
    setGalleryState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        currentIndex: Math.max(0, Math.min(idx, prev.screenshots.length - 1)),
      };
    });
  };

  // Keyboard navigation (Escape to close, Left/Right arrows to slide)
  useEffect(() => {
    if (!galleryState) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeGallery();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryState, nextSlide, prevSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTouchStartX(null);
  };

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
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h3>
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
              className="bg-[#191d26] border border-[#2b313e] focus:border-slate-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 w-36 sm:w-48 focus:outline-none transition-colors"
            />
          </div>

          {/* Toggle Full Columns / Extended Notion properties */}
          <button
            onClick={() => setShowExtendedColumns(!showExtendedColumns)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showExtendedColumns
                ? 'bg-[#222834] border-[#384254] text-white shadow-sm'
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
                      <td className="py-3.5 px-4 font-medium text-slate-200 group-hover:text-white transition-colors">
                        <div className="flex items-center gap-2">
                          <span>{trade.title}</span>
                          {trade.position && (
                            <span
                              className={`px-1.5 py-0.5 text-[10px] rounded font-bold ${
                                trade.position === 'Long'
                                  ? 'bg-[#00c076]/10 text-[#00c076]'
                                  : 'bg-[#ff4d4d]/10 text-[#ff4d4d]'
                              }`}
                            >
                              {trade.position}
                            </span>
                          )}
                          {trade.screenshots.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openGallery(trade, 0);
                              }}
                              className="ml-1 px-1.5 py-0.5 rounded bg-[#1e232e] hover:bg-[#282f3e] text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1 border border-[#2c3444] text-[10px] font-semibold"
                              title={`View ${trade.screenshots.length} screenshot${trade.screenshots.length > 1 ? 's (with slide option)' : ''}`}
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>{trade.screenshots.length}</span>
                            </button>
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
                                  openGallery(trade, 0);
                                }}
                                className="px-2 py-1 rounded bg-[#1e2430] hover:bg-[#2b3345] text-slate-300 hover:text-white transition-colors inline-flex items-center justify-center gap-1.5 border border-[#2d3647]"
                                title={`View ${trade.screenshots.length} screenshot${trade.screenshots.length > 1 ? 's (with slide option)' : ''}`}
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-semibold font-mono">
                                  {trade.screenshots.length}
                                </span>
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
                                      openGallery(trade, 0);
                                    }}
                                    className="text-xs text-slate-300 hover:text-white hover:underline flex items-center gap-1.5 font-medium"
                                  >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>Screenshots ({trade.screenshots.length})</span>
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

      {/* Screenshot Slide Gallery Modal */}
      {galleryState && galleryState.screenshots.length > 0 && (() => {
        const currentScreenshot = galleryState.screenshots[galleryState.currentIndex];
        const totalCount = galleryState.screenshots.length;
        const hasMultiple = totalCount > 1;

        if (!currentScreenshot) return null;

        return (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 select-none animate-in fade-in duration-150"
            onClick={closeGallery}
          >
            <div
              className="bg-[#12141a] border border-[#1f242e] rounded-2xl max-w-5xl w-full flex flex-col overflow-hidden relative shadow-2xl max-h-[94vh]"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f242e] bg-[#0e1015]">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="text-xs font-semibold text-white truncate max-w-xs sm:max-w-md">
                    {currentScreenshot.name || `Screenshot ${galleryState.currentIndex + 1}`}
                  </span>
                  {galleryState.tradeTitle && (
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-[#1e2430] text-slate-300 text-[11px] font-mono border border-slate-700/50 truncate max-w-[150px]">
                      {galleryState.tradeTitle}
                    </span>
                  )}
                  {hasMultiple && (
                    <span className="px-2 py-0.5 rounded-full bg-[#1e232e] border border-[#2e3646] text-slate-300 text-[11px] font-semibold whitespace-nowrap">
                      {galleryState.currentIndex + 1} / {totalCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={currentScreenshot.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-300 hover:text-white hover:underline flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1a1f2c] border border-[#2e3646] transition-colors"
                    title="Open full resolution in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Full Size</span>
                  </a>
                  <button
                    onClick={closeGallery}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#191d26] transition-colors"
                    title="Close (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Slide Viewport */}
              <div className="relative flex-1 min-h-[300px] max-h-[66vh] flex items-center justify-center bg-black/60 overflow-hidden">
                {/* Previous Slide Button */}
                {hasMultiple && (
                  <button
                    onClick={prevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-black/90 text-white/80 hover:text-white border border-white/10 hover:border-slate-400/50 backdrop-blur transition-all shadow-xl hover:scale-105 active:scale-95"
                    title="Previous slide (← Left arrow)"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                )}

                {/* Main Image */}
                <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-auto">
                  <img
                    key={currentScreenshot.url}
                    src={currentScreenshot.url}
                    alt={currentScreenshot.name || `Screenshot ${galleryState.currentIndex + 1}`}
                    className="max-h-[63vh] max-w-full object-contain rounded-lg shadow-md select-none transition-opacity duration-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).alt =
                        'Failed to load screenshot. AWS S3 Notion image link may have expired (refresh dashboard to renew).';
                    }}
                  />
                </div>

                {/* Next Slide Button */}
                {hasMultiple && (
                  <button
                    onClick={nextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-black/90 text-white/80 hover:text-white border border-white/10 hover:border-slate-400/50 backdrop-blur transition-all shadow-xl hover:scale-105 active:scale-95"
                    title="Next slide (→ Right arrow)"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                )}
              </div>

              {/* Bottom Slide Option & Thumbnails Strip */}
              {hasMultiple && (
                <div className="px-4 py-3 bg-[#0e1015] border-t border-[#1f242e] flex flex-col gap-2.5">
                  {/* Thumbnails Row */}
                  <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-thin">
                    {galleryState.screenshots.map((s, idx) => {
                      const isActive = idx === galleryState.currentIndex;
                      return (
                        <button
                          key={idx}
                          onClick={() => goToSlide(idx)}
                          className={`relative rounded-lg overflow-hidden border transition-all shrink-0 w-16 h-12 sm:w-20 sm:h-14 bg-black/40 ${
                            isActive
                              ? 'ring-2 ring-slate-400 border-slate-300 opacity-100 scale-105'
                              : 'border-[#222836] opacity-50 hover:opacity-90 hover:border-slate-500'
                          }`}
                          title={`Slide ${idx + 1}: ${s.name}`}
                        >
                          <img
                            src={s.url}
                            alt={s.name}
                            className="w-full h-full object-cover"
                          />
                          <span
                            className={`absolute bottom-0.5 right-0.5 text-[9px] font-mono font-bold px-1 rounded ${
                              isActive
                                ? 'bg-[#2b3240] text-white'
                                : 'bg-black/70 text-slate-300'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Dots & Keyboard Hint */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <div className="flex items-center gap-1.5">
                      {galleryState.screenshots.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => goToSlide(idx)}
                          className={`h-1.5 rounded-full transition-all ${
                            idx === galleryState.currentIndex
                              ? 'w-6 bg-slate-300'
                              : 'w-2 bg-slate-600 hover:bg-slate-400'
                          }`}
                          title={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                    <span className="text-slate-500 hidden sm:inline">
                      Use <kbd className="px-1 py-0.5 bg-[#191d26] rounded text-slate-400 border border-slate-700 font-mono">←</kbd> and <kbd className="px-1 py-0.5 bg-[#191d26] rounded text-slate-400 border border-slate-700 font-mono">→</kbd> to slide • <kbd className="px-1 py-0.5 bg-[#191d26] rounded text-slate-400 border border-slate-700 font-mono">Esc</kbd> to close
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
