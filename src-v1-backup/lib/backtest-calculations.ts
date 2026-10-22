import {
  BacktestTrade,
  BacktestAnalytics,
  BacktestKPIMetrics,
  BacktestEquityPoint,
  CategoryPerformance,
  BacktestFilters
} from '../types/backtest';

/**
 * Filter backtest trades according to active filter criteria
 */
export function filterBacktestTrades(
  trades: BacktestTrade[],
  filters: BacktestFilters
): BacktestTrade[] {
  return trades.filter((t) => {
    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchId = t.tradeId?.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
      const matchInst = t.instrument.toLowerCase().includes(q);
      const matchStrat = t.strategy?.toLowerCase().includes(q);
      const matchNotes = t.notes?.toLowerCase().includes(q);
      if (!matchId && !matchInst && !matchStrat && !matchNotes) {
        return false;
      }
    }

    // Date Range
    if (filters.dateRange === 'custom') {
      if (filters.startDate && t.entryDate < filters.startDate) return false;
      if (filters.endDate && t.entryDate > filters.endDate) return false;
    } else if (filters.dateRange !== 'all') {
      const tradeDate = new Date(t.entryDate).getTime();
      const now = Date.now();
      const days =
        filters.dateRange === '7d'
          ? 7
          : filters.dateRange === '30d'
          ? 30
          : filters.dateRange === '90d'
          ? 90
          : 365;
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      if (tradeDate < cutoff) return false;
    }

    // Instruments
    if (filters.instruments.length > 0 && !filters.instruments.includes(t.instrument)) {
      return false;
    }

    // Directions
    if (filters.directions.length > 0 && !filters.directions.includes(t.direction)) {
      return false;
    }

    // Results
    if (filters.results.length > 0 && !filters.results.includes(t.result)) {
      return false;
    }

    // Strategies
    if (filters.strategies.length > 0) {
      if (!t.strategy || !filters.strategies.includes(t.strategy)) {
        return false;
      }
    }

    // Sessions
    if (filters.sessions.length > 0) {
      if (!t.session || !filters.sessions.includes(t.session)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calculates comprehensive analytics from backtest trade records
 */
export function calculateBacktestAnalytics(
  trades: BacktestTrade[],
  startingBalance: number = 50000
): BacktestAnalytics {
  const totalTrades = trades.length;

  if (totalTrades === 0) {
    return getEmptyAnalytics();
  }

  // 1. Sort chronologically for equity curve & streaks
  const sortedTrades = [...trades].sort((a, b) => {
    const dtA = `${a.entryDate} ${a.entryTime || '00:00:00'}`;
    const dtB = `${b.entryDate} ${b.entryTime || '00:00:00'}`;
    return dtA.localeCompare(dtB);
  });

  const winningTrades = sortedTrades.filter((t) => t.result === 'Win');
  const losingTrades = sortedTrades.filter((t) => t.result === 'Loss');
  const breakevenTrades = sortedTrades.filter((t) => t.result === 'Breakeven');

  const winRate = Number(((winningTrades.length / totalTrades) * 100).toFixed(2));
  const lossRate = Number(((losingTrades.length / totalTrades) * 100).toFixed(2));

  // P&L totals
  let totalNetPnl = 0;
  let totalGrossPnl = 0;
  let totalCommissions = 0;
  let grossWins = 0;
  let grossLosses = 0;

  sortedTrades.forEach((t) => {
    totalNetPnl += t.netPnl;
    totalGrossPnl += t.grossPnl !== undefined ? t.grossPnl : t.netPnl;
    totalCommissions += t.commission || 0;

    if (t.netPnl > 0) {
      grossWins += t.netPnl;
    } else if (t.netPnl < 0) {
      grossLosses += Math.abs(t.netPnl);
    }
  });

  totalNetPnl = Number(totalNetPnl.toFixed(2));
  totalGrossPnl = Number(totalGrossPnl.toFixed(2));
  totalCommissions = Number(totalCommissions.toFixed(2));

  // Profit Factor (Gross Wins / Gross Losses)
  let profitFactor: number | null = null;
  if (grossLosses > 0) {
    profitFactor = Number((grossWins / grossLosses).toFixed(2));
  } else if (grossWins > 0) {
    profitFactor = 99.99; // Cap for zero loss scenario
  }

  // Averages
  const averageWin =
    winningTrades.length > 0 ? Number((grossWins / winningTrades.length).toFixed(2)) : 0;
  const averageLoss =
    losingTrades.length > 0 ? Number((grossLosses / losingTrades.length).toFixed(2)) : 0;
  const winLossRatio = averageLoss > 0 ? Number((averageWin / averageLoss).toFixed(2)) : null;

  // Expectancy per trade = Total Net PnL / Total Trades
  const expectancy = Number((totalNetPnl / totalTrades).toFixed(2));

  // Risk to reward average
  const validRRs = sortedTrades.filter((t) => t.riskReward !== undefined && t.riskReward !== null).map((t) => t.riskReward!);
  const averageRiskReward =
    validRRs.length > 0 ? Number((validRRs.reduce((a, b) => a + b, 0) / validRRs.length).toFixed(2)) : null;

  const expectancyR =
    validRRs.length > 0 ? Number((validRRs.reduce((a, b) => a + b, 0) / validRRs.length).toFixed(2)) : null;

  // Largest Win / Loss
  const largestWin =
    winningTrades.length > 0 ? Math.max(...winningTrades.map((t) => t.netPnl)) : 0;
  const largestLoss =
    losingTrades.length > 0 ? Math.min(...losingTrades.map((t) => t.netPnl)) : 0;

  // Streaks
  let currentWins = 0;
  let maxWins = 0;
  let currentLosses = 0;
  let maxLosses = 0;

  sortedTrades.forEach((t) => {
    if (t.result === 'Win') {
      currentWins++;
      if (currentWins > maxWins) maxWins = currentWins;
      currentLosses = 0;
    } else if (t.result === 'Loss') {
      currentLosses++;
      if (currentLosses > maxLosses) maxLosses = currentLosses;
      currentWins = 0;
    } else {
      currentWins = 0;
      currentLosses = 0;
    }
  });

  // Equity Curve & Drawdown Calculation
  let cumulativePnl = 0;
  let peakEquity = startingBalance;
  let maxDrawdownDollar = 0;
  let maxDrawdownPct = 0;

  const equityCurve: BacktestEquityPoint[] = [
    {
      index: 0,
      tradeId: 'start',
      date: sortedTrades[0]?.entryDate || 'Start',
      netPnl: 0,
      cumulativeNetPnl: 0,
      peakEquity: startingBalance,
      drawdownDollar: 0,
      drawdownPct: 0
    }
  ];

  sortedTrades.forEach((t, i) => {
    cumulativePnl += t.netPnl;
    const currentEquity = startingBalance + cumulativePnl;
    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }

    const drawdownDollar = peakEquity - currentEquity;
    const drawdownPct = peakEquity > 0 ? (drawdownDollar / peakEquity) * 100 : 0;

    if (drawdownDollar > maxDrawdownDollar) {
      maxDrawdownDollar = drawdownDollar;
    }
    if (drawdownPct > maxDrawdownPct) {
      maxDrawdownPct = drawdownPct;
    }

    equityCurve.push({
      index: i + 1,
      tradeId: t.tradeId || t.id,
      date: t.entryDate,
      netPnl: t.netPnl,
      cumulativeNetPnl: Number(cumulativePnl.toFixed(2)),
      peakEquity: Number(peakEquity.toFixed(2)),
      drawdownDollar: Number(drawdownDollar.toFixed(2)),
      drawdownPct: Number(drawdownPct.toFixed(2))
    });
  });

  // Trade Duration (minutes)
  let totalDurationMin = 0;
  let durationCount = 0;
  sortedTrades.forEach((t) => {
    if (t.entryDate && t.entryTime && t.exitDate && t.exitTime) {
      const start = new Date(`${t.entryDate}T${t.entryTime}`).getTime();
      const end = new Date(`${t.exitDate}T${t.exitTime}`).getTime();
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        totalDurationMin += (end - start) / (1000 * 60);
        durationCount++;
      }
    }
  });
  const averageTradeDurationMin =
    durationCount > 0 ? Math.round(totalDurationMin / durationCount) : null;

  // PnL Distribution Buckets
  const pnlDistribution = calculatePnlDistribution(sortedTrades);

  // Grouped performance breakdowns
  const byWeekday = calculateCategoryBreakdown(sortedTrades, (t) => {
    const d = new Date(t.entryDate);
    if (isNaN(d.getTime())) return 'Other';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames[d.getDay()];
  });

  const bySession = calculateCategoryBreakdown(sortedTrades, (t) => t.session || 'NY AM');
  const byInstrument = calculateCategoryBreakdown(sortedTrades, (t) => t.instrument);
  const byStrategy = calculateCategoryBreakdown(sortedTrades, (t) => t.strategy || 'General');

  const kpis: BacktestKPIMetrics = {
    totalTrades,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    breakevenTrades: breakevenTrades.length,
    winRate,
    lossRate,
    totalNetPnl,
    totalGrossPnl,
    totalCommissions,
    profitFactor,
    averageWin,
    averageLoss,
    winLossRatio,
    expectancy,
    expectancyR,
    averageRiskReward,
    maxDrawdownDollar: Number(maxDrawdownDollar.toFixed(2)),
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    maxConsecutiveWins: maxWins,
    maxConsecutiveLosses: maxLosses,
    averageTradeDurationMin,
    largestWin: Number(largestWin.toFixed(2)),
    largestLoss: Number(largestLoss.toFixed(2))
  };

  return {
    kpis,
    equityCurve,
    pnlDistribution,
    byWeekday,
    bySession,
    byInstrument,
    byStrategy
  };
}

function calculateCategoryBreakdown(
  trades: BacktestTrade[],
  getCategory: (t: BacktestTrade) => string
): CategoryPerformance[] {
  const map = new Map<string, { count: number; wins: number; losses: number; pnl: number; grossWins: number; grossLosses: number }>();

  trades.forEach((t) => {
    const cat = getCategory(t);
    const existing = map.get(cat) || { count: 0, wins: 0, losses: 0, pnl: 0, grossWins: 0, grossLosses: 0 };
    existing.count++;
    existing.pnl += t.netPnl;
    if (t.result === 'Win') {
      existing.wins++;
      existing.grossWins += t.netPnl;
    } else if (t.result === 'Loss') {
      existing.losses++;
      existing.grossLosses += Math.abs(t.netPnl);
    }
    map.set(cat, existing);
  });

  const results: CategoryPerformance[] = [];
  map.forEach((data, name) => {
    const winRate = data.count > 0 ? Number(((data.wins / data.count) * 100).toFixed(1)) : 0;
    const profitFactor =
      data.grossLosses > 0
        ? Number((data.grossWins / data.grossLosses).toFixed(2))
        : data.grossWins > 0
        ? 99.99
        : null;
    const avgPnl = data.count > 0 ? Number((data.pnl / data.count).toFixed(2)) : 0;

    results.push({
      name,
      tradesCount: data.count,
      wins: data.wins,
      losses: data.losses,
      winRate,
      totalPnl: Number(data.pnl.toFixed(2)),
      profitFactor,
      avgPnl
    });
  });

  return results.sort((a, b) => b.totalPnl - a.totalPnl);
}

function calculatePnlDistribution(
  trades: BacktestTrade[]
): { range: string; count: number; isProfit: boolean }[] {
  const buckets: { range: string; count: number; isProfit: boolean }[] = [
    { range: '< -$1,000', count: 0, isProfit: false },
    { range: '-$1,000 to -$500', count: 0, isProfit: false },
    { range: '-$500 to -$100', count: 0, isProfit: false },
    { range: '-$100 to $0', count: 0, isProfit: false },
    { range: '$0 to $100', count: 0, isProfit: true },
    { range: '$100 to $500', count: 0, isProfit: true },
    { range: '$500 to $1,000', count: 0, isProfit: true },
    { range: '> $1,000', count: 0, isProfit: true }
  ];

  trades.forEach((t) => {
    const p = t.netPnl;
    if (p < -1000) buckets[0].count++;
    else if (p >= -1000 && p < -500) buckets[1].count++;
    else if (p >= -500 && p < -100) buckets[2].count++;
    else if (p >= -100 && p < 0) buckets[3].count++;
    else if (p >= 0 && p < 100) buckets[4].count++;
    else if (p >= 100 && p < 500) buckets[5].count++;
    else if (p >= 500 && p <= 1000) buckets[6].count++;
    else buckets[7].count++;
  });

  return buckets;
}

function getEmptyAnalytics(): BacktestAnalytics {
  return {
    kpis: {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      lossRate: 0,
      totalNetPnl: 0,
      totalGrossPnl: 0,
      totalCommissions: 0,
      profitFactor: null,
      averageWin: 0,
      averageLoss: 0,
      winLossRatio: null,
      expectancy: 0,
      expectancyR: null,
      averageRiskReward: null,
      maxDrawdownDollar: 0,
      maxDrawdownPct: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      averageTradeDurationMin: null,
      largestWin: 0,
      largestLoss: 0
    },
    equityCurve: [],
    pnlDistribution: [],
    byWeekday: [],
    bySession: [],
    byInstrument: [],
    byStrategy: []
  };
}
