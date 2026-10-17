import { Lightbulb, AlertTriangle, HelpCircle } from 'lucide-react';
import { QuantitativeInsight } from '../types/trade';

interface InsightsPanelProps {
  insights: QuantitativeInsight[];
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  return (
    <div className="bg-[#111726] border border-[#1e2a42] rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-100">Quantitative Strategy Insights</h3>
        </div>
        <span className="text-[11px] text-slate-400">
          Deterministic statistical observations • Sample verified
        </span>
      </div>

      {insights.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
          Not enough trade data to compute quantitative observations. Log more journal entries to generate insights.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {insights.map(item => {
            const isWarning = item.type === 'warning';
            const isPositive = item.type === 'positive';

            const cardBorder = isWarning
              ? 'border-amber-500/30 bg-[#191512]'
              : isPositive
              ? 'border-emerald-500/30 bg-[#0f1a1c]'
              : 'border-[#1e2c47] bg-[#141b2c]';

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all hover:border-cyan-500/40 ${cardBorder}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-xs font-semibold text-slate-100 leading-snug">
                      {item.title}
                    </h4>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-cyan-300 shrink-0">
                      {item.metricValue}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300/90 leading-relaxed mb-3">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Sample size:</span>
                    <span className="font-mono text-slate-200">{item.sampleSize} trades</span>
                  </div>

                  {item.sampleWarning && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 mt-0.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span className="truncate" title={item.sampleWarning}>
                        {item.sampleWarning}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Statistical Caveat Footer */}
      <div className="mt-4 pt-3 border-t border-[#1a2338] flex items-start gap-2 text-[11px] text-slate-500">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong>Quantitative Caution:</strong> Observed correlations reflect historical performance within the selected sample window and do not guarantee future expectancy. Small samples (&lt; 30 trades) carry high variance.
        </p>
      </div>
    </div>
  );
};
