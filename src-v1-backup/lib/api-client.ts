import { NotionFetchResponse } from '../types/trade';
import { DEMO_TRADES } from './demo-data';

let cachedResponse: NotionFetchResponse | null = null;
let inFlightPromise: Promise<NotionFetchResponse> | null = null;

export async function fetchTradesData(options?: {
  forceRefresh?: boolean;
  mode?: 'live' | 'demo';
}): Promise<NotionFetchResponse> {
  const mode = options?.mode || 'live';

  if (mode === 'demo') {
    return {
      success: true,
      source: 'demo',
      fetchedAt: new Date().toISOString(),
      totalRecords: DEMO_TRADES.length,
      trades: DEMO_TRADES,
      schemaDetails: {
        propertiesPresent: ['Date', 'Result', 'Ticker', 'Position', 'Sequence', 'Rule Adherence', 'Mistake', 'RR', 'CiC', 'News', 'Screenshots'],
        recordsWithRR: DEMO_TRADES.filter(t => t.rawRR !== null).length,
        recordsWithResult: DEMO_TRADES.filter(t => t.result !== null).length,
        recordsWithDate: DEMO_TRADES.filter(t => t.date !== null).length,
        recordsWithTicker: DEMO_TRADES.filter(t => t.ticker !== null).length,
      }
    };
  }

  // If already fetched and not forced refresh, return memory cache
  if (!options?.forceRefresh && cachedResponse && cachedResponse.source === 'notion') {
    return cachedResponse;
  }

  // Prevent duplicate concurrent requests
  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const response = await fetch('/api/trades', {
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          source: 'notion',
          fetchedAt: new Date().toISOString(),
          totalRecords: 0,
          trades: [],
          error: data.error || `HTTP error ${response.status}: Failed to retrieve trades from Notion.`,
        };
      }

      cachedResponse = data;
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      return {
        success: false,
        source: 'notion',
        fetchedAt: new Date().toISOString(),
        totalRecords: 0,
        trades: [],
        error: `Could not reach /api/trades: ${message}. Is Cloudflare Pages or Vite dev server running?`,
      };
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

export function clearTradeCache() {
  cachedResponse = null;
}
