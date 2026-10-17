# Notion Trading Analytics Dashboard

A production-ready, quantitative trading analytics dashboard built for NQ (Nasdaq) and ES (S&P 500) futures day traders. Deployed as a **Cloudflare Worker with Static Assets** on a free `workers.dev` URL, it connects securely to your Notion **Daily Trade Log** journal via the Notion API, displaying interactive analytics charts, win-rate expectancy, multi-tag mistake impacts, rule adherence discipline metrics, and cumulative realized-R equity curves.

---

## 1. Architecture & Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Vite (built into `./dist`).
- **Backend API**: Cloudflare Worker with Static Assets (`worker/index.ts`).
- **Static Assets Binding**: Vite `./dist` served directly via Cloudflare Worker Static Assets (`ASSETS` binding with SPA fallback).
- **Database / Source of Truth**: Notion Database (`Daily Trade Log`) — strictly **read-only**.
- **Runtime**: Serverless Cloudflare Worker, edge-native, zero continuous Node.js server, compatible with Cloudflare's **Free Tier** and custom/free `*.workers.dev` subdomain.

---

## 2. Security & Credentials Architecture

Server secrets (`NOTION_TOKEN`, `NOTION_DATABASE_ID`, `NOTION_DATA_SOURCE_ID`) are executed exclusively within the serverless Cloudflare Worker.
- **Zero Client Exposure**: Secrets are never sent to the browser, never baked into frontend JavaScript bundles, and excluded from source maps.
- **Git Protection**: `.gitignore` strictly excludes `.env*`, `.dev.vars`, and credentials.
- **Read-Only**: The backend function only executes Notion `POST /databases/{id}/query`. It contains no write, update, or delete capabilities.
- **API Isolation**: All `/api/*` routes are handled directly by the Worker and will never accidentally return `index.html`.

---

## 3. Quick Start (Local Development)

### Prerequisites
- Node.js >= 18 (Node 20+ recommended)
- npm >= 9

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Local Secrets
Copy `.dev.vars.example` to `.dev.vars`:
```bash
cp .dev.vars.example .dev.vars
```

Ensure `.dev.vars` contains:
```ini
NOTION_TOKEN="ntn_your_notion_token"
NOTION_DATABASE_ID="bc4cdd5b-c7d9-4c53-9c02-5111e5762d50"
# Or NOTION_DATA_SOURCE_ID="your_notion_data_source_id"
```

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). The Vite development server includes a local API handler that queries your Notion database directly.

Alternatively, to test the exact Cloudflare Worker runtime locally:
```bash
npm run build
npm run worker:dev
```

### Step 4: Run Tests
```bash
npm test
```
Executes all 26 unit tests verifying win rates, expectancy, profit factor, max drawdown, multi-tag mistake analysis, filter logic, and defensive Notion mapping.

---

## 4. Setting Up Your Notion Integration

If connecting a new database or integration from scratch:

1. Go to [Notion My Integrations](https://www.notion.so/profile/integrations).
2. Click **+ New integration**.
3. Name it `Trading Dashboard` and select your workspace.
4. Set capabilities to **Read content** (no update or insert needed).
5. Copy the **Internal Integration Secret** (`ntn_...`).
6. Open your **Daily Trade Log** database page in Notion:
   - Click the `...` menu in the top right.
   - Click **Connect to** (or **Add connections**).
   - Search for `Trading Dashboard` and approve the connection.
7. Copy the Database ID from the database URL:
   - URL structure: `https://www.notion.so/{workspace}/{DATABASE_ID}?v=...`
   - Example: `bc4cdd5b-c7d9-4c53-9c02-5111e5762d50`.

---

## 5. Notion Database Property Mapping

| Property Name in Notion | Notion Type | Dashboard Internal Mapping |
| :--- | :--- | :--- |
| **Trade** | Title | Trade setup label / title |
| **Date** | Date | Trade execution date (`YYYY-MM-DD`) |
| **Result** | Select | `Win`, `Loss`, `Break Even`, `No Trade` |
| **RR** | Number | Realized R / Planned RR unit (`+2.5`, `1.0`, etc.) |
| **Ticker** | Select | `NQ`, `ES`, `YM` |
| **Position** | Select | `Long`, `Short` |
| **Sequence** | Select | `Reversal`, `Continuation`, `Aligned` |
| **Rule Adherence** | Select / Checkbox | `Followed`, `Partially Followed`, `Broke Rules` |
| **Mistake** | Multi-select | `FOMO`, `Risk violation`, `Ignored bias`, etc. |
| **CiC** | Multi-select | Setup models (`SMTF`, `PSP`, `2stage PSP`, etc.) |
| **News** | Select | `8:30 CPI`, `8:30 NFP`, `2:00 FOMC`, `8:30 PPI`, `8:30 PCE` |
| **Screenshots** | Files & media | Attached chart images with modal viewer |

> **Note on Realized R vs. Planned RR:**
> When the `RR` number property is empty in your Notion database, the dashboard calculates Win Rate, Rule Adherence %, and Mistake frequencies while displaying `N/A` for Net R, Expectancy, and Equity Curve. Once you log the outcome R in Notion, the equity curve automatically plots.

---

## 6. Cloudflare Worker Deployment (workers.dev)

### Step 1: Build the Frontend Static Assets
```bash
npm run build
```
This compiles TypeScript and builds the Vite frontend into `./dist`.

### Step 2: Deploy the Cloudflare Worker
```bash
npx wrangler deploy
# or: npm run deploy
```
Wrangler will package `worker/index.ts` and attach the static assets in `./dist`. You will receive a live URL:
`https://notion-trading-dashboard.<your-subdomain>.workers.dev`

### Step 3: Set Server-Side Secrets
In production on Cloudflare Workers, secrets must be set securely via Wrangler CLI:

```bash
npx wrangler secret put NOTION_TOKEN
# Paste your Notion integration token: ntn_...

npx wrangler secret put NOTION_DATABASE_ID
# Paste: bc4cdd5b-c7d9-4c53-9c02-5111e5762d50
```
*(If you use `NOTION_DATA_SOURCE_ID`, you can set `npx wrangler secret put NOTION_DATA_SOURCE_ID` instead; the worker checks `NOTION_DATABASE_ID || NOTION_DATA_SOURCE_ID`).*

---

## 7. Troubleshooting & Verification Checklist

- [x] **`wrangler deploy` succeeds without Pages error**: `pages_build_output_dir` has been removed and replaced with modern `[assets]` static assets configuration.
- [x] **`/api/trades` returns JSON, not index.html**: The Worker explicitly handles `/api/trades` and all `/api/*` routes before delegating to `env.ASSETS.fetch`.
- [x] **200 OK / Empty Records?** Verify you have shared the database page with your integration ("Connect to" in Notion).
- [x] **401 Unauthorized?** Ensure `NOTION_TOKEN` has no leading or trailing whitespace.
- [x] **404 Object Not Found?** Double-check `NOTION_DATABASE_ID`. Do not use the view ID (the `v=...` query string).
- [x] **Missing RR values?** If Net R and Equity curve show N/A, check the Diagnostics modal in the header. Enter numeric R values in the `RR` property in Notion to unlock Realized R metrics.
- [x] **Expired Screenshot Links?** Notion S3 links expire after 1 hour by design. Clicking **Refresh** retrieves fresh signed image URLs.
- [x] **Cloudflare Free Tier Quota**: Free tier includes 100,000 Worker requests/day, which is more than sufficient for personal trading analytics.
