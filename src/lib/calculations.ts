import {
  TradeRecord,
  FilterState,
  KPIMetrics,
  EquityCurvePoint,
  CategoryMetric,
  TradeResult,
  RuleAdherence,
  QuantitativeInsight
} from '../types/trade';

/**
 * Resolves the signed realized R from raw RR and trade Result.
 * If rawRR is null, returns null (never guesses or treats missing as 0).
 * Handles both signed (-1) and unsigned (+1) inputs for losses safely.
 */
export function resolveRealizedR(
  rawRR: number | null | undefined,
  result: TradeResult | null | undefined
): number | null {
  if (rawRR === null || rawRR === undefined || isNaN(rawRR)) {
    // If trade was explicit Break Even with no RR entered, it is 0 R
    if (result === 'Break Even') return 0;
    return null;
  }

  if (result === 'No Trade') {
    return null;
  }

  if (result === 'Break Even') {
    return 0;
  }

  if (result === 'Loss') {
    // Standardize loss to negative number
    return -Math.abs(rawRR);
  }

  if (result === 'Win') {
    // Standardize win to positive number
    return Math.abs(rawRR);
  }

  // If result is unknown, keep rawRR as is
  return rawRR;
}

/**
 * Calculates win rate: Wins / (Wins + Losses) * 100
 * Excludes Breakeven and No Trade.
 * Returns null if (Wins + Losses) === 0.
 */
export function calculateWinRate(wins: number, losses: number): number | null {
  const eligible = wins + losses;
  if (eligible <= 0) return null;
  return Number(((wins / eligible) * 100).toFixed(1));
}

/**
 * Calculates Net Realized R across executed trades.
 * Returns null if no realized R data is available.
 */
export function calculateNetR(trades: TradeRecord[]): number | null {
  const tradesWithR = trades.filter(t => t.realizedR !== null && t.isExecutedTrade);
  if (tradesWithR.length === 0) return null;
  const sum = tradesWithR.reduce((acc, t) => acc + (t.realizedR ?? 0), 0);
  return Number(sum.toFixed(2));
}

/**
 * Calculates Trade Expectancy: Sum(realized R) / Number of executed trades with R
 * Returns null if no trades have realized R.
 */
export function calculateExpectancy(trades: TradeRecord[]): number | null {
  const tradesWithR = trades.filter(t => t.realizedR !== null && t.isExecutedTrade);
  if (tradesWithR.length === 0) return null;
  const sum = tradesWithR.reduce((acc, t) => acc + (t.realizedR ?? 0), 0);
  return Number((sum / tradesWithR.length).toFixed(2));
}

/**
 * Calculates Profit Factor: Gross positive R / Gross negative R (absolute)
 * Returns Infinity if losses are 0 and wins > 0.
 * Returns null if no positive or negative trades exist.
 */
export function calculateProfitFactor(trades: TradeRecord[]): number | null {
  const executedWithR = trades.filter(t => t.realizedR !== null && t.isExecutedTrade);
  if (executedWithR.length === 0) return null;

  let grossProfit = 0;
  let grossLoss = 0;

  for (const t of executedWithR) {
    const r = t.realizedR!;
    if (r > 0) grossProfit += r;
    else if (r < 0) grossLoss += Math.abs(r);
  }

  if (grossLoss === 0) {
    return grossProfit > 0 ? Infinity : null;
  }

  return Number((grossProfit / grossLoss).toFixed(2));
}

/**
 * Calculates Average Winning R.
 */
export function calculateAvgWinR(trades: TradeRecord[]): number | null {
  const winners = trades.filter(t => t.result === 'Win' && t.realizedR !== null);
  if (winners.length === 0) return null;
  const sum = winners.reduce((acc, t) => acc + (t.realizedR ?? 0), 0);
  return Number((sum / winners.length).toFixed(2));
}

/**
 * Calculates Average Losing R (returned as positive absolute value).
 */
export function calculateAvgLossR(trades: TradeRecord[]): number | null {
  const losers = trades.filter(t => t.result === 'Loss' && t.realizedR !== null);
  if (losers.length === 0) return null;
  const sum = losers.reduce((acc, t) => acc + Math.abs(t.realizedR ?? 0), 0);
  return Number((sum / losers.length).toFixed(2));
}

/**
 * Calculates Rule Adherence %:
 * Followed / (Followed + Partially Followed + Broke Rules) * 100
 * Only considers executed trades with known adherence.
 */
export function calculateRuleAdherenceRate(trades: TradeRecord[]): number | null {
  const executedKnown = trades.filter(t => t.isExecutedTrade && t.ruleAdherence !== null);
  if (executedKnown.length === 0) return null;
  const followed = executedKnown.filter(t => t.ruleAdherence === 'Followed').length;
  return Number(((followed / executedKnown.length) * 100).toFixed(1));
}

/**
 * Calculates Maximum Drawdown in R units from cumulative realized R equity curve.
 */
export function calculateMaxDrawdown(trades: TradeRecord[]): {
  maxDrawdownR: number | null;
  maxDrawdownPercent: number | null;
} {
  const equityPoints = generateEquityCurve(trades);
  if (equityPoints.length === 0) {
    return { maxDrawdownR: null, maxDrawdownPercent: null };
  }

  let maxDrawdownR = 0;

  for (const pt of equityPoints) {
    if (pt.drawdownR > maxDrawdownR) {
      maxDrawdownR = pt.drawdownR;
    }
  }

  return {
    maxDrawdownR: Number(maxDrawdownR.toFixed(2)),
    maxDrawdownPercent: null, // R is already an un-leveraged standardized unit
  };
}

/**
 * Calculates comprehensive KPI metrics.
 */
export function calculateKPIMetrics(trades: TradeRecord[]): KPIMetrics {
  const totalTrades = trades.length;
  const executedTrades = trades.filter(t => t.isExecutedTrade);
  const noTradesCount = trades.filter(t => t.result === 'No Trade').length;

  const wins = executedTrades.filter(t => t.result === 'Win').length;
  const losses = executedTrades.filter(t => t.result === 'Loss').length;
  const breakEvens = executedTrades.filter(t => t.result === 'Break Even').length;

  const hasRealizedRData = executedTrades.some(t => t.realizedR !== null);

  const winRate = calculateWinRate(wins, losses);
  const netRealizedR = calculateNetR(trades);
  const expectancy = calculateExpectancy(trades);
  const profitFactor = calculateProfitFactor(trades);
  const avgWinR = calculateAvgWinR(trades);
  const avgLossR = calculateAvgLossR(trades);
  const ruleAdherenceRate = calculateRuleAdherenceRate(trades);
  const { maxDrawdownR, maxDrawdownPercent } = calculateMaxDrawdown(trades);

  const validSetupsMissed = trades.filter(t =>
    t.mistakes.some(m => m.toLowerCase().includes('missed valid setup'))
  ).length;

  return {
    totalTrades,
    executedTrades: executedTrades.length,
    noTradesCount,
    wins,
    losses,
    breakEvens,
    winRate,
    netRealizedR,
    expectancy,
    profitFactor,
    avgWinR,
    avgLossR,
    ruleAdherenceRate,
    maxDrawdownR,
    maxDrawdownPercent,
    validSetupsMissed,
    hasRealizedRData,
  };
}

/**
 * Generates cumulative realized-R equity curve points sorted chronologically.
 * Consistent ordering for trades sharing dates.
 */
export function generateEquityCurve(trades: TradeRecord[]): EquityCurvePoint[] {
  // Filter executed trades that have realized R or explicit 0 R
  const validTrades = trades
    .filter(t => t.isExecutedTrade && t.realizedR !== null)
    .sort((a, b) => {
      // Sort by date ascending
      const dateA = a.date || '1970-01-01';
      const dateB = b.date || '1970-01-01';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      // Secondary sort by ID for stability
      return a.id.localeCompare(b.id);
    });

  let cumulativeR = 0;
  let peakR = 0;
  const points: EquityCurvePoint[] = [];

  // Start with baseline 0R point if trades exist
  if (validTrades.length > 0) {
    const firstDate = validTrades[0].date || 'Start';
    points.push({
      tradeIndex: 0,
      tradeId: 'baseline',
      date: firstDate,
      title: 'Baseline',
      ticker: '-',
      result: 'Unknown',
      individualR: 0,
      cumulativeR: 0,
      peakR: 0,
      drawdownR: 0,
    });
  }

  validTrades.forEach((trade, index) => {
    const r = trade.realizedR ?? 0;
    cumulativeR = Number((cumulativeR + r).toFixed(2));
    if (cumulativeR > peakR) {
      peakR = cumulativeR;
    }
    const drawdownR = Number((peakR - cumulativeR).toFixed(2));

    points.push({
      tradeIndex: index + 1,
      tradeId: trade.id,
      date: trade.date || `Trade #${index + 1}`,
      title: trade.title,
      ticker: trade.ticker || 'N/A',
      result: trade.result || 'Unknown',
      individualR: r,
      cumulativeR,
      peakR,
      drawdownR,
    });
  });

  return points;
}

/**
 * Aggregates performance by a generic category key (Ticker, Position, Sequence, News, Rule Adherence).
 */
export function aggregateByCategory<T extends string>(
  trades: TradeRecord[],
  keyExtractor: (trade: TradeRecord) => T | null | undefined,
  allPossibleKeys?: T[]
): CategoryMetric[] {
  const map = new Map<string, TradeRecord[]>();

  // Initialize known keys if provided
  if (allPossibleKeys) {
    for (const key of allPossibleKeys) {
      map.set(key, []);
    }
  }

  for (const trade of trades) {
    const key = keyExtractor(trade);
    if (!key) continue;
    const existing = map.get(key) || [];
    existing.push(trade);
    map.set(key, existing);
  }

  const results: CategoryMetric[] = [];

  map.forEach((records, name) => {
    if (records.length === 0 && !allPossibleKeys?.includes(name as T)) return;

    const count = records.length;
    const executed = records.filter(t => t.isExecutedTrade);
    const wins = executed.filter(t => t.result === 'Win').length;
    const losses = executed.filter(t => t.result === 'Loss').length;
    const breakEvens = executed.filter(t => t.result === 'Break Even').length;

    const winRate = calculateWinRate(wins, losses);
    const netRealizedR = calculateNetR(records);
    const expectancy = calculateExpectancy(records);
    const profitFactor = calculateProfitFactor(records);
    const avgWinR = calculateAvgWinR(records);
    const avgLossR = calculateAvgLossR(records);

    results.push({
      name,
      count,
      executedCount: executed.length,
      wins,
      losses,
      breakEvens,
      winRate,
      netRealizedR,
      expectancy,
      profitFactor,
      avgWinR,
      avgLossR,
    });
  });

  return results.sort((a, b) => b.count - a.count);
}

/**
 * Mistake analysis: unpacks multi-select mistake tags.
 * A trade can have multiple mistake tags; each tag receives the trade's outcome.
 */
export function aggregateByMistakes(trades: TradeRecord[]): CategoryMetric[] {
  const map = new Map<string, TradeRecord[]>();

  for (const trade of trades) {
    if (!trade.mistakes || trade.mistakes.length === 0) {
      const existing = map.get('No Mistakes') || [];
      existing.push(trade);
      map.set('No Mistakes', existing);
      continue;
    }

    for (const mistake of trade.mistakes) {
      const cleanTag = mistake.trim();
      if (!cleanTag || cleanTag.toLowerCase() === 'none') continue;
      const existing = map.get(cleanTag) || [];
      existing.push(trade);
      map.set(cleanTag, existing);
    }
  }

  const results: CategoryMetric[] = [];

  map.forEach((records, name) => {
    const count = records.length;
    const executed = records.filter(t => t.isExecutedTrade);
    const wins = executed.filter(t => t.result === 'Win').length;
    const losses = executed.filter(t => t.result === 'Loss').length;
    const breakEvens = executed.filter(t => t.result === 'Break Even').length;

    results.push({
      name,
      count,
      executedCount: executed.length,
      wins,
      losses,
      breakEvens,
      winRate: calculateWinRate(wins, losses),
      netRealizedR: calculateNetR(records),
      expectancy: calculateExpectancy(records),
      profitFactor: calculateProfitFactor(records),
      avgWinR: calculateAvgWinR(records),
      avgLossR: calculateAvgLossR(records),
    });
  });

  // Sort by highest frequency, secondary by worst Net R
  return results.sort((a, b) => b.count - a.count);
}

/**
 * Aggregates trades by Day of the Week (Monday - Friday).
 */
export function aggregateByDayOfWeek(trades: TradeRecord[]): CategoryMetric[] {
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayIndexMap: { [key: number]: string } = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    0: 'Sunday',
  };

  const map = new Map<string, TradeRecord[]>();
  weekdays.forEach(day => map.set(day, []));

  for (const trade of trades) {
    if (!trade.date) continue;
    // Parse Date safely in UTC/local to avoid timezone shifts
    const parts = trade.date.split('-');
    if (parts.length < 3) continue;
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const dayName = dayIndexMap[dateObj.getDay()];
    if (!dayName) continue;

    const list = map.get(dayName) || [];
    list.push(trade);
    map.set(dayName, list);
  }

  return weekdays.map(day => {
    const records = map.get(day) || [];
    const count = records.length;
    const executed = records.filter(t => t.isExecutedTrade);
    const wins = executed.filter(t => t.result === 'Win').length;
    const losses = executed.filter(t => t.result === 'Loss').length;
    const breakEvens = executed.filter(t => t.result === 'Break Even').length;

    return {
      name: day,
      count,
      executedCount: executed.length,
      wins,
      losses,
      breakEvens,
      winRate: calculateWinRate(wins, losses),
      netRealizedR: calculateNetR(records),
      expectancy: calculateExpectancy(records),
      profitFactor: calculateProfitFactor(records),
      avgWinR: calculateAvgWinR(records),
      avgLossR: calculateAvgLossR(records),
    };
  });
}

/**
 * Filters trade records based on FilterState.
 */
export function filterTrades(trades: TradeRecord[], filters: FilterState): TradeRecord[] {
  return trades.filter(trade => {
    // 1. Date Range Filter
    if (filters.startDate || filters.endDate) {
      if (!trade.date) return false;
      if (filters.startDate && trade.date < filters.startDate) return false;
      if (filters.endDate && trade.date > filters.endDate) return false;
    }

    // 2. Tickers Filter
    if (filters.tickers.length > 0) {
      if (!trade.ticker || !filters.tickers.includes(trade.ticker)) return false;
    }

    // 3. Positions Filter (Long / Short)
    if (filters.positions.length > 0) {
      if (!trade.position || !filters.positions.includes(trade.position)) return false;
    }

    // 4. Result Filter
    if (filters.results.length > 0) {
      if (!trade.result || !filters.results.includes(trade.result)) return false;
    }

    // 5. Rule Adherence Filter
    if (filters.ruleAdherence.length > 0) {
      if (!trade.ruleAdherence || !filters.ruleAdherence.includes(trade.ruleAdherence)) return false;
    }

    // 6. Mistakes Filter
    if (filters.mistakes.length > 0) {
      const hasMatchingMistake = trade.mistakes.some(m => filters.mistakes.includes(m));
      if (!hasMatchingMistake) return false;
    }

    // 7. Sequence Filter
    if (filters.sequences.length > 0) {
      if (!trade.sequence || !filters.sequences.includes(trade.sequence)) return false;
    }

    // 8. News Filter
    if (filters.news.length > 0) {
      if (!trade.news || !filters.news.includes(trade.news)) return false;
    }

    return true;
  });
}

/**
 * Computes deterministic, data-backed insights with sample size verification.
 * Avoids declaring trends or causation on small sample sizes (< 10 trades).
 */
export function generateQuantitativeInsights(trades: TradeRecord[]): QuantitativeInsight[] {
  const insights: QuantitativeInsight[] = [];
  const executedTrades = trades.filter(t => t.isExecutedTrade);
  const MIN_SAMPLE_SIZE = 10;

  // 1. Rule Adherence Impact Insight
  const adherenceStats = aggregateByCategory<RuleAdherence>(
    trades,
    t => t.ruleAdherence,
    ['Followed', 'Broke Rules']
  );
  const followed = adherenceStats.find(s => s.name === 'Followed');
  const broke = adherenceStats.find(s => s.name === 'Broke Rules');

  if (followed && broke && (followed.count > 0 || broke.count > 0)) {
    const isSignificant = followed.executedCount >= MIN_SAMPLE_SIZE && broke.executedCount >= 5;
    const followedWR = followed.winRate ?? 0;
    const brokeWR = broke.winRate ?? 0;
    const wrDiff = (followedWR - brokeWR).toFixed(1);

    insights.push({
      id: 'rule-adherence-diff',
      type: followedWR >= brokeWR ? 'positive' : 'warning',
      title: 'Rule Adherence Impact',
      description: `Trades following your plan recorded a ${followedWR}% win rate (${followed.count} trades) vs ${brokeWR}% when breaking rules (${broke.count} trades).`,
      sampleSize: followed.count + broke.count,
      metricLabel: 'Win Rate Spread',
      metricValue: `${Number(wrDiff) >= 0 ? '+' : ''}${wrDiff}%`,
      isStatisticallySignificant: isSignificant,
      sampleWarning: isSignificant ? undefined : `Low sample size (${followed.count + broke.count} trades). More observations needed to confirm statistical validity.`,
    });
  }

  // 2. Highest Expectancy Ticker
  const tickerStats = aggregateByCategory(trades, t => t.ticker).filter(
    t => t.expectancy !== null && t.executedCount >= 3
  );
  if (tickerStats.length > 1) {
    const sorted = [...tickerStats].sort((a, b) => (b.expectancy ?? -999) - (a.expectancy ?? -999));
    const bestTicker = sorted[0];
    const isSignificant = bestTicker.executedCount >= MIN_SAMPLE_SIZE;

    insights.push({
      id: 'best-ticker-expectancy',
      type: (bestTicker.expectancy ?? 0) > 0 ? 'positive' : 'neutral',
      title: `Highest Expectancy Ticker: ${bestTicker.name}`,
      description: `${bestTicker.name} leads with an expectancy of ${bestTicker.expectancy}R per trade across ${bestTicker.executedCount} executed trades.`,
      sampleSize: bestTicker.executedCount,
      metricLabel: 'Expectancy',
      metricValue: `${bestTicker.expectancy}R / trade`,
      isStatisticallySignificant: isSignificant,
      sampleWarning: isSignificant ? undefined : `Small sample size for ${bestTicker.name} (${bestTicker.executedCount} trades).`,
    });
  }

  // 3. Most Costly Mistake
  const mistakeStats = aggregateByMistakes(trades).filter(
    m => m.name !== 'No Mistakes' && m.netRealizedR !== null && m.netRealizedR < 0
  );
  if (mistakeStats.length > 0) {
    const sortedMistakes = [...mistakeStats].sort((a, b) => (a.netRealizedR ?? 0) - (b.netRealizedR ?? 0));
    const worstMistake = sortedMistakes[0];
    const isSignificant = worstMistake.count >= 5;

    insights.push({
      id: 'costliest-mistake',
      type: 'warning',
      title: `Most Costly Mistake: "${worstMistake.name}"`,
      description: `Tagged in ${worstMistake.count} trades, accumulating a cumulative loss of ${worstMistake.netRealizedR}R (win rate: ${worstMistake.winRate ?? 0}%). Note: trades may share multiple tags.`,
      sampleSize: worstMistake.count,
      metricLabel: 'Net Impact',
      metricValue: `${worstMistake.netRealizedR}R`,
      isStatisticallySignificant: isSignificant,
      sampleWarning: isSignificant ? undefined : 'Sample size under 5 trades.',
    });
  }

  // 4. Position Comparison (Long vs Short)
  const posStats = aggregateByCategory(trades, t => t.position).filter(p => p.executedCount > 0);
  const longStat = posStats.find(p => p.name === 'Long');
  const shortStat = posStats.find(p => p.name === 'Short');

  if (longStat && shortStat) {
    const isSignificant = longStat.executedCount >= MIN_SAMPLE_SIZE && shortStat.executedCount >= MIN_SAMPLE_SIZE;
    const higherWR = (longStat.winRate ?? 0) >= (shortStat.winRate ?? 0) ? 'Long' : 'Short';
    const leader = higherWR === 'Long' ? longStat : shortStat;

    insights.push({
      id: 'position-bias',
      type: 'neutral',
      title: 'Long vs Short Comparison',
      description: `${leader.name} trades outperform with a ${leader.winRate ?? 0}% win rate (${leader.executedCount} trades) vs ${higherWR === 'Long' ? shortStat.winRate ?? 0 : longStat.winRate ?? 0}% for ${higherWR === 'Long' ? 'Short' : 'Long'}.`,
      sampleSize: longStat.executedCount + shortStat.executedCount,
      metricLabel: 'Higher Win Rate',
      metricValue: `${higherWR} (${leader.winRate ?? 0}%)`,
      isStatisticallySignificant: isSignificant,
      sampleWarning: isSignificant ? undefined : 'Small sample size across positions.',
    });
  }

  // 5. Best Trading Weekday
  const dayStats = aggregateByDayOfWeek(trades).filter(d => d.executedCount >= 3 && d.netRealizedR !== null);
  if (dayStats.length > 0) {
    const sortedDays = [...dayStats].sort((a, b) => (b.netRealizedR ?? -999) - (a.netRealizedR ?? -999));
    const bestDay = sortedDays[0];
    const isSignificant = bestDay.executedCount >= MIN_SAMPLE_SIZE;

    insights.push({
      id: 'best-weekday',
      type: (bestDay.netRealizedR ?? 0) > 0 ? 'positive' : 'neutral',
      title: `Best Trading Day: ${bestDay.name}`,
      description: `${bestDay.name} produced ${bestDay.netRealizedR}R across ${bestDay.executedCount} executed trades (win rate: ${bestDay.winRate ?? 0}%). Remember correlation does not imply causation.`,
      sampleSize: bestDay.executedCount,
      metricLabel: 'Net Day R',
      metricValue: `${bestDay.netRealizedR}R`,
      isStatisticallySignificant: isSignificant,
      sampleWarning: isSignificant ? undefined : `Only ${bestDay.executedCount} trades recorded on ${bestDay.name}.`,
    });
  }

  // If sample size is generally low across the board
  if (executedTrades.length < MIN_SAMPLE_SIZE) {
    insights.unshift({
      id: 'global-low-sample',
      type: 'warning',
      title: 'Small Sample Size Advisory',
      description: `Only ${executedTrades.length} executed trades are currently loaded. Statistical variance is high; wait for at least 30-50 trades before drawing firm conclusions about your trading edge.`,
      sampleSize: executedTrades.length,
      metricLabel: 'Total Executed',
      metricValue: `${executedTrades.length} trades`,
      isStatisticallySignificant: false,
    });
  }

  return insights;
}
