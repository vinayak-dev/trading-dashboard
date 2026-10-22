import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EquityCurvePoint } from "../../types/trade";
import { tooltipStyle, useVizTokens } from "./tokens";

export interface EquityAreaProps {
  data: EquityCurvePoint[];
  height?: number;
}

export function EquityArea({ data, height = 220 }: EquityAreaProps) {
  const id = useId().replace(/:/g, "");
  const t = useVizTokens();

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-muted-foreground"
      >
        No equity data available
      </div>
    );
  }

  const chartData = data.map((pt, idx) => ({
    index: idx + 1,
    pnl: pt.cumulativePnl ?? pt.individualPnl ?? 0,
    date: pt.date || `Trade ${idx + 1}`,
  }));

  const top = Math.max(0, ...chartData.map((d) => d.pnl));
  const bottom = Math.min(0, ...chartData.map((d) => d.pnl));
  const zero = top === bottom ? 100 : (top / (top - bottom)) * 100;

  // Calculate relative drawdown from running peak
  let peak = 0;
  const drawdownData = chartData.map((d) => {
    if (d.pnl > peak) peak = d.pnl;
    const dd = peak > 0 ? -Math.max(0, peak - d.pnl) : Math.min(0, d.pnl);
    return {
      date: d.date,
      drawdown: dd,
    };
  });
  const maxDrawdown = Math.min(0, ...drawdownData.map((d) => d.drawdown));

  const formatMoney = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="flex flex-col gap-2">
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id={`${id}-line`} x1="0" y1="0" x2="0" y2="1">
                <stop offset={`${zero}%`} stopColor={t.brand} />
                <stop offset={`${zero}%`} stopColor={t.loss} />
              </linearGradient>
              <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.brand} stopOpacity={0.3} />
                <stop offset={`${zero}%`} stopColor={t.brand} stopOpacity={0.035} />
                <stop offset={`${zero}%`} stopColor={t.loss} stopOpacity={0.035} />
                <stop offset="100%" stopColor={t.loss} stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={t.gridline} strokeWidth={1} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: t.inkMuted, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: t.baseline }}
              minTickGap={32}
            />
            <YAxis
              tick={{ fill: t.inkMuted, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={formatMoney}
            />
            <ReferenceLine y={0} stroke={t.baseline} />
            <Tooltip
              contentStyle={tooltipStyle(t)}
              formatter={(val: number) => [
                `$${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                "Cumulative P&L",
              ]}
            />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke={t.brand}
              strokeWidth={2}
              fill={`url(#${id}-fill)`}
              baseValue={0}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Relative Drawdown Underneath */}
      <div className="border-t border-border pt-2">
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">
          <span>Relative drawdown</span>
          <span className="text-loss tabular-nums font-semibold">
            Max -${Math.abs(maxDrawdown).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div style={{ height: 60 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={drawdownData} margin={{ top: 2, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={t.gridline} strokeWidth={1} vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis
                tick={{ fill: t.inkMuted, fontSize: 9 }}
                tickLine={false}
                axisLine={false}
                width={60}
                tickFormatter={(val: number) => `-$${Math.abs(val).toFixed(0)}`}
              />
              <Tooltip
                contentStyle={tooltipStyle(t)}
                formatter={(val: number) => [
                  `-$${Math.abs(val).toFixed(2)}`,
                  "Drawdown from Peak",
                ]}
              />
              <Bar dataKey="drawdown" fill={t.loss} opacity={0.7} radius={[0, 0, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
