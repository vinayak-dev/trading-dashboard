import {
  BacktestTrade,
  BacktestColumnMapping,
  BacktestImportPreview,
  BacktestImportRowError,
  BacktestSession,
  BacktestDirection,
  BacktestResult
} from '../types/backtest';

/**
 * Robust CSV parser that handles quoted cells with commas and newlines
 */
export function parseCsvText(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      if (currentLine.trim().length > 0) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim().length > 0) {
    lines.push(currentLine);
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Parse header line
  const headers = parseLineIntoCells(lines[0]).map((h) => h.trim());

  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = parseLineIntoCells(lines[r]);
    // Skip empty lines
    if (cells.length === 1 && cells[0].trim() === '') continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      rowObj[header] = cells[idx] !== undefined ? cells[idx].trim() : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

function parseLineIntoCells(line: string): string[] {
  const cells: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      cells.push(currentCell);
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  cells.push(currentCell);
  return cells;
}

/**
 * Detects mapping from CSV headers to standard Backtest fields
 */
export function detectColumnMapping(headers: string[]): BacktestColumnMapping {
  const lowerMap = new Map<string, string>();
  headers.forEach((h) => lowerMap.set(h.toLowerCase().replace(/[^a-z0-9]/g, ''), h));

  const findHeader = (candidates: string[]): string => {
    for (const c of candidates) {
      const normalized = c.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (lowerMap.has(normalized)) {
        return lowerMap.get(normalized)!;
      }
    }
    // Partial search
    for (const [key, orig] of lowerMap.entries()) {
      for (const c of candidates) {
        const norm = c.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (key.includes(norm) || norm.includes(key)) {
          return orig;
        }
      }
    }
    return '';
  };

  return {
    tradeId: findHeader(['id', 'tradeid', 'ticket', 'ordernumber', 'ticketid']),
    entryDate: findHeader(['datestart', 'entrydate', 'date', 'opentime', 'datetime', 'opened']),
    entryTime: findHeader(['entrytime', 'timein', 'start_time', 'time']),
    exitDate: findHeader(['dateend', 'exitdate', 'closetime', 'closeddate', 'close_time']),
    exitTime: findHeader(['exittime', 'timeout', 'end_time']),
    instrument: findHeader(['pair', 'instrument', 'symbol', 'ticker', 'market', 'asset']),
    direction: findHeader(['side', 'direction', 'position', 'type', 'action', 'buysell']),
    netPnl: findHeader(['rpnl', 'netpnl', 'pnl', 'realizedpnl', 'profit', 'net_profit', 'return']),
    grossPnl: findHeader(['upnl', 'grosspnl', 'gross_profit', 'gross']),
    commission: findHeader(['commission', 'commissions', 'fee', 'fees', 'cost', 'swap']),
    entryPrice: findHeader(['entryprice', 'openprice', 'price', 'entry_price', 'avgentry']),
    exitPrice: findHeader(['avgcloseprice', 'exitprice', 'closeprice', 'exit_price', 'avgclose']),
    stopLoss: findHeader(['initialsl', 'stoploss', 'sl', 'stop_loss', 'stop']),
    takeProfit: findHeader(['maxtp', 'idealtp', 'takeprofit', 'tp', 'target']),
    quantity: findHeader(['amount', 'amountclosed', 'quantity', 'qty', 'contracts', 'size', 'lots', 'shares']),
    strategy: findHeader(['tags', 'strategy', 'setup', 'playbook', 'model', 'system']),
    riskAmount: findHeader(['risk', 'riskamount', 'initialrisk', 'riskdollar']),
    riskReward: findHeader(['avgriskreward', 'maxriskreward', 'rr', 'riskreward', 'r']),
    session: findHeader(['session', 'market_session', 'trading_session']),
    notes: findHeader(['notes', 'comment', 'description', 'journal'])
  };
}

/**
 * Normalizes ticker / instrument (e.g. CME_MINI:NQ1 -> NQ)
 */
export function normalizeInstrument(rawPair: string): string {
  if (!rawPair) return 'NQ';
  const clean = rawPair.trim().toUpperCase();

  if (clean.includes('NQ') || clean.includes('MNQ') || clean.includes('NASDAQ')) {
    return clean.includes('MNQ') ? 'MNQ' : 'NQ';
  }
  if (clean.includes('ES') || clean.includes('MES') || clean.includes('S&P') || clean.includes('SPX')) {
    return clean.includes('MES') ? 'MES' : 'ES';
  }
  if (clean.includes('YM') || clean.includes('MYM') || clean.includes('DOW')) {
    return clean.includes('MYM') ? 'MYM' : 'YM';
  }
  if (clean.includes('RTY') || clean.includes('M2K') || clean.includes('RUSSELL')) {
    return 'RTY';
  }
  if (clean.includes('CL') || clean.includes('CRUDE')) return 'CL';
  if (clean.includes('GC') || clean.includes('GOLD')) return 'GC';

  // If format CME_MINI:XYZ, strip prefix
  const parts = clean.split(':');
  if (parts.length > 1) {
    return parts[1].replace(/\d+$/, '');
  }

  return clean;
}

/**
 * Automatically calculates trading session from timestamp (EST based)
 */
export function deriveSessionFromTime(timeString?: string): BacktestSession {
  if (!timeString) return 'NY AM';

  // Extract hours from HH:mm:ss or ISO
  let hour = -1;
  const match = timeString.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    hour = parseInt(match[1], 10);
  }

  if (hour < 0) return 'NY AM';

  // Typical US/London trading hours in EST:
  // Asia/Overnight: 18:00 - 02:00
  // London: 02:00 - 08:30
  // NY AM: 08:30 - 12:00
  // NY PM: 12:00 - 16:00
  if (hour >= 18 || hour < 2) return 'Asia';
  if (hour >= 2 && hour < 8) return 'London';
  if (hour >= 8 && hour < 12) return 'NY AM';
  if (hour >= 12 && hour < 16) return 'NY PM';
  return 'Other';
}

/**
 * Converts date strings in formats YYYY/MM/DD, DD/MM/YYYY, or ISO into YYYY-MM-DD
 */
export function normalizeDate(dateVal: string): { date: string; time?: string } {
  if (!dateVal) return { date: '' };
  const trimmed = dateVal.trim();

  // Check if date contains time (e.g. "2025/12/18 09:05:56" or "2025-12-18T09:05:56")
  let datePart = trimmed;
  let timePart: string | undefined = undefined;

  if (trimmed.includes(' ') || trimmed.includes('T')) {
    const splitChar = trimmed.includes('T') ? 'T' : ' ';
    const parts = trimmed.split(splitChar);
    datePart = parts[0];
    timePart = parts[1] ? parts[1].replace(/Z$/, '').trim() : undefined;
  }

  // Handle YYYY/MM/DD or YYYY-MM-DD
  const ymd = datePart.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymd) {
    const y = ymd[1];
    const m = ymd[2].padStart(2, '0');
    const d = ymd[3].padStart(2, '0');
    return { date: `${y}-${m}-${d}`, time: timePart };
  }

  // Handle MM/DD/YYYY
  const mdy = datePart.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (mdy) {
    const m = mdy[1].padStart(2, '0');
    const d = mdy[2].padStart(2, '0');
    const y = mdy[3];
    return { date: `${y}-${m}-${d}`, time: timePart };
  }

  // Fallback to Date parser
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    const time = `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}:${String(parsed.getSeconds()).padStart(2, '0')}`;
    return { date: `${y}-${m}-${d}`, time: timePart || time };
  }

  return { date: datePart, time: timePart };
}

/**
 * Validates and converts parsed CSV rows into BacktestTrade records based on column mapping
 */
export function validateAndConvertRows(
  rows: Record<string, string>[],
  mapping: BacktestColumnMapping,
  existingIds: Set<string> = new Set()
): BacktestImportPreview {
  const validRows: BacktestTrade[] = [];
  const errors: BacktestImportRowError[] = [];
  const duplicateIds: string[] = [];
  const seenIdsInBatch = new Set<string>();

  rows.forEach((row, idx) => {
    const rowIndex = idx + 2; // 1-based, accounting for header

    // 1. Entry Date (Mandatory)
    const rawDateVal = mapping.entryDate ? row[mapping.entryDate] : '';
    const { date: entryDate, time: entryTimeFromDate } = normalizeDate(rawDateVal);

    if (!entryDate || !entryDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      errors.push({
        rowIndex,
        message: `Row ${rowIndex}: Invalid or missing entry date ("${rawDateVal}"). Expected format YYYY/MM/DD or YYYY-MM-DD.`,
        raw: row
      });
      return;
    }

    // 2. Net P&L (Mandatory)
    const rawNetPnl = mapping.netPnl ? row[mapping.netPnl] : '';
    const cleanNetPnl = rawNetPnl.replace(/[$, ]/g, '');
    const netPnlNum = parseFloat(cleanNetPnl);

    if (isNaN(netPnlNum)) {
      errors.push({
        rowIndex,
        message: `Row ${rowIndex}: Invalid or missing realized P&L value ("${rawNetPnl}").`,
        raw: row
      });
      return;
    }

    // 3. Direction
    let direction: BacktestDirection = 'Long';
    if (mapping.direction && row[mapping.direction]) {
      const d = row[mapping.direction].trim().toLowerCase();
      if (d === 'sell' || d === 'short' || d === 's') {
        direction = 'Short';
      }
    }

    // 4. Instrument
    const rawInstrument = mapping.instrument ? row[mapping.instrument] : '';
    const instrument = normalizeInstrument(rawInstrument);

    // 5. Entry Time
    const explicitEntryTime = mapping.entryTime ? row[mapping.entryTime] : '';
    const finalEntryTime = explicitEntryTime || entryTimeFromDate || undefined;

    // 6. Exit Date & Time
    const rawExitDateVal = mapping.exitDate ? row[mapping.exitDate] : '';
    const { date: exitDate, time: exitTimeFromDate } = normalizeDate(rawExitDateVal);
    const explicitExitTime = mapping.exitTime ? row[mapping.exitTime] : '';
    const finalExitTime = explicitExitTime || exitTimeFromDate || undefined;

    // 7. Prices & Stop Loss / Take Profit
    const parseNum = (field: string): number | undefined => {
      if (!field || !row[field]) return undefined;
      const num = parseFloat(row[field].replace(/[$, ]/g, ''));
      return isNaN(num) ? undefined : num;
    };

    const entryPrice = parseNum(mapping.entryPrice);
    const exitPrice = parseNum(mapping.exitPrice);
    const stopLoss = parseNum(mapping.stopLoss);
    const takeProfit = parseNum(mapping.takeProfit);
    const quantity = parseNum(mapping.quantity);
    const grossPnl = parseNum(mapping.grossPnl);
    const commission = parseNum(mapping.commission) || 0;
    const riskAmount = parseNum(mapping.riskAmount);
    let riskReward = parseNum(mapping.riskReward);

    // If RR not explicit, calculate from prices if available
    if (riskReward === undefined && entryPrice && stopLoss && exitPrice) {
      const riskPerUnit = Math.abs(entryPrice - stopLoss);
      if (riskPerUnit > 0) {
        const rewardPerUnit = direction === 'Long' ? exitPrice - entryPrice : entryPrice - exitPrice;
        riskReward = Number((rewardPerUnit / riskPerUnit).toFixed(2));
      }
    }

    // 8. Result (Win, Loss, Breakeven)
    let result: BacktestResult = 'Breakeven';
    if (netPnlNum > 0.01) result = 'Win';
    else if (netPnlNum < -0.01) result = 'Loss';

    // 9. Session
    let session: BacktestSession = 'NY AM';
    if (mapping.session && row[mapping.session]) {
      const s = row[mapping.session].trim().toLowerCase();
      if (s.includes('asia') || s.includes('overnight')) session = 'Asia';
      else if (s.includes('london')) session = 'London';
      else if (s.includes('pm') || s.includes('afternoon')) session = 'NY PM';
      else if (s.includes('am') || s.includes('morning')) session = 'NY AM';
      else session = 'Other';
    } else {
      session = deriveSessionFromTime(finalEntryTime);
    }

    // 10. Strategy / Setup / Tags
    const strategy = mapping.strategy && row[mapping.strategy] ? row[mapping.strategy].trim() : undefined;
    const notes = mapping.notes && row[mapping.notes] ? row[mapping.notes].trim() : undefined;

    // 11. Stable Trade ID
    const rawId = mapping.tradeId && row[mapping.tradeId] ? row[mapping.tradeId].trim() : '';
    const tradeId = rawId || `bt-${entryDate}-${rowIndex}-${Math.random().toString(36).substring(2, 6)}`;

    // Check duplicates
    if (rawId && (existingIds.has(rawId) || seenIdsInBatch.has(rawId))) {
      duplicateIds.push(rawId);
    }
    if (rawId) seenIdsInBatch.add(rawId);

    const backtestTrade: BacktestTrade = {
      id: tradeId,
      tradeId: rawId || undefined,
      entryDate,
      entryTime: finalEntryTime,
      exitDate: exitDate || undefined,
      exitTime: finalExitTime,
      instrument,
      strategy: strategy || undefined,
      direction,
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      quantity,
      grossPnl: grossPnl !== undefined ? grossPnl : netPnlNum + commission,
      commission,
      netPnl: netPnlNum,
      riskAmount,
      riskReward,
      result,
      session,
      notes,
      tags: strategy ? [strategy] : [],
      importedAt: new Date().toISOString(),
      rawRow: row
    };

    validRows.push(backtestTrade);
  });

  return {
    headers: Object.keys(rows[0] || {}),
    totalRows: rows.length,
    validRows,
    errors,
    duplicateIds: Array.from(new Set(duplicateIds)),
    detectedMapping: mapping
  };
}
