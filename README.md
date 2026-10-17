# Notion Trading Analytics Dashboard

A production-ready, quantitative trading analytics dashboard built for NQ (Nasdaq) and ES (S&P 500) futures day traders. It connects directly and securely to your Notion **Daily Trade Log** journal via the Notion API, displaying interactive analytics charts, win-rate expectancy, multi-tag mistake impacts, rule adherence discipline metrics, and cumulative realized-R equity curves.

---

## 1. Architecture & Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Vite.
- **Backend API**: Cloudflare Pages Functions (`functions/api/trades.ts`).
- **Database / Source of Truth**: Notion Database (`Daily Trade Log`) — strictly **read-only**.
- **Runtime**: 100% serverless, edge-native, zero continuous Node.js server, compatible with Cloudflare's **Free Tier**.

---

## 2. Security & Credentials Architecture

Server secrets (`NOTION_TOKEN`, `NOTION_DATABASE_ID`) are executed exclusively within Cloudflare serverless edge functions.
- **Zero Client Exposure**: Secrets are never sent to the browser, never baked into frontend JavaScript bundles, and excluded from source maps.
- **Git Protection**: `.gitignore` strictly excludes `.env*`, `.dev.vars`, and credentials.
- **Read-Only**: The backend function only executes Notion `POST /databases/{id}/query`. It contains no write, update, or delete capabilities.

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
```

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). The Vite development server includes a local API handler that queries your Notion database directly.

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

## 6. Access Protection (Private Dashboard Security)

Because this dashboard displays your personal financial journal, do not leave it publicly open on the internet:

### Recommended: Cloudflare Zero Trust (Cloudflare Access) — Free Tier
1. In Cloudflare Dashboard, go to **Zero Trust** -> **Access** -> **Applications**.
2. Click **Add an application** -> **Self-hosted**.
3. Name: `Trading Journal Analytics`.
4. Domain: Point to your Cloudflare Pages domain (e.g. `trading.yourdomain.com` or `*.pages.dev`).
5. Add a Policy:
   - Action: `Allow`
   - Rule: `Include Emails` -> enter your personal email address.
6. Now whenever you visit the dashboard, Cloudflare prompts for a one-time PIN sent to your email before letting anyone access the page or `/api/trades`.

---

## 7. Cloudflare Pages Deployment

### Option A: One-Command Wrangler CLI Deploy
Build the frontend and deploy the site along with Pages Functions:

```bash
# 1. Build the production bundle
npm run build

# 2. Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=notion-trading-dashboard
```

### Option B: Configure Cloudflare Secrets in Production
After deployment, set the secrets in Cloudflare:

```bash
npx wrangler pages secret put NOTION_TOKEN
# Paste your token: ntn_...

npx wrangler pages secret put NOTION_DATABASE_ID
# Paste: bc4cdd5b-c7d9-4c53-9c02-5111e5762d50
```

Or configure via the Cloudflare Web Dashboard:
1. Navigate to **Workers & Pages** -> **notion-trading-dashboard**.
2. Go to **Settings** -> **Environment variables**.
3. Add `NOTION_TOKEN` (encrypt as secret) and `NOTION_DATABASE_ID`.

---

## 8. Troubleshooting & Verification Checklist

- [x] **200 OK / Empty Records?** Verify you have shared the database page with your integration ("Connect to" in Notion).
- [x] **401 Unauthorized?** Ensure `NOTION_TOKEN` has no leading or trailing whitespace.
- [x] **404 Object Not Found?** Double-check `NOTION_DATABASE_ID`. Do not use the view ID (the `v=...` query string).
- [x] **Missing RR values?** If Net R and Equity curve show N/A, check the Diagnostics modal in the header. Enter numeric R values in the `RR` property in Notion to unlock Realized R metrics.
- [x] **Expired Screenshot Links?** Notion S3 links expire after 1 hour by design. Clicking **Refresh** retrieves fresh signed image URLs.
- [x] **Cloudflare Free Tier Quota**: Free tier includes 100,000 Worker requests/day, which is more than sufficient for on-demand personal trading analytics.
