import { mapNotionPageToTrade } from '../../src/lib/notion-mapper';

interface Env {
  NOTION_TOKEN?: string;
  NOTION_DATABASE_ID?: string;
  NOTION_DATA_SOURCE_ID?: string;
}

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

export const onRequestGet = async (context: { env: Env; request: Request }): Promise<Response> => {
  const token = context.env.NOTION_TOKEN;
  // Database ID can be stored in NOTION_DATABASE_ID or NOTION_DATA_SOURCE_ID
  const databaseId = context.env.NOTION_DATABASE_ID || context.env.NOTION_DATA_SOURCE_ID;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };

  if (!token) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'NOTION_TOKEN secret is not configured on Cloudflare. Set NOTION_TOKEN in your Cloudflare dashboard or .dev.vars.',
        source: 'notion',
      }),
      { status: 500, headers }
    );
  }

  if (!databaseId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'NOTION_DATABASE_ID environment variable is missing. Set NOTION_DATABASE_ID with your Notion Database UUID.',
        source: 'notion',
      }),
      { status: 500, headers }
    );
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allPages: any[] = [];
    let hasMore = true;
    let nextCursor: string | undefined = undefined;
    let iterations = 0;
    const MAX_PAGES = 10; // Safety cap: up to 1,000 records on free worker limits

    while (hasMore && iterations < MAX_PAGES) {
      iterations++;
      const payload: { page_size: number; start_cursor?: string; sorts?: Array<{ property: string; direction: string }> } = {
        page_size: 100,
        sorts: [{ property: 'Date', direction: 'descending' }],
      };
      if (nextCursor) {
        payload.start_cursor = nextCursor;
      }

      const notionResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!notionResponse.ok) {
        const errorStatus = notionResponse.status;
        const errorText = await notionResponse.text();
        let message = `Notion API responded with status ${errorStatus}`;

        if (errorStatus === 401) {
          message = 'Invalid Notion Token. Please check your NOTION_TOKEN secret.';
        } else if (errorStatus === 404) {
          message = 'Database not found. Please confirm the database ID and ensure you have invited/connected the integration to your "Daily Trade Log" page in Notion.';
        } else if (errorStatus === 429) {
          message = 'Notion API rate limit reached. Please wait a moment and try refreshing again.';
        } else {
          try {
            const parsed = JSON.parse(errorText);
            if (parsed.message) message = parsed.message;
          } catch {
            // Keep status message
          }
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: message,
            statusCode: errorStatus,
            source: 'notion',
          }),
          { status: 502, headers }
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await notionResponse.json();
      if (data.results && Array.isArray(data.results)) {
        allPages.push(...data.results);
      }

      hasMore = Boolean(data.has_more);
      nextCursor = data.next_cursor || undefined;
    }

    // Map all pages into standardized TradeRecord
    const trades = allPages.map(page => mapNotionPageToTrade(page));

    // Calculate schema summary stats to help user identify missing properties
    let recordsWithRR = 0;
    let recordsWithResult = 0;
    let recordsWithDate = 0;
    let recordsWithTicker = 0;

    for (const trade of trades) {
      if (trade.rawRR !== null) recordsWithRR++;
      if (trade.result !== null) recordsWithResult++;
      if (trade.date !== null) recordsWithDate++;
      if (trade.ticker !== null) recordsWithTicker++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        source: 'notion',
        databaseId,
        fetchedAt: new Date().toISOString(),
        totalRecords: trades.length,
        trades,
        schemaDetails: {
          propertiesPresent: ['Date', 'Result', 'Ticker', 'Position', 'Sequence', 'Rule Adherence', 'Mistake', 'RR', 'CiC', 'News', 'Screenshots'],
          recordsWithRR,
          recordsWithResult,
          recordsWithDate,
          recordsWithTicker,
        },
      }),
      { status: 200, headers }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown network failure while connecting to Notion';
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to query Notion API: ${errorMessage}`,
        source: 'notion',
      }),
      { status: 500, headers }
    );
  }
};
