import {
  TradeRecord,
  TradeResult,
  RuleAdherence,
  TradePosition,
  TradeTicker,
  TradeSequence,
  ScreenshotFile
} from '../types/trade';
import { resolveRealizedR } from './calculations';

/**
 * Normalizes raw Notion API page object into a strongly typed TradeRecord.
 * Defensively handles missing properties, varying property types (e.g. checkbox vs select),
 * and unknown options.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapNotionPageToTrade(page: any): TradeRecord {
  const props = page.properties || {};

  // 1. Title / Name ("Trade" or fallback to any title property)
  let title = 'Untitled Trade';
  const titleProp = props['Trade'] || Object.values(props).find((p: any) => p?.type === 'title');
  if (titleProp?.title && Array.isArray(titleProp.title) && titleProp.title.length > 0) {
    title = titleProp.title.map((t: any) => t.plain_text || '').join('').trim() || 'Untitled Trade';
  }

  // 2. Date
  let date: string | null = null;
  let dateTime: string | null = null;
  const dateProp = props['Date'];
  if (dateProp?.type === 'date' && dateProp.date?.start) {
    const rawDate = dateProp.date.start;
    if (rawDate.includes('T')) {
      dateTime = rawDate;
      date = rawDate.split('T')[0];
    } else {
      date = rawDate;
    }
  } else if (page.created_time) {
    // If no explicit date property, fallback to created_time date
    date = page.created_time.split('T')[0];
    dateTime = page.created_time;
  }

  // 3. Result: 'Win' | 'Loss' | 'Break Even' | 'No Trade'
  let result: TradeResult | null = null;
  const resultProp = props['Result'];
  if (resultProp?.type === 'select' && resultProp.select?.name) {
    const rawResultName = resultProp.select.name.trim();
    const normalized = rawResultName.toLowerCase().replace(/[^a-z]/g, '');
    if (normalized === 'win') result = 'Win';
    else if (normalized === 'loss') result = 'Loss';
    else if (normalized === 'breakeven' || normalized === 'be') result = 'Break Even';
    else if (normalized === 'notrade' || normalized === 'no') result = 'No Trade';
    else result = rawResultName as TradeResult;
  }

  // 4. Rule Adherence: 'Followed' | 'Partially Followed' | 'Broke Rules'
  let ruleAdherence: RuleAdherence | null = null;
  const ruleProp = props['Rule Adherence'] || props['Plan Followed'] || props['Adherence'];
  if (ruleProp?.type === 'select' && ruleProp.select?.name) {
    const rawRule = ruleProp.select.name.trim();
    const lower = rawRule.toLowerCase();
    if (lower.includes('followed') && !lower.includes('partially')) {
      ruleAdherence = 'Followed';
    } else if (lower.includes('partial')) {
      ruleAdherence = 'Partially Followed';
    } else if (lower.includes('broke') || lower.includes('broken') || lower.includes('violated')) {
      ruleAdherence = 'Broke Rules';
    } else {
      ruleAdherence = rawRule as RuleAdherence;
    }
  } else if (ruleProp?.type === 'checkbox') {
    // Honest mapping for checkbox schema: true = Followed, false = Broke Rules (no fake partial)
    ruleAdherence = ruleProp.checkbox ? 'Followed' : 'Broke Rules';
  }

  // 5. Ticker: 'NQ' | 'ES' | 'YM' etc.
  let ticker: TradeTicker | null = null;
  const tickerProp = props['Ticker'];
  if (tickerProp?.type === 'select' && tickerProp.select?.name) {
    ticker = tickerProp.select.name.trim().toUpperCase();
  }

  // 6. Position: 'Long' | 'Short'
  let position: TradePosition | null = null;
  const posProp = props['Position'];
  if (posProp?.type === 'select' && posProp.select?.name) {
    const rawPos = posProp.select.name.trim();
    if (/^long/i.test(rawPos)) position = 'Long';
    else if (/^short/i.test(rawPos)) position = 'Short';
  }

  // 7. Sequence: 'Reversal' | 'Continuation' | 'Aligned'
  let sequence: TradeSequence | null = null;
  const seqProp = props['Sequence'];
  if (seqProp?.type === 'select' && seqProp.select?.name) {
    sequence = seqProp.select.name.trim();
  }

  // 8. Mistake: Multi-select array
  const mistakes: string[] = [];
  const mistakeProp = props['Mistake'] || props['Mistakes'];
  if (mistakeProp?.type === 'multi_select' && Array.isArray(mistakeProp.multi_select)) {
    for (const item of mistakeProp.multi_select) {
      if (item?.name && item.name.trim().toLowerCase() !== 'none') {
        mistakes.push(item.name.trim());
      }
    }
  }

  // 9. CiC: Multi-select array
  const cic: string[] = [];
  const cicProp = props['CiC'];
  if (cicProp?.type === 'multi_select' && Array.isArray(cicProp.multi_select)) {
    for (const item of cicProp.multi_select) {
      if (item?.name) cic.push(item.name.trim());
    }
  }

  // 10. News: Select or Rich Text
  let news: string | null = null;
  const newsProp = props['News'];
  if (newsProp?.type === 'select' && newsProp.select?.name) {
    news = newsProp.select.name.trim();
  } else if (newsProp?.type === 'rich_text' && Array.isArray(newsProp.rich_text) && newsProp.rich_text.length > 0) {
    news = newsProp.rich_text.map((t: any) => t.plain_text || '').join('').trim() || null;
  }

  // 11. RR: Number
  let rawRR: number | null = null;
  const rrProp = props['RR'] || props['Realized R'] || props['R:R'];
  if (rrProp?.type === 'number' && rrProp.number !== null && !isNaN(rrProp.number)) {
    rawRR = Number(rrProp.number);
  }

  // 12. Realized R calculation from rawRR & Result
  const realizedR = resolveRealizedR(rawRR, result);
  const plannedRR = rawRR !== null ? Math.abs(rawRR) : null;

  // 13. Screenshots: Files array
  const screenshots: ScreenshotFile[] = [];
  const screensProp = props['Screenshots'] || props['Screenshot'];
  if (screensProp?.type === 'files' && Array.isArray(screensProp.files)) {
    for (const file of screensProp.files) {
      const url = file?.file?.url || file?.external?.url;
      if (url) {
        screenshots.push({
          name: file.name || 'Screenshot',
          url,
          expiryTime: file?.file?.expiry_time || null,
        });
      }
    }
  }

  // Determine if this is an executed trade (Win, Loss, Break Even)
  const isExecutedTrade = result !== null && result !== 'No Trade';

  return {
    id: page.id,
    date,
    dateTime,
    title,
    ticker,
    position,
    sequence,
    result,
    cic,
    news,
    ruleAdherence,
    mistakes,
    plannedRR,
    realizedR,
    rawRR,
    screenshots,
    notionUrl: page.url || null,
    isExecutedTrade,
  };
}
