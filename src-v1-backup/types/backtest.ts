export type BacktestDirection = 'Long' | 'Short';
export type BacktestResult = 'Win' | 'Loss' | 'Breakeven';
export type BacktestSession = 'Asia' | 'London' | 'NY AM' | 'NY PM' | 'Other';

export interface BacktestTrade {
  id: string; // Unique ID (from CSV or generated)
  tradeId?: string; // Stable trade ID from original file
  entryDate: string; // YYYY-MM-DD
  entryTime?: string; // HH:mm:ss or full ISO
  exitDate?: string; // YYYY-MM-DD
  exitTime?: string;
  instrument: string; // NQ, ES, MNQ, etc.
  strategy?: string; // Setup / strategy / tag
  direction: BacktestDirection;
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  quantity?: number; // Contracts or amount
  grossPnl?: number; // Gross P&L before commission
  commission?: number; // Commission and fees
  netPnl: number; // Net realized P&L
  riskAmount?: number; // Dollar risk
  riskReward?: number; // Realized R or R:R ratio
  result: BacktestResult;
  session?: BacktestSession;
  notes?: string;
  tags?: string[];
  importedAt: string; // Timestamp of import
  batchId?: string;
  rawRow?: Record<string, string>; // Preserves all original uploaded values
}

export interface BacktestFilters {
  search: string;
  dateRange: 'all' | '7d' | '30d' | '90d' | 'ytd' | 'custom';
  startDate?: string | null;
  endDate?: string | null;
  instruments: string[];
  directions: BacktestDirection[];
  results: BacktestResult[];
  strategies: string[];
  sessions: BacktestSession[];
}

export interface BacktestColumnMapping {
  tradeId: string;
  entryDate: string;
  entryTime: string;
  exitDate: string;
  exitTime: string;
  instrument: string;
  direction: string;
  netPnl: string;
  grossPnl: string;
  commission: string;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  takeProfit: string;
  quantity: string;
  strategy: string;
  riskAmount: string;
  riskReward: string;
  session: string;
  notes: string;
}

export interface BacktestImportRowError {
  rowIndex: number;
  message: string;
  raw: Record<string, string>;
}

export interface BacktestImportPreview {
  headers: string[];
  totalRows: number;
  validRows: BacktestTrade[];
  errors: BacktestImportRowError[];
  duplicateIds: string[];
  detectedMapping: BacktestColumnMapping;
}

export interface BacktestKPIMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number; // percentage (0 - 100)
  lossRate: number; // percentage (0 - 100)
  totalNetPnl: number;
  totalGrossPnl: number;
  totalCommissions: number;
  profitFactor: number | null;
  averageWin: number;
  averageLoss: number;
  winLossRatio: number | null;
  expectancy: number; // Expected return per trade
  expectancyR: number | null;
  averageRiskReward: number | null;
  maxDrawdownDollar: number;
  maxDrawdownPct: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  averageTradeDurationMin: number | null;
  largestWin: number;
  largestLoss: number;
}

export interface BacktestEquityPoint {
  index: number;
  tradeId: string;
  date: string;
  netPnl: number;
  cumulativeNetPnl: number;
  peakEquity: number;
  drawdownDollar: number;
  drawdownPct: number;
}

export interface CategoryPerformance {
  name: string;
  tradesCount: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  profitFactor: number | null;
  avgPnl: number;
}

export interface BacktestAnalytics {
  kpis: BacktestKPIMetrics;
  equityCurve: BacktestEquityPoint[];
  pnlDistribution: { range: string; count: number; isProfit: boolean }[];
  byWeekday: CategoryPerformance[];
  bySession: CategoryPerformance[];
  byInstrument: CategoryPerformance[];
  byStrategy: CategoryPerformance[];
}
