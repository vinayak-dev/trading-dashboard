import { describe, it, expect } from 'vitest';
import {
  calculateWinRate,
  calculateNetR,
  calculateExpectancy,
  calculateProfitFactor,
  calculateAvgWinR,
  calculateAvgLossR,
  calculateRuleAdherenceRate,
  calculateMaxDrawdown,
  calculateKPIMetrics,
  generateEquityCurve,
  aggregateByCategory,
  aggregateByMistakes,
  aggregateByDayOfWeek,
  filterTrades,
  resolveRealizedR,
  calculateTradeFrequency,
  calculateDrawdownAnalytics
} from '../src/lib/calculations';
import { DEMO_TRADES, DEMO_TRADES_BASE_10 } from '../src/lib/demo-data';
import { mapNotionPageToTrade } from '../src/lib/notion-mapper';
import { TradeRecord, FilterState } from '../src/types/trade';

describe('Quantitative Trading Calculations Module', () => {

  describe('resolveRealizedR & Missing Realized R', () => {
    it('returns null when rawRR is null or undefined (never treats missing as 0)', () => {
      expect(resolveRealizedR(null, 'Win')).toBeNull();
      expect(resolveRealizedR(undefined, 'Loss')).toBeNull();
      expect(resolveRealizedR(null, null)).toBeNull();
    });

    it('standardizes positive RR into signed outcome for Loss (-1R)', () => {
      expect(resolveRealizedR(1, 'Loss')).toBe(-1);
      expect(resolveRealizedR(-1, 'Loss')).toBe(-1);
      expect(resolveRealizedR(1.5, 'Loss')).toBe(-1.5);
    });

    it('standardizes positive RR into positive outcome for Win (+2.5R)', () => {
      expect(resolveRealizedR(2.5, 'Win')).toBe(2.5);
      expect(resolveRealizedR(-2.5, 'Win')).toBe(2.5);
    });

    it('handles Break Even correctly as 0R even if rawRR is null', () => {
      expect(resolveRealizedR(null, 'Break Even')).toBe(0);
      expect(resolveRealizedR(0, 'Break Even')).toBe(0);
    });

    it('returns null for No Trade records', () => {
      expect(resolveRealizedR(2.0, 'No Trade')).toBeNull();
      expect(resolveRealizedR(null, 'No Trade')).toBeNull();
    });
  });

  describe('Win Rate Calculation', () => {
    it('calculates win rate excluding breakeven and no-trade', () => {
      // 6 wins, 4 losses -> 6 / 10 = 60.0%
      expect(calculateWinRate(6, 4)).toBe(60);
      expect(calculateWinRate(1, 2)).toBe(33.3);
    });

    it('returns null when there are zero wins and zero losses', () => {
      expect(calculateWinRate(0, 0)).toBeNull();
    });

    it('handles 100% win rate and 0% win rate', () => {
      expect(calculateWinRate(5, 0)).toBe(100);
      expect(calculateWinRate(0, 5)).toBe(0);
    });
  });

  describe('Net R and Expectancy', () => {
    const mockTrades: TradeRecord[] = [
      {
        id: '1',
        date: '2026-06-01',
        title: 'T1',
        ticker: 'NQ',
        position: 'Long',
        sequence: 'Reversal',
        result: 'Win',
        cic: [],
        news: null,
        ruleAdherence: 'Followed',
        mistakes: [],
        plannedRR: 2,
        realizedR: 2.0,
        rawRR: 2,
        screenshots: [],
        notionUrl: null,
        isExecutedTrade: true,
      },
      {
        id: '2',
        date: '2026-06-02',
        title: 'T2',
        ticker: 'NQ',
        position: 'Short',
        sequence: 'Continuation',
        result: 'Loss',
        cic: [],
        news: null,
        ruleAdherence: 'Followed',
        mistakes: [],
        plannedRR: 1,
        realizedR: -1.0,
        rawRR: 1,
        screenshots: [],
        notionUrl: null,
        isExecutedTrade: true,
      },
      {
        id: '3',
        date: '2026-06-03',
        title: 'T3',
        ticker: 'ES',
        position: 'Long',
        sequence: 'Aligned',
        result: 'Break Even',
        cic: [],
        news: null,
        ruleAdherence: 'Followed',
        mistakes: [],
        plannedRR: 1.5,
        realizedR: 0.0,
        rawRR: 0,
        screenshots: [],
        notionUrl: null,
        isExecutedTrade: true,
      },
      {
        id: '4',
        date: '2026-06-04',
        title: 'T4',
        ticker: 'ES',
        position: null,
        sequence: null,
        result: 'No Trade',
        cic: [],
        news: null,
        ruleAdherence: 'Followed',
        mistakes: [],
        plannedRR: null,
        realizedR: null,
        rawRR: null,
        screenshots: [],
        notionUrl: null,
        isExecutedTrade: false,
      },
    ];

    it('calculates Net R correctly across executed trades only', () => {
      // 2.0 + (-1.0) + 0.0 = 1.0R
      expect(calculateNetR(mockTrades)).toBe(1.0);
    });

    it('calculates Expectancy including breakeven as 0 but excluding No Trade', () => {
      // Net R (1.0) / 3 executed trades = 0.33R
      expect(calculateExpectancy(mockTrades)).toBe(0.33);
    });

    it('returns null if trades have no realized R data', () => {
      const emptyTrades = mockTrades.map(t => ({ ...t, realizedR: null }));
      expect(calculateNetR(emptyTrades)).toBeNull();
      expect(calculateExpectancy(emptyTrades)).toBeNull();
    });
  });

  describe('Profit Factor', () => {
    it('calculates Gross Win / Gross Loss correctly', () => {
      const trades: TradeRecord[] = [
        { id: '1', isExecutedTrade: true, realizedR: 3.0, result: 'Win' } as any,
        { id: '2', isExecutedTrade: true, realizedR: 2.0, result: 'Win' } as any,
        { id: '3', isExecutedTrade: true, realizedR: -1.0, result: 'Loss' } as any,
        { id: '4', isExecutedTrade: true, realizedR: -1.0, result: 'Loss' } as any,
      ];
      // Gross Win = 5.0, Gross Loss = 2.0 => PF = 2.5
      expect(calculateProfitFactor(trades)).toBe(2.5);
    });

    it('handles zero-loss scenario with positive wins gracefully by returning Infinity', () => {
      const trades: TradeRecord[] = [
        { id: '1', isExecutedTrade: true, realizedR: 3.0, result: 'Win' } as any,
      ];
      expect(calculateProfitFactor(trades)).toBe(Infinity);
    });

    it('returns null when dataset has no profit or loss trades', () => {
      const trades: TradeRecord[] = [
        { id: '1', isExecutedTrade: true, realizedR: 0, result: 'Break Even' } as any,
      ];
      expect(calculateProfitFactor(trades)).toBeNull();
    });
  });

  describe('Rule Adherence Rate', () => {
    it('calculates percentage of Followed over all known adherence executed trades', () => {
      const trades: TradeRecord[] = [
        { id: '1', isExecutedTrade: true, ruleAdherence: 'Followed' } as any,
        { id: '2', isExecutedTrade: true, ruleAdherence: 'Followed' } as any,
        { id: '3', isExecutedTrade: true, ruleAdherence: 'Partially Followed' } as any,
        { id: '4', isExecutedTrade: true, ruleAdherence: 'Broke Rules' } as any,
      ];
      // 2 / 4 = 50.0%
      expect(calculateRuleAdherenceRate(trades)).toBe(50.0);
    });

    it('ignores trades with null/unrecorded adherence', () => {
      const trades: TradeRecord[] = [
        { id: '1', isExecutedTrade: true, ruleAdherence: 'Followed' } as any,
        { id: '2', isExecutedTrade: true, ruleAdherence: null } as any,
      ];
      expect(calculateRuleAdherenceRate(trades)).toBe(100.0);
    });

    it('returns null when no adherence data is recorded', () => {
      const trades: TradeRecord[] = [
        { id: '1', isExecutedTrade: true, ruleAdherence: null } as any,
      ];
      expect(calculateRuleAdherenceRate(trades)).toBeNull();
    });
  });

  describe('Maximum Drawdown Calculation', () => {
    it('identifies maximum peak-to-trough decline', () => {
      // Sequence: +2R (peak 2), +2R (peak 4), -1R (trough 3, dd 1), -2R (trough 1, dd 3), +1R (cum 2), -1R (cum 1, dd 3), +4R (peak 5, dd 0)
      const trades: TradeRecord[] = [
        { id: '1', date: '2026-06-01', isExecutedTrade: true, realizedR: 2.0, result: 'Win', title: 'T1' } as any,
        { id: '2', date: '2026-06-02', isExecutedTrade: true, realizedR: 2.0, result: 'Win', title: 'T2' } as any,
        { id: '3', date: '2026-06-03', isExecutedTrade: true, realizedR: -1.0, result: 'Loss', title: 'T3' } as any,
        { id: '4', date: '2026-06-04', isExecutedTrade: true, realizedR: -2.0, result: 'Loss', title: 'T4' } as any,
        { id: '5', date: '2026-06-05', isExecutedTrade: true, realizedR: 1.0, result: 'Win', title: 'T5' } as any,
        { id: '6', date: '2026-06-06', isExecutedTrade: true, realizedR: -1.0, result: 'Loss', title: 'T6' } as any,
        { id: '7', date: '2026-06-07', isExecutedTrade: true, realizedR: 4.0, result: 'Win', title: 'T7' } as any,
      ];

      const { maxDrawdownR } = calculateMaxDrawdown(trades);
      expect(maxDrawdownR).toBe(3.0);
    });
  });

  describe('Multi-tag Mistake Analysis', () => {
    it('correctly associates outcomes across multi-tag mistakes without dropping duplicates', () => {
      const trades: TradeRecord[] = [
        {
          id: '1',
          isExecutedTrade: true,
          result: 'Loss',
          realizedR: -1.0,
          mistakes: ['FOMO', 'Risk violation'],
        } as any,
        {
          id: '2',
          isExecutedTrade: true,
          result: 'Loss',
          realizedR: -1.5,
          mistakes: ['FOMO'],
        } as any,
        {
          id: '3',
          isExecutedTrade: true,
          result: 'Win',
          realizedR: 2.0,
          mistakes: [],
        } as any,
      ];

      const stats = aggregateByMistakes(trades);
      const fomo = stats.find(s => s.name === 'FOMO');
      const riskViolation = stats.find(s => s.name === 'Risk violation');
      const noMistakes = stats.find(s => s.name === 'No Mistakes');

      expect(fomo).toBeDefined();
      expect(fomo?.count).toBe(2);
      expect(fomo?.netRealizedR).toBe(-2.5);

      expect(riskViolation).toBeDefined();
      expect(riskViolation?.count).toBe(1);
      expect(riskViolation?.netRealizedR).toBe(-1.0);

      expect(noMistakes).toBeDefined();
      expect(noMistakes?.count).toBe(1);
      expect(noMistakes?.netRealizedR).toBe(2.0);
    });
  });

  describe('Filter Combinations', () => {
    const testTrades: TradeRecord[] = [
      {
        id: '1',
        date: '2026-06-01',
        ticker: 'NQ',
        position: 'Long',
        result: 'Win',
        ruleAdherence: 'Followed',
        mistakes: [],
        sequence: 'Reversal',
        news: '8:30 CPI',
        isExecutedTrade: true,
      } as any,
      {
        id: '2',
        date: '2026-06-05',
        ticker: 'ES',
        position: 'Short',
        result: 'Loss',
        ruleAdherence: 'Broke Rules',
        mistakes: ['FOMO'],
        sequence: 'Continuation',
        news: null,
        isExecutedTrade: true,
      } as any,
    ];

    it('filters accurately by single and combined criteria', () => {
      const filter1: FilterState = {
        dateRange: 'all',
        startDate: null,
        endDate: null,
        tickers: ['NQ'],
        positions: [],
        results: [],
        ruleAdherence: [],
        mistakes: [],
        sequences: [],
        news: [],
      };
      expect(filterTrades(testTrades, filter1).length).toBe(1);

      const filter2: FilterState = {
        dateRange: 'all',
        startDate: null,
        endDate: null,
        tickers: ['ES'],
        positions: ['Short'],
        results: ['Loss'],
        ruleAdherence: ['Broke Rules'],
        mistakes: ['FOMO'],
        sequences: ['Continuation'],
        news: [],
      };
      expect(filterTrades(testTrades, filter2).length).toBe(1);

      // Date range filtering
      const filter3: FilterState = {
        dateRange: 'custom',
        startDate: '2026-06-02',
        endDate: '2026-06-10',
        tickers: [],
        positions: [],
        results: [],
        ruleAdherence: [],
        mistakes: [],
        sequences: [],
        news: [],
      };
      const dateFiltered = filterTrades(testTrades, filter3);
      expect(dateFiltered.length).toBe(1);
      expect(dateFiltered[0].id).toBe('2');
    });
  });

  describe('Schema Mapping from Notion raw pages', () => {
    it('defensively maps empty/null properties without crashing', () => {
      const emptyPage = {
        id: 'test-page-empty',
        properties: {
          Trade: { type: 'title', title: [] },
          Date: { type: 'date', date: null },
          Result: { type: 'select', select: null },
          RR: { type: 'number', number: null },
          Ticker: { type: 'select', select: null },
          Position: { type: 'select', select: null },
        }
      };

      const mapped = mapNotionPageToTrade(emptyPage);
      expect(mapped.id).toBe('test-page-empty');
      expect(mapped.title).toBe('Untitled Trade');
      expect(mapped.date).toBeNull();
      expect(mapped.result).toBeNull();
      expect(mapped.realizedR).toBeNull();
      expect(mapped.isExecutedTrade).toBe(false);
    });

    it('maps Break Even result and checkbox adherence truthfully', () => {
      const fullPage = {
        id: 'full-page-1',
        properties: {
          Trade: { type: 'title', title: [{ plain_text: 'Live Trade' }] },
          Date: { type: 'date', date: { start: '2026-07-06' } },
          Result: { type: 'select', select: { name: 'Break Even' } },
          RR: { type: 'number', number: 0 },
          Ticker: { type: 'select', select: { name: 'NQ' } },
          Position: { type: 'select', select: { name: 'Long' } },
          'Rule Adherence': { type: 'checkbox', checkbox: true },
          Mistake: { type: 'multi_select', multi_select: [{ name: 'none' }] },
        }
      };

      const mapped = mapNotionPageToTrade(fullPage);
      expect(mapped.title).toBe('Live Trade');
      expect(mapped.date).toBe('2026-07-06');
      expect(mapped.result).toBe('Break Even');
      expect(mapped.realizedR).toBe(0);
      expect(mapped.ruleAdherence).toBe('Followed');
      expect(mapped.mistakes).toEqual([]); // 'none' tag ignored
    });

    it('maps all 4 uploaded screenshots accurately from Notion files property', () => {
      const pageWith4Screenshots = {
        id: 'page-screenshots-4',
        properties: {
          Trade: { type: 'title', title: [{ plain_text: 'Trade with 4 Charts' }] },
          Date: { type: 'date', date: { start: '2026-07-06' } },
          Screenshots: {
            type: 'files',
            files: [
              { name: 'Frame 2504.jpg', file: { url: 'https://aws.s3/img1.jpg', expiry_time: '2026-07-07T00:00:00Z' } },
              { name: '15m Entry.png', file: { url: 'https://aws.s3/img2.png', expiry_time: '2026-07-07T00:00:00Z' } },
              { name: '5m Exit.png', file: { url: 'https://aws.s3/img3.png', expiry_time: '2026-07-07T00:00:00Z' } },
              { name: 'Daily Context.png', file: { url: 'https://aws.s3/img4.png', expiry_time: '2026-07-07T00:00:00Z' } },
            ]
          }
        }
      };

      const mapped = mapNotionPageToTrade(pageWith4Screenshots);
      expect(mapped.screenshots).toHaveLength(4);
      expect(mapped.screenshots[0].name).toBe('Frame 2504.jpg');
      expect(mapped.screenshots[0].url).toBe('https://aws.s3/img1.jpg');
      expect(mapped.screenshots[1].name).toBe('15m Entry.png');
      expect(mapped.screenshots[2].name).toBe('5m Exit.png');
      expect(mapped.screenshots[3].name).toBe('Daily Context.png');
    });
  });

  describe('Average Win / Loss R and KPI Aggregation', () => {
    const trades: TradeRecord[] = [
      { id: '1', date: '2026-06-01', result: 'Win', realizedR: 2.5, isExecutedTrade: true, title: 'W1', mistakes: [], ruleAdherence: 'Followed' } as any,
      { id: '2', date: '2026-06-02', result: 'Win', realizedR: 3.5, isExecutedTrade: true, title: 'W2', mistakes: [], ruleAdherence: 'Followed' } as any,
      { id: '3', date: '2026-06-03', result: 'Loss', realizedR: -1.0, isExecutedTrade: true, title: 'L1', mistakes: ['Missed valid setup'], ruleAdherence: 'Broke Rules' } as any,
      { id: '4', date: '2026-06-04', result: 'No Trade', realizedR: null, isExecutedTrade: false, title: 'NT', mistakes: [], ruleAdherence: 'Followed' } as any,
    ];

    it('calculates average winning and losing R accurately', () => {
      // (2.5 + 3.5) / 2 = 3.0R
      expect(calculateAvgWinR(trades)).toBe(3.0);
      // 1.0 / 1 = 1.0R
      expect(calculateAvgLossR(trades)).toBe(1.0);
    });

    it('calculates complete KPIMetrics object', () => {
      const kpis = calculateKPIMetrics(trades);
      expect(kpis.totalTrades).toBe(4);
      expect(kpis.executedTrades).toBe(3);
      expect(kpis.wins).toBe(2);
      expect(kpis.losses).toBe(1);
      expect(kpis.netRealizedR).toBe(5.0); // 2.5 + 3.5 - 1.0
      expect(kpis.winRate).toBe(66.7);
      expect(kpis.validSetupsMissed).toBe(1);
      expect(kpis.hasRealizedRData).toBe(true);
    });

    it('generates chronological equity curve points with baseline', () => {
      const curve = generateEquityCurve(trades);
      expect(curve.length).toBe(4); // Baseline + 3 executed trades with R
      expect(curve[0].cumulativeR).toBe(0);
      expect(curve[1].cumulativeR).toBe(2.5);
      expect(curve[2].cumulativeR).toBe(6.0);
      expect(curve[3].cumulativeR).toBe(5.0);
      expect(curve[3].drawdownR).toBe(1.0); // Drop from peak 6.0 to 5.0
    });

    it('aggregates by category and weekday correctly', () => {
      const catStats = aggregateByCategory(trades, t => t.ruleAdherence);
      expect(catStats.length).toBeGreaterThan(0);

      const dayStats = aggregateByDayOfWeek(trades);
      expect(dayStats.length).toBe(5); // Monday to Friday
      expect(dayStats.some(d => d.name === 'Monday')).toBe(true);
    });
  });

  describe('Average Trade Frequency Calculations', () => {
    it('calculates trade frequency matching screenshot metrics with demo data', () => {
      const freq = calculateTradeFrequency(DEMO_TRADES_BASE_10);

      expect(freq.daily.avg).toBe(1.33);
      expect(freq.weekly.avg).toBe(2.67);
      expect(freq.monthly.avg).toBe(5);

      // Verify week numbers include 1, 51, 52
      const weeks = freq.weekly.data.map(w => w.week);
      expect(weeks).toContain('1');
      expect(weeks).toContain('51');
      expect(weeks).toContain('52');

      // Verify months include Ja, De
      const months = freq.monthly.data.map(m => m.month);
      expect(months).toContain('Ja');
      expect(months).toContain('De');
    });

    it('calculates trade frequency dynamically for 100 demo trades dataset', () => {
      const freq = calculateTradeFrequency(DEMO_TRADES);
      expect(DEMO_TRADES.length).toBe(100);
      expect(freq.daily.data.length).toBeGreaterThan(0);
      expect(freq.weekly.data.length).toBeGreaterThan(0);
      expect(freq.monthly.data.length).toBeGreaterThan(0);
      expect(freq.daily.avg).toBeGreaterThan(0);
      expect(freq.weekly.avg).toBeGreaterThan(0);
      expect(freq.monthly.avg).toBeGreaterThan(0);
    });

    it('handles empty trades defensively without division by zero', () => {
      const freq = calculateTradeFrequency([]);
      expect(freq.daily.avg).toBe(0);
      expect(freq.weekly.avg).toBe(0);
      expect(freq.monthly.avg).toBe(0);
      expect(freq.daily.data).toEqual([]);
      expect(freq.weekly.data).toEqual([]);
      expect(freq.monthly.data).toEqual([]);
    });
  });

  describe('Drawdown & MAE Analytics', () => {
    it('calculates drawdown series and metrics matching TradeZella screenshots', () => {
      const dd = calculateDrawdownAnalytics(DEMO_TRADES_BASE_10);

      expect(dd.maxDrawdownPct).toBe(-3.0);
      expect(dd.maxDrawdownDollar).toBe(-1510.0);
      expect(dd.avgDrawdownPct).toBe(-1.60);
      expect(dd.timeToRecoveryDays).toBe(1.5);
      expect(dd.drawdownFrequency).toBe(3.0);

      // Verify points length
      expect(dd.points.length).toBe(10);

      // Verify MAE bin 0.0 has 10 trades
      const bin0 = dd.maeDistribution.find(b => b.bin === '0.0');
      expect(bin0?.count).toBe(10);

      // Verify winning trades drawdown RR
      expect(dd.winningTradesDrawdown.avgRR).toBe(0.0);
      expect(dd.winningTradesDrawdown.minRR).toBe('∞');
      expect(dd.winningTradesDrawdown.maxRR).toBe('-∞');
    });

    it('calculates drawdown series dynamically for 100 demo trades dataset', () => {
      const dd = calculateDrawdownAnalytics(DEMO_TRADES);
      expect(dd.points.length).toBe(100);
      expect(dd.maxDrawdownPct).toBeLessThanOrEqual(0);
      expect(dd.maxDrawdownDollar).toBeLessThanOrEqual(0);
    });

    it('handles empty trade array defensively', () => {
      const dd = calculateDrawdownAnalytics([]);
      expect(dd.points).toEqual([]);
      expect(dd.maxDrawdownPct).toBe(0);
      expect(dd.maxDrawdownDollar).toBe(0);
      expect(dd.avgDrawdownPct).toBe(0);
    });
  });
});


