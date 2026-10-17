import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { MonthPerformanceData } from '../types/trade';

interface MonthlyMatrixSectionProps {
  matrixData: MonthPerformanceData[];
  totalGainPct: number;
}

export const MonthlyMatrixSection: React.FC<MonthlyMatrixSectionProps> = ({
  matrixData,
  totalGainPct,
}) => {
  const [metricMode, setMetricMode] = useState<'accum' | 'overall'>('accum');
  const [balanceMode, setBalanceMode] = useState<'initial' | 'current'>('initial');

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="bg-[#12141a] border border-[#1f242e] rounded-2xl p-6 shadow-xl">
      {/* Top Title & Info */}
      <div className="flex items-center gap-1.5 mb-5">
        <h2 className="text-xl font-bold tracking-tight text-white">Performance by month</h2>
        <Info className="w-4 h-4 text-slate-600" />
      </div>

      {/* Control Radios Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#1f242e] text-xs">
        {/* Left Radios */}
        <div className="flex items-center gap-4 text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="metricMode"
              checked={metricMode === 'accum'}
              onChange={() => setMetricMode('accum')}
              className="accent-[#0084ff]"
            />
            <span className="flex items-center gap-1">
              <span>Accum. Sessions Gains %</span>
              <Info className="w-3 h-3 text-slate-600" />
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="metricMode"
              checked={metricMode === 'overall'}
              onChange={() => setMetricMode('overall')}
              className="accent-[#0084ff]"
            />
            <span className="flex items-center gap-1">
              <span>Overall Gain %</span>
              <Info className="w-3 h-3 text-slate-600" />
            </span>
          </label>
        </div>

        {/* Right Radios */}
        <div className="flex items-center gap-4 text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="balanceMode"
              checked={balanceMode === 'initial'}
              onChange={() => setBalanceMode('initial')}
              className="accent-[#0084ff]"
            />
            <span>Initial Balance</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="balanceMode"
              checked={balanceMode === 'current'}
              onChange={() => setBalanceMode('current')}
              className="accent-[#0084ff]"
            />
            <span>Current Balance</span>
          </label>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto pt-6 pb-4">
        <div className="min-w-[800px] space-y-3">
          {/* Header Row */}
          <div className="grid grid-cols-14 gap-2 text-center text-xs font-semibold text-slate-300">
            {/* Empty corner */}
            <div className="h-10 rounded-xl bg-[#171a22] border border-[#232936]" />
            {months.map(m => (
              <div
                key={m}
                className="h-10 rounded-xl bg-[#171a22] border border-[#232936] flex items-center justify-center font-medium"
              >
                {m}
              </div>
            ))}
            <div className="h-10 rounded-xl bg-[#171a22] border border-[#232936] flex items-center justify-center font-bold">
              YTD
            </div>
          </div>

          {/* Data Rows for each Year */}
          {matrixData.map(row => (
            <div key={row.year} className="grid grid-cols-14 gap-2 text-center text-xs font-mono">
              {/* Year Label */}
              <div className="h-11 rounded-xl bg-[#171a22] border border-[#232936] flex items-center justify-center font-bold text-white font-sans">
                {row.year}
              </div>

              {/* 12 Months */}
              {row.months.map((val, mIdx) => (
                <div
                  key={`m-${mIdx}`}
                  className={`h-11 rounded-xl bg-[#15171f] border border-[#1f242e] flex items-center justify-center ${
                    val === null
                      ? 'text-slate-600'
                      : val >= 0
                      ? 'text-[#00c076] font-bold'
                      : 'text-[#ff4d4d] font-bold'
                  }`}
                >
                  {val === null ? '-' : `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`}
                </div>
              ))}

              {/* YTD Cell */}
              <div
                className={`h-11 rounded-xl bg-[#15171f] border border-[#1f242e] flex items-center justify-center font-bold ${
                  row.ytd >= 0 ? 'text-[#00c076]' : 'text-[#ff4d4d]'
                }`}
              >
                {row.ytd >= 0 ? '+' : ''}{row.ytd.toFixed(2)}%
              </div>
            </div>
          ))}

          {/* Bottom Total Summary Row */}
          <div className="flex justify-end items-center gap-2 pt-4">
            <div className="h-10 px-5 rounded-xl bg-[#171a22] border border-[#232936] flex items-center justify-center font-bold text-white text-xs">
              Total
            </div>
            <div className="h-10 px-5 rounded-xl bg-[#171a22] border border-[#232936] flex items-center justify-center font-bold text-[#00c076] text-xs font-mono">
              {totalGainPct >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
