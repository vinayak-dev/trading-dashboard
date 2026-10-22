import { useSyncExternalStore } from 'react';

export interface VizTokens {
  surface: string;
  inkMuted: string;
  gridline: string;
  baseline: string;
  brand: string;
  profit: string;
  profitFill: string;
  loss: string;
  foreground: string;
  card: string;
  border: string;
}

export const readVizTokens = (): VizTokens => {
  if (typeof window === 'undefined') {
    return {
      surface: '#101013',
      inkMuted: '#8b8b95',
      gridline: '#1e1e24',
      baseline: '#30303a',
      brand: '#1197e2',
      profit: '#0ca30c',
      profitFill: '#0ca30c',
      loss: '#d03b3b',
      foreground: '#f4f4f4',
      card: '#101013',
      border: '#222228',
    };
  }

  const isLight = document.documentElement.classList.contains('light') || !document.documentElement.classList.contains('dark');
  const style = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;

  if (isLight) {
    return {
      surface: v('--viz-surface', '#fcfcfb'),
      inkMuted: v('--ink-muted', '#686760'),
      gridline: v('--gridline', '#e1e0d9'),
      baseline: v('--baseline', '#c3c2b7'),
      brand: v('--brand', '#0b7cbd'),
      profit: v('--profit', '#006300'),
      profitFill: v('--profit-fill', '#0ca30c'),
      loss: v('--loss', '#d03b3b'),
      foreground: v('--foreground', '#0b0b0b'),
      card: v('--card', '#fcfcfb'),
      border: v('--border', '#e1e0d9'),
    };
  }

  return {
    surface: v('--viz-surface', '#101013'),
    inkMuted: v('--ink-muted', '#8b8b95'),
    gridline: v('--gridline', '#1e1e24'),
    baseline: v('--baseline', '#30303a'),
    brand: v('--brand', '#1197e2'),
    profit: v('--profit', '#0ca30c'),
    profitFill: v('--profit-fill', '#0ca30c'),
    loss: v('--loss', '#d03b3b'),
    foreground: v('--foreground', '#f4f4f4'),
    card: v('--card', '#101013'),
    border: v('--border', '#222228'),
  };
};

let tokens: VizTokens | null = null;
const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;

const getTokens = () => tokens ?? (tokens = readVizTokens());
const getServerTokens = () => readVizTokens();

function subscribeTokens(listener: () => void) {
  listeners.add(listener);
  if (!observer && typeof window !== 'undefined') {
    const read = () => {
      tokens = readVizTokens();
      listeners.forEach((notify) => notify());
    };
    observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    read();
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      observer?.disconnect();
      observer = null;
      tokens = null;
    }
  };
}

export const useVizTokens = (): VizTokens =>
  useSyncExternalStore(subscribeTokens, getTokens, getServerTokens);

export const tooltipStyle = (t: VizTokens): React.CSSProperties => ({
  background: t.card,
  border: `1px solid ${t.border}`,
  borderRadius: 10,
  padding: '8px 12px',
  fontSize: 12,
  lineHeight: 1.5,
  color: t.foreground,
  boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
});
