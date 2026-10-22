import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { tooltipStyle, useVizTokens } from './tokens';

export interface EdgeScoreData {
  winRate: number;
  profitFactor: number;
  avgWinLoss: number;
  drawdown: number;
  recovery: number;
  consistency: number;
}

export function EdgeRadar({
  components,
  height = 200,
}: {
  components: EdgeScoreData;
  height?: number;
}) {
  const t = useVizTokens();

  const data = [
    { metric: 'Win %', value: Math.round(components.winRate) },
    { metric: 'Profit Factor', value: Math.round(components.profitFactor) },
    { metric: 'Avg Win/Loss', value: Math.round(components.avgWinLoss) },
    { metric: 'Drawdown', value: Math.round(components.drawdown) },
    { metric: 'Recovery', value: Math.round(components.recovery) },
    { metric: 'Consistency', value: Math.round(components.consistency) },
  ];

  return (
    <div style={{ width: '100%', height }} className="relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius={55} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke={t.gridline} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: t.inkMuted, fontSize: 10, fontWeight: 500 }}
          />
          <Tooltip
            contentStyle={tooltipStyle(t)}
            formatter={(val) => [`${val} / 100`, 'Score']}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke={t.brand}
            fill={t.brand}
            fillOpacity={0.25}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
