import { describe, it, expect } from 'vitest';
import {
  parseCsvText,
  detectColumnMapping,
  validateAndConvertRows,
  normalizeInstrument,
  deriveSessionFromTime
} from '../src/lib/backtest-csv-parser';
import { calculateBacktestAnalytics, filterBacktestTrades } from '../src/lib/backtest-calculations';
import { SAMPLE_BACKTEST_CSV } from '../src/lib/backtest-sample-data';
import { BacktestTrade, BacktestFilters } from '../src/types/backtest';

describe('Backtest CSV Parser', () => {
  it('parses the user backtesting-analytics.csv sample perfectly', () => {
    const { headers, rows } = parseCsvText(SAMPLE_BACKTEST_CSV);
    expect(headers).toContain('id');
    expect(headers).toContain('dateStart');
    expect(headers).toContain('dateEnd');
    expect(headers).toContain('pair');
    expect(headers).toContain('rPnL');
    expect(headers).toContain('side');
    expect(rows.length).toBe(6);

    const mapping = detectColumnMapping(headers);
    expect(mapping.tradeId).toBe('id');
    expect(mapping.entryDate).toBe('dateStart');
    expect(mapping.exitDate).toBe('dateEnd');
    expect(mapping.instrument).toBe('pair');
    expect(mapping.netPnl).toBe('rPnL');
    expect(mapping.direction).toBe('side');
    expect(mapping.entryPrice).toBe('entryPrice');
    expect(mapping.exitPrice).toBe('avgClosePrice');
    expect(mapping.quantity).toBe('amount');

    const preview = validateAndConvertRows(rows, mapping);
    expect(preview.validRows.length).toBe(6);
    expect(preview.errors.length).toBe(0);

    const firstTrade = preview.validRows[0];
    expect(firstTrade.id).toBe('284118683');
    expect(firstTrade.entryDate).toBe('2025-12-18');
    expect(firstTrade.entryTime).toBe('09:05:56');
    expect(firstTrade.instrument).toBe('NQ');
    expect(firstTrade.direction).toBe('Long');
    expect(firstTrade.netPnl).toBe(340);
    expect(firstTrade.result).toBe('Win');
    expect(firstTrade.session).toBe('NY AM');
  });

  it('normalizes various instruments correctly', () => {
    expect(normalizeInstrument('CME_MINI:NQ1')).toBe('NQ');
    expect(normalizeInstrument('CME_MINI:ES1')).toBe('ES');
    expect(normalizeInstrument('CME_MINI:MNQ1')).toBe('MNQ');
    expect(normalizeInstrument('MES')).toBe('MES');
    expect(normalizeInstrument('NQ')).toBe('NQ');
  });

  it('derives trading sessions accurately', () => {
    expect(deriveSessionFromTime('09:30:00')).toBe('NY AM');
    expect(deriveSessionFromTime('13:45:00')).toBe('NY PM');
    expect(deriveSessionFromTime('04:15:00')).toBe('London');
    expect(deriveSessionFromTime('21:00:00')).toBe('Asia');
  });

  it('detects duplicate trade IDs in file and existing database', () => {
    const csvWithDuplicates = `id,dateStart,rPnL
1001,2025-01-01,150
1001,2025-01-02,200
1002,2025-01-03,-100`;

    const { headers, rows } = parseCsvText(csvWithDuplicates);
    const mapping = detectColumnMapping(headers);
    const existing = new Set(['1002']);

    const preview = validateAndConvertRows(rows, mapping, existing);
    expect(preview.validRows.length).toBe(3);
    expect(preview.duplicateIds).toContain('1001');
    expect(preview.duplicateIds).toContain('1002');
  });

  it('reports invalid rows without crashing or silently dropping data', () => {
    const csvWithErrors = `id,dateStart,rPnL
1,invalid-date,100
2,2025-01-02,not-a-number
3,2025-01-03,300`;

    const { headers, rows } = parseCsvText(csvWithErrors);
    const mapping = detectColumnMapping(headers);
    const preview = validateAndConvertRows(rows, mapping);

    expect(preview.validRows.length).toBe(1);
    expect(preview.errors.length).toBe(2);
    expect(preview.errors[0].rowIndex).toBe(2);
    expect(preview.errors[1].rowIndex).toBe(3);
  });
});

describe('Backtest Analytics Calculations', () => {
  const sampleTrades: BacktestTrade[] = [
    {
      id: '1',
      entryDate: '2025-01-01',
      entryTime: '09:30:00',
      instrument: 'NQ',
      direction: 'Long',
      netPnl: 500,
      grossPnl: 505,
      commission: 5,
      result: 'Win',
      session: 'NY AM',
      strategy: 'Breakout',
      importedAt: '2025-01-01'
    },
    {
      id: '2',
      entryDate: '2025-01-02',
      entryTime: '10:15:00',
      instrument: 'NQ',
      direction: 'Short',
      netPnl: -200,
      grossPnl: -195,
      commission: 5,
      result: 'Loss',
      session: 'NY AM',
      strategy: 'Breakout',
      importedAt: '2025-01-02'
    },
    {
      id: '3',
      entryDate: '2025-01-03',
      entryTime: '14:00:00',
      instrument: 'ES',
      direction: 'Long',
      netPnl: 300,
      grossPnl: 305,
      commission: 5,
      result: 'Win',
      session: 'NY PM',
      strategy: 'Pullback',
      importedAt: '2025-01-03'
    }
  ];

  it('calculates KPIs correctly for sample trades', () => {
    const analytics = calculateBacktestAnalytics(sampleTrades, 50000);
    const kpis = analytics.kpis;

    expect(kpis.totalTrades).toBe(3);
    expect(kpis.winningTrades).toBe(2);
    expect(kpis.losingTrades).toBe(1);
    expect(kpis.winRate).toBe(66.67);
    expect(kpis.totalNetPnl).toBe(600); // 500 - 200 + 300
    expect(kpis.totalCommissions).toBe(15);
    expect(kpis.profitFactor).toBe(4); // 800 gross wins / 200 gross losses = 4.0
    expect(kpis.averageWin).toBe(400); // 800 / 2
    expect(kpis.averageLoss).toBe(200); // 200 / 1
    expect(kpis.expectancy).toBe(200); // 600 / 3
  });

  it('safely handles zero trades without division by zero', () => {
    const analytics = calculateBacktestAnalytics([], 50000);
    expect(analytics.kpis.totalTrades).toBe(0);
    expect(analytics.kpis.profitFactor).toBeNull();
    expect(analytics.kpis.winRate).toBe(0);
    expect(analytics.equityCurve.length).toBe(0);
  });

  it('safely handles zero losses with capped profit factor', () => {
    const winTradesOnly = [sampleTrades[0], sampleTrades[2]];
    const analytics = calculateBacktestAnalytics(winTradesOnly, 50000);
    expect(analytics.kpis.winningTrades).toBe(2);
    expect(analytics.kpis.losingTrades).toBe(0);
    expect(analytics.kpis.profitFactor).toBe(99.99); // Clamped, not NaN or Infinity
  });

  it('filters trades accurately across multiple criteria', () => {
    const filters: BacktestFilters = {
      search: 'Pullback',
      dateRange: 'all',
      instruments: [],
      directions: [],
      results: [],
      strategies: [],
      sessions: []
    };

    const filtered = filterBacktestTrades(sampleTrades, filters);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('3');
  });
});
