import React from 'react';
import {
  X,
  Database,
  CheckCircle2,
  Key,
  Shield
} from 'lucide-react';
import { NotionFetchResponse } from '../types/trade';

interface NotionConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiResponse: NotionFetchResponse | null;
  mode: 'live' | 'demo';
}

export const NotionConnectionModal: React.FC<NotionConnectionModalProps> = ({
  isOpen,
  onClose,
  apiResponse,
  mode,
}) => {
  if (!isOpen) return null;

  const schema = apiResponse?.schemaDetails;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f1422] border border-[#22304c] rounded-2xl max-w-2xl w-full p-6 relative shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Notion Database Connection & Schema Diagnostic
              </h2>
              <p className="text-xs text-slate-400">
                Integration configuration & database health status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Connection Status */}
        <div className="space-y-4 text-xs text-slate-300">
          <div className="bg-[#141b2b] border border-[#1e2a44] rounded-xl p-4">
            <h3 className="font-semibold text-slate-200 text-xs mb-2 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              Connection Overview
            </h3>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block font-sans">Active Mode:</span>
                <span className="font-bold text-cyan-300 uppercase">{mode}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans">Source of Truth:</span>
                <span className="font-bold text-slate-200">
                  {mode === 'live' ? 'Live Notion API' : 'Synthetic Demo Dataset'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans">Total Records Loaded:</span>
                <span className="font-bold text-slate-200">{apiResponse?.totalRecords ?? 0}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans">Target Database ID:</span>
                <span className="text-slate-300 truncate block">
                  {apiResponse?.databaseId || 'Configured via Cloudflare Secret'}
                </span>
              </div>
            </div>
          </div>

          {/* Schema Health Table */}
          {schema && (
            <div className="bg-[#141b2b] border border-[#1e2a44] rounded-xl p-4">
              <h3 className="font-semibold text-slate-200 text-xs mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Database Property Completeness
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span>Date property (Date):</span>
                  <span className="font-mono text-emerald-400">
                    {schema.recordsWithDate} / {apiResponse?.totalRecords} populated
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span>Result property (Select: Win/Loss/BE):</span>
                  <span className="font-mono text-emerald-400">
                    {schema.recordsWithResult} / {apiResponse?.totalRecords} populated
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span>Ticker property (Select: NQ/ES):</span>
                  <span className="font-mono text-slate-300">
                    {schema.recordsWithTicker} / {apiResponse?.totalRecords} populated
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span className="flex items-center gap-1">
                    <span>RR property (Number: Realized R):</span>
                    {schema.recordsWithRR === 0 && (
                      <span className="text-[10px] text-amber-400 font-semibold">(Empty)</span>
                    )}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      schema.recordsWithRR > 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {schema.recordsWithRR} / {apiResponse?.totalRecords} populated
                  </span>
                </div>
              </div>

              {schema.recordsWithRR === 0 && mode === 'live' && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 leading-relaxed">
                  <strong>Notice:</strong> Your Notion records currently have empty <code>RR</code> fields. Populating the RR number in Notion logs (e.g. <code>2.0</code> for a 2R win, <code>1.0</code> for a 1R loss) unlocks cumulative Equity Curve, Expectancy, and Net R analytics.
                </div>
              )}
            </div>
          )}

          {/* Cloudflare Setup Reference */}
          <div className="bg-[#141b2b] border border-[#1e2a44] rounded-xl p-4">
            <h3 className="font-semibold text-slate-200 text-xs mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              Cloudflare Security Configuration
            </h3>
            <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
              In production on Cloudflare Pages/Workers, credentials are secure server-side environment secrets:
            </p>
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
              <p><span className="text-cyan-400">NOTION_TOKEN</span> = [Encrypted Cloudflare Secret]</p>
              <p><span className="text-cyan-400">NOTION_DATABASE_ID</span> = bc4cdd5b-c7d9-4c53-9c02-5111e5762d50</p>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Tokens are never delivered to the client browser or included in frontend JavaScript bundles.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition-colors"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
