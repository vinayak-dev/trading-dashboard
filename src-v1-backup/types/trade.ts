export type TradeResult = 'Win' | 'Loss' | 'Break Even' | 'No Trade';

export type RuleAdherence = 'Followed' | 'Partially Followed' | 'Broke Rules';

export type TradePosition = 'Long' | 'Short';

export type TradeTicker = 'NQ' | 'ES' | 'YM' | string;

export type TradeSequence = 'Reversal' | 'Continuation' | 'Aligned' | string;

export interface ScreenshotFile {
  name: string;
  url: string;
  expiryTime?: string | null;
}

export interface TradeRecord {
  id: string;
  date: string | null; // YYYY-MM-DD
  dateTime?: string | null; // ISO string if available
  formattedDate?: string; // e.g. "01/02/2026, 18:34:55"
  title: string;
  ticker: TradeTicker | null;
  symbol?: string; // e.g. "CME_MINI:YM1"
  position: TradePosition | null;
  sequence: TradeSequence | null;
  result: TradeResult | null;
  cic: string[];
  news: string | null;
  ruleAdherence: RuleAdherence | null;
  mistakes: string[];
  plannedRR: number | null;
  realizedR: number | null; // Outcome in R units (e.g., +2.5, -1.0, 0.0)
  rawRR: number | null; // Raw number from Notion RR field
  dollarPnl?: number | null; // Dollar PnL amount
  pnlDollar?: number | null; // Alias for dollarPnl
  duration?: string; // e.g. "7h 10m"
  screenshots: ScreenshotFile[];
  notionUrl: string | null;
  isExecutedTrade: boolean; // True if Result is Win, Loss, or Break Even (excludes No Trade)
}

export interface FilterState {
  dateRange: 'all' | '7d' | '30d' | '90d' | 'ytd' | 'custom';
  startDate: string | null; // YYYY-MM-DD
  endDate: string | null;   // YYYY-MM-DD
  tickers: string[];
  positions: TradePosition[];
  results: TradeResult[];
  ruleAdherence: RuleAdherence[];
  mistakes: string[];
  sequences: string[];
  news: string[];
}

export interface KPIMetrics {
  totalTrades: number;             // All records
  executedTrades: number;          // Win, Loss, Break Even
  noTradesCount: number;           // No Trade entries
  wins: number;
  losses: number;
  breakEvens: number;
  winRate: number | null;          // Wins / (Wins + Losses) * 100
  netRealizedR: number | null;     // Sum of realized R
  expectancy: number | null;       // Net R / executedTrades
  profitFactor: number | null;     // Gross positive R / Gross negative R
  avgWinR: number | null;          // Avg realized R of winners
  avgLossR: number | null;         // Avg absolute realized R of losers
  ruleAdherenceRate: number | null;// Followed / total with known adherence * 100
  maxDrawdownR: number | null;     // Max peak-to-trough in cumulative R
  maxDrawdownPercent: number | null;
  validSetupsMissed: number;       // Trades with "Missed valid setup" mistake tag
  hasRealizedRData: boolean;       // Indicates if realized R is available

  // Dollar and Screenshot-Matched Trading Analytics Metrics
  totalPnl: number;
  accountBalance: number;
  accountGainPct: number;
  riskRewardRatio: number;
  monthGainLoss: number;
  weekGainLoss: number;
  dailyGainLoss: number;

  // Winners & Losers Deep Stats (Image 3)
  bestWinPct: number;
  avgWinPct: number;
  worstLossPct: number;
  avgLossPct: number;
  avgWinDuration: string;
  avgLossDuration: string;
  maxConsecutiveWins: number;
  avgConsecutiveWins: number;
  maxConsecutiveLosses: number;
  avgConsecutiveLosses: number;
  currentStreak?: {
    type: 'win' | 'loss' | 'none';
    count: number;
  };

  // Performance By Side (Image 3)
  buyTradesCount: number;
  sellTradesCount: number;
  buyWinRate: number;
  sellWinRate: number;

  // RR Cards (Image 2)
  averageRR: number;
  maxRR: number;
  idealAverageRR: number;
  maxIdealRR: number;
  couldHaveProfitBE: number;
}

export interface EquityCurvePoint {
  tradeIndex: number;
  tradeId: string;
  date: string;
  rawDate?: string;
  title: string;
  ticker: string;
  result: TradeResult | 'Unknown';
  individualR: number | null;
  cumulativeR: number;
  individualPnl: number;
  cumulativePnl: number;
  accountBalance: number;
  peakR: number;
  drawdownR: number;
}

export interface CategoryMetric {
  name: string;
  count: number;
  executedCount: number;
  wins: number;
  losses: number;
  breakEvens: number;
  winRate: number | null;
  netRealizedR: number | null;
  expectancy: number | null;
  profitFactor: number | null;
  avgWinR: number | null;
  avgLossR: number | null;
  pnl?: number;
}

export interface MonthPerformanceData {
  year: number;
  months: (number | null)[]; // 12 elements (Jan..Dec) representing % gain or null
  ytd: number;
}

export interface QuantitativeInsight {
  id: string;
  type: 'positive' | 'warning' | 'neutral';
  title: string;
  description: string;
  sampleSize: number;
  metricLabel: string;
  metricValue: string;
  isStatisticallySignificant: boolean;
  sampleWarning?: string;
}

export interface NotionFetchResponse {
  success: boolean;
  source: 'notion' | 'demo';
  databaseId?: string;
  fetchedAt: string;
  totalRecords: number;
  trades: TradeRecord[];
  error?: string;
  schemaDetails?: {
    propertiesPresent: string[];
    recordsWithRR: number;
    recordsWithResult: number;
    recordsWithDate: number;
    recordsWithTicker: number;
  };
}
