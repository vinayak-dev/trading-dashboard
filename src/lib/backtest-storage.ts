import { BacktestTrade } from '../types/backtest';

const DB_NAME = 'NotionTradingBacktestDB';
const DB_VERSION = 1;
const STORE_NAME = 'backtest_trades';
const LOCAL_STORAGE_KEY = 'notion_trading_backtest_trades_fallback';

/**
 * Open or create IndexedDB instance
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('entryDate', 'entryDate', { unique: false });
        store.createIndex('instrument', 'instrument', { unique: false });
        store.createIndex('tradeId', 'tradeId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Fallback to localStorage if IndexedDB is blocked
 */
function getFromLocalStorage(): BacktestTrade[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to read from localStorage fallback', e);
    return [];
  }
}

function saveToLocalStorage(trades: BacktestTrade[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trades));
  } catch (e) {
    console.warn('Failed to save to localStorage fallback', e);
  }
}

/**
 * Retrieves all stored backtest trades
 */
export async function getAllBacktestTrades(): Promise<BacktestTrade[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const trades = (request.result as BacktestTrade[]) || [];
        // Sort chronologically by entry date and time
        trades.sort((a, b) => {
          const dtA = `${a.entryDate} ${a.entryTime || '00:00:00'}`;
          const dtB = `${b.entryDate} ${b.entryTime || '00:00:00'}`;
          return dtA.localeCompare(dtB);
        });
        resolve(trades);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB unavailable, using localStorage fallback', err);
    return getFromLocalStorage();
  }
}

/**
 * Saves a list of imported trades with duplicate detection
 */
export async function saveBacktestTrades(
  newTrades: BacktestTrade[],
  onConflict: 'skip' | 'overwrite' = 'skip'
): Promise<{ saved: number; skipped: number; updated: number }> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const existingTrades: BacktestTrade[] = getAllRequest.result || [];
        const existingIdMap = new Map<string, BacktestTrade>();

        existingTrades.forEach((t) => {
          existingIdMap.set(t.id, t);
          if (t.tradeId) existingIdMap.set(t.tradeId, t);
        });

        let saved = 0;
        let skipped = 0;
        let updated = 0;

        for (const trade of newTrades) {
          const duplicate = existingIdMap.get(trade.id) || (trade.tradeId ? existingIdMap.get(trade.tradeId) : undefined);

          if (duplicate) {
            if (onConflict === 'overwrite') {
              store.put(trade);
              updated++;
            } else {
              skipped++;
            }
          } else {
            store.add(trade);
            existingIdMap.set(trade.id, trade);
            if (trade.tradeId) existingIdMap.set(trade.tradeId, trade);
            saved++;
          }
        }

        transaction.oncomplete = () => {
          resolve({ saved, skipped, updated });
        };
        transaction.onerror = () => reject(transaction.error);
      };

      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
  } catch (err) {
    console.warn('IndexedDB unavailable, falling back to localStorage', err);
    const existing = getFromLocalStorage();
    const existingIdMap = new Map(existing.map((t) => [t.id, t]));
    let saved = 0;
    let skipped = 0;
    let updated = 0;

    for (const trade of newTrades) {
      if (existingIdMap.has(trade.id)) {
        if (onConflict === 'overwrite') {
          existingIdMap.set(trade.id, trade);
          updated++;
        } else {
          skipped++;
        }
      } else {
        existingIdMap.set(trade.id, trade);
        saved++;
      }
    }

    saveToLocalStorage(Array.from(existingIdMap.values()));
    return { saved, skipped, updated };
  }
}

/**
 * Updates an individual trade
 */
export async function updateBacktestTrade(trade: BacktestTrade): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(trade);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    const existing = getFromLocalStorage();
    const idx = existing.findIndex((t) => t.id === trade.id);
    if (idx >= 0) {
      existing[idx] = trade;
      saveToLocalStorage(existing);
    }
  }
}

/**
 * Deletes trades by their ID
 */
export async function deleteBacktestTrades(ids: string[]): Promise<void> {
  const idSet = new Set(ids);
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      ids.forEach((id) => store.delete(id));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    const existing = getFromLocalStorage();
    const filtered = existing.filter((t) => !idSet.has(t.id));
    saveToLocalStorage(filtered);
  }
}

/**
 * Clears all backtest records
 */
export async function clearAllBacktestTrades(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }
}

/**
 * Export trade records to a clean CSV format
 */
export function exportBacktestTradesToCsv(trades: BacktestTrade[]): string {
  if (trades.length === 0) return '';

  const headers = [
    'Trade ID',
    'Entry Date',
    'Entry Time',
    'Exit Date',
    'Exit Time',
    'Instrument',
    'Direction',
    'Net P&L',
    'Gross P&L',
    'Commission',
    'Entry Price',
    'Exit Price',
    'Stop Loss',
    'Take Profit',
    'Quantity',
    'Strategy',
    'Session',
    'Result',
    'Risk:Reward',
    'Notes'
  ];

  const rows = trades.map((t) => [
    t.tradeId || t.id,
    t.entryDate,
    t.entryTime || '',
    t.exitDate || '',
    t.exitTime || '',
    t.instrument,
    t.direction,
    t.netPnl.toFixed(2),
    t.grossPnl !== undefined ? t.grossPnl.toFixed(2) : t.netPnl.toFixed(2),
    t.commission !== undefined ? t.commission.toFixed(2) : '0.00',
    t.entryPrice !== undefined ? t.entryPrice : '',
    t.exitPrice !== undefined ? t.exitPrice : '',
    t.stopLoss !== undefined ? t.stopLoss : '',
    t.takeProfit !== undefined ? t.takeProfit : '',
    t.quantity !== undefined ? t.quantity : '',
    t.strategy || '',
    t.session || '',
    t.result,
    t.riskReward !== undefined ? t.riskReward.toFixed(2) : '',
    (t.notes || '').replace(/"/g, '""')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((field) => `"${field}"`).join(','))
  ].join('\n');

  return csvContent;
}
