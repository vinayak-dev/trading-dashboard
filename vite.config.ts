import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Local Vite dev middleware to simulate Cloudflare Pages Function /api/trades
function notionDevApiPlugin() {
  return {
    name: 'notion-dev-api',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && (req.url === '/api/trades' || req.url.startsWith('/api/trades?'))) {
          try {
            // Load .dev.vars if present
            let token = process.env.NOTION_TOKEN;
            let databaseId = process.env.NOTION_DATABASE_ID || process.env.NOTION_DATA_SOURCE_ID;

            const devVarsPath = path.resolve(process.cwd(), '.dev.vars');
            if (fs.existsSync(devVarsPath)) {
              const content = fs.readFileSync(devVarsPath, 'utf-8');
              for (const line of content.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx !== -1) {
                  const key = trimmed.slice(0, eqIdx).trim();
                  let val = trimmed.slice(eqIdx + 1).trim();
                  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                  }
                  if (key === 'NOTION_TOKEN' && !token) token = val;
                  if (key === 'NOTION_DATABASE_ID' && !databaseId) databaseId = val;
                  if (key === 'NOTION_DATA_SOURCE_ID' && !databaseId) databaseId = val;
                }
              }
            }

            if (!token || !databaseId) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                error: 'NOTION_TOKEN or NOTION_DATABASE_ID missing in .dev.vars. Ensure .dev.vars is populated.',
                source: 'notion'
              }));
              return;
            }

            // Query Notion API
            const allPages = [];
            let hasMore = true;
            let nextCursor: string | undefined = undefined;
            let iterations = 0;

            while (hasMore && iterations < 10) {
              iterations++;
              const payload: any = {
                page_size: 100,
                sorts: [{ property: 'Date', direction: 'descending' }],
              };
              if (nextCursor) payload.start_cursor = nextCursor;

              const notionRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Notion-Version': '2022-06-28',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
              });

              if (!notionRes.ok) {
                const errText = await notionRes.text();
                res.statusCode = notionRes.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: `Notion API error: ${errText}`,
                  source: 'notion'
                }));
                return;
              }

              const data: any = await notionRes.json();
              if (data.results) allPages.push(...data.results);
              hasMore = Boolean(data.has_more);
              nextCursor = data.next_cursor || undefined;
            }

            // Map using internal mapping logic
            const { mapNotionPageToTrade } = await server.ssrLoadModule('/src/lib/notion-mapper.ts');
            const trades = allPages.map((page: any) => mapNotionPageToTrade(page));

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

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
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
              }
            }));
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              error: e.message || 'Internal error in Vite dev server',
              source: 'notion'
            }));
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), notionDevApiPlugin()],
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-vendor')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  }
});
