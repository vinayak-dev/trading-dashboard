import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  parseCsvText,
  detectColumnMapping,
  validateAndConvertRows
} from '../../lib/backtest-csv-parser';
import {
  BacktestColumnMapping,
  BacktestImportPreview,
  BacktestTrade
} from '../../types/backtest';
import { SAMPLE_BACKTEST_CSV } from '../../lib/backtest-sample-data';

interface BacktestUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (trades: BacktestTrade[], duplicatePolicy: 'skip' | 'overwrite') => Promise<void>;
  existingTradeIds: Set<string>;
}

type ModalStep = 'upload' | 'mapping' | 'preview';

export const BacktestUploadModal: React.FC<BacktestUploadModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  existingTradeIds
}) => {
  const [step, setStep] = useState<ModalStep>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [parsedRawRows, setParsedRawRows] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<BacktestColumnMapping>({
    tradeId: '',
    entryDate: '',
    entryTime: '',
    exitDate: '',
    exitTime: '',
    instrument: '',
    direction: '',
    netPnl: '',
    grossPnl: '',
    commission: '',
    entryPrice: '',
    exitPrice: '',
    stopLoss: '',
    takeProfit: '',
    quantity: '',
    strategy: '',
    riskAmount: '',
    riskReward: '',
    session: '',
    notes: ''
  });

  const [previewResult, setPreviewResult] = useState<BacktestImportPreview | null>(null);
  const [duplicatePolicy, setDuplicatePolicy] = useState<'skip' | 'overwrite'>('skip');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessCsvText = (text: string, name: string) => {
    try {
      setErrorMessage(null);
      const { headers, rows } = parseCsvText(text);

      if (headers.length === 0 || rows.length === 0) {
        setErrorMessage('The selected CSV file appears to be empty or unreadable.');
        return;
      }

      setFileName(name);
      setCsvHeaders(headers);
      setParsedRawRows(rows);

      // Auto-detect mapping
      const detected = detectColumnMapping(headers);
      setColumnMapping(detected);

      // Generate preview
      const preview = validateAndConvertRows(rows, detected, existingTradeIds);
      setPreviewResult(preview);

      setStep('mapping');
    } catch (err: any) {
      setErrorMessage(`Failed to parse CSV: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessCsvText(text, file.name);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleProcessCsvText(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleLoadSample = () => {
    handleProcessCsvText(SAMPLE_BACKTEST_CSV, 'backtesting-analytics.csv');
  };

  const handleUpdateMappingField = (field: keyof BacktestColumnMapping, headerVal: string) => {
    const updated = { ...columnMapping, [field]: headerVal };
    setColumnMapping(updated);
    if (parsedRawRows.length > 0) {
      const revalidated = validateAndConvertRows(parsedRawRows, updated, existingTradeIds);
      setPreviewResult(revalidated);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewResult || previewResult.validRows.length === 0) return;
    setIsImporting(true);
    try {
      await onImportComplete(previewResult.validRows, duplicatePolicy);
      onClose();
    } catch (err: any) {
      setErrorMessage(`Import failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const resetState = () => {
    setStep('upload');
    setFileName('');
    setParsedRawRows([]);
    setCsvHeaders([]);
    setPreviewResult(null);
    setErrorMessage(null);
  };

  const sampleFirstRow = parsedRawRows[0] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f1118] border border-[#232938] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1f242e] flex items-center justify-between gap-3 bg-[#131620]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Upload Backtest Data
              </h3>
              <p className="text-xs text-slate-400">
                Import CSV trading history with preview, column mapping, and duplicate validation
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1f2c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-5 py-2.5 bg-[#0b0d13] border-b border-[#1a1f2b] flex items-center gap-2 text-xs">
          <span
            className={`font-semibold px-2 py-0.5 rounded ${
              step === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            1. Select File
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span
            className={`font-semibold px-2 py-0.5 rounded ${
              step === 'mapping' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            2. Map Columns
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span
            className={`font-semibold px-2 py-0.5 rounded ${
              step === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            3. Review &amp; Import
          </span>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-[#262c3d] hover:border-blue-500/50 bg-[#12151e]/60 hover:bg-[#141824]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,text/csv"
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-[#191e2b] border border-[#2b3347] flex items-center justify-center text-blue-400 shadow-lg">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Click to upload or drag &amp; drop your CSV file
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports TradeZella, TradingView, Sierra Chart, NinjaTrader, or custom backtest exports
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#1b202d] text-slate-300 text-[11px] font-mono border border-[#272e42]">
                  .CSV format up to 25 MB
                </div>
              </div>

              {/* Sample Data Quick Loader */}
              <div className="p-4 rounded-xl bg-[#131620] border border-[#202636] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Want to test with sample backtesting data?
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Instantly load the 6 verified NQ backtest trades from backtesting-analytics.csv
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  Load Sample CSV
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1f242e]">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Map CSV Columns ({fileName})
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    We automatically detected matches. Verify or remap any headers if needed.
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  {parsedRawRows.length} rows parsed
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[50vh] overflow-y-auto pr-1">
                {[
                  { key: 'entryDate', label: 'Entry Date *', req: true, desc: 'YYYY/MM/DD or YYYY-MM-DD' },
                  { key: 'netPnl', label: 'Net Realized P&L *', req: true, desc: 'rPnL, netPnl, or profit' },
                  { key: 'instrument', label: 'Instrument / Symbol', req: false, desc: 'pair, ticker, symbol' },
                  { key: 'direction', label: 'Direction (Side)', req: false, desc: 'buy/sell or Long/Short' },
                  { key: 'tradeId', label: 'Trade ID', req: false, desc: 'id, ticket, stable identifier' },
                  { key: 'entryPrice', label: 'Entry Price', req: false, desc: 'entryPrice, openPrice' },
                  { key: 'exitPrice', label: 'Exit Price', req: false, desc: 'avgClosePrice, exitPrice' },
                  { key: 'stopLoss', label: 'Stop Loss', req: false, desc: 'initialSL, stopLoss' },
                  { key: 'takeProfit', label: 'Take Profit', req: false, desc: 'maxTP, idealTP, tp' },
                  { key: 'quantity', label: 'Quantity / Contracts', req: false, desc: 'amount, contracts' },
                  { key: 'grossPnl', label: 'Gross P&L', req: false, desc: 'uPnL, gross_profit' },
                  { key: 'commission', label: 'Commission & Fees', req: false, desc: 'fee, commission' },
                  { key: 'strategy', label: 'Strategy / Tag', req: false, desc: 'tags, setup, playbook' },
                  { key: 'riskReward', label: 'Risk:Reward (RR)', req: false, desc: 'avgRiskReward, rr' },
                  { key: 'session', label: 'Session', req: false, desc: 'Asia, London, NY AM, NY PM' },
                  { key: 'notes', label: 'Notes', req: false, desc: 'comment, notes' }
                ].map((item) => {
                  const currentVal = columnMapping[item.key as keyof BacktestColumnMapping];
                  const sampleVal = currentVal ? sampleFirstRow[currentVal] : '';

                  return (
                    <div
                      key={item.key}
                      className="p-3 rounded-xl bg-[#12151f] border border-[#222838] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${item.req ? 'text-blue-400' : 'text-slate-200'}`}>
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                          {item.desc}
                        </span>
                      </div>

                      <select
                        value={currentVal}
                        onChange={(e) =>
                          handleUpdateMappingField(
                            item.key as keyof BacktestColumnMapping,
                            e.target.value
                          )
                        }
                        className="w-full bg-[#181c28] border border-[#2b3345] hover:border-slate-500 text-slate-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- None / Auto --</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>

                      {sampleVal !== undefined && sampleVal !== '' && (
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          Sample: <span className="text-slate-300 font-semibold">{sampleVal}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION */}
          {step === 'preview' && previewResult && (
            <div className="space-y-4">
              {/* Validation Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#12151e] border border-[#232938]">
                  <div className="text-slate-400 text-[11px]">Total Rows</div>
                  <div className="text-lg font-bold text-white mt-0.5">{previewResult.totalRows}</div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="text-emerald-400 text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Valid Records
                  </div>
                  <div className="text-lg font-bold text-emerald-300 mt-0.5">
                    {previewResult.validRows.length}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="text-amber-400 text-[11px] flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Duplicates Found
                  </div>
                  <div className="text-lg font-bold text-amber-300 mt-0.5">
                    {previewResult.duplicateIds.length}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <div className="text-rose-400 text-[11px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Invalid / Skipped
                  </div>
                  <div className="text-lg font-bold text-rose-300 mt-0.5">
                    {previewResult.errors.length}
                  </div>
                </div>
              </div>

              {/* Duplicate Handling Policy */}
              {previewResult.duplicateIds.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#141824] border border-[#283145] space-y-2">
                  <div className="text-xs font-semibold text-slate-200">
                    Duplicate Handling Policy ({previewResult.duplicateIds.length} existing IDs detected)
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dupPolicy"
                        checked={duplicatePolicy === 'skip'}
                        onChange={() => setDuplicatePolicy('skip')}
                        className="text-blue-500 focus:ring-0"
                      />
                      <span>Skip duplicates (Keep existing records intact)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dupPolicy"
                        checked={duplicatePolicy === 'overwrite'}
                        onChange={() => setDuplicatePolicy('overwrite')}
                        className="text-blue-500 focus:ring-0"
                      />
                      <span>Update existing records with new values</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Errors List if any */}
              {previewResult.errors.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-rose-400">
                    Row Validation Warnings:
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {previewResult.errors.map((e, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 font-mono"
                      >
                        {e.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Table Preview */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Sample Processed Records (First 5):
                </div>
                <div className="overflow-x-auto rounded-xl border border-[#202534] bg-[#0c0e14]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#151822] text-slate-400 border-b border-[#202534]">
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Date / Time</th>
                        <th className="px-3 py-2">Pair</th>
                        <th className="px-3 py-2">Side</th>
                        <th className="px-3 py-2">Entry</th>
                        <th className="px-3 py-2">Exit</th>
                        <th className="px-3 py-2 text-right">Net P&amp;L</th>
                        <th className="px-3 py-2">Session</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#191d28] text-slate-300">
                      {previewResult.validRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#141722]">
                          <td className="px-3 py-1.5 text-slate-400">{row.tradeId || row.id}</td>
                          <td className="px-3 py-1.5">{row.entryDate} {row.entryTime || ''}</td>
                          <td className="px-3 py-1.5 font-bold text-white">{row.instrument}</td>
                          <td className="px-3 py-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                row.direction === 'Long'
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-400'
                              }`}
                            >
                              {row.direction}
                            </span>
                          </td>
                          <td className="px-3 py-1.5">{row.entryPrice ?? '-'}</td>
                          <td className="px-3 py-1.5">{row.exitPrice ?? '-'}</td>
                          <td
                            className={`px-3 py-1.5 text-right font-bold ${
                              row.netPnl >= 0 ? 'text-[#00c076]' : 'text-[#ff4d4f]'
                            }`}
                          >
                            {row.netPnl >= 0 ? '+$' : '-$'}
                            {Math.abs(row.netPnl).toFixed(2)}
                          </td>
                          <td className="px-3 py-1.5 text-slate-400">{row.session}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 sm:p-5 border-t border-[#1f242e] bg-[#131620] flex items-center justify-between gap-3">
          {step === 'upload' ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#191d28] hover:bg-[#222736] text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(step === 'preview' ? 'mapping' : 'upload')}
              className="px-4 py-2 rounded-xl bg-[#191d28] hover:bg-[#222736] text-slate-300 text-xs font-semibold transition-colors"
            >
              Back
            </button>
          )}

          {step === 'upload' && (
            <div className="text-xs text-slate-500">
              Select or drop a CSV file to proceed
            </div>
          )}

          {step === 'mapping' && (
            <button
              type="button"
              onClick={() => setStep('preview')}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              <span>Review Import</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 'preview' && (
            <button
              type="button"
              disabled={isImporting || !previewResult || previewResult.validRows.length === 0}
              onClick={handleConfirmImport}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving to IndexedDB...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Confirm &amp; Save {previewResult?.validRows.length} Trades
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
