import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { tooltipStyle, useVizTokens } from './tokens';

export interface DailyBarDatum {
  day: string;
  pnl: number;
}

export function DailyBars({
  data,
  height = 240,
}: {
  data: DailyBarDatum[];
  height?: number;
}) {
  const t = useVizTokens();

  const formatMoney = (val: number) =>
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barCategoryGap="20%">
          <CartesianGrid stroke={t.gridline} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: t.inkMuted, fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: t.baseline }}
            minTickGap={24}
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
            formatter={(value: number) => [
              `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              'Daily P&L',
            ]}
          />
          <Bar dataKey="pnl" isAnimationActive={false} maxBarSize={28}>
            {data.map((entry, index) => (
              <Cell
                key={`daily-bar-${index}`}
                fill={entry.pnl >= 0 ? t.profitFill : t.loss}
                radius={(entry.pnl >= 0 ? [3, 3, 0, 0] : [0, 0, 3, 3]) as any}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
