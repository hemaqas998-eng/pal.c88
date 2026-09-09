// marketDataEnhancements.ts
// Provides enhanced price ingestion and execution price resolution utilities.

import { getAdapter } from './brokerAdapter/mockBroker.js';

export interface WsPriceData {
  symbol: string;
  price: number;
  timestamp?: number;
  source?: string;
  sequence?: number;
  latencyMs?: number;
}

const tiingoPrices: Map<string, any> = new Map();
const providerLastTimestamps: Record<string, number> = {};
const sourcePriority: Record<string, number> = {
  'BROKER_DIRECT_FEED': 110,
  'DERIV_INTERBANK_WS': 100,
  'TIINGO_WS': 95,
  'KRAKEN_WS': 90,
  'BINANCE_WS': 80,
  'COINBASE_WS': 75,
  'MOCK': 10
};

function normalizeSymbolKey(sym: string) {
  return sym.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function setAtomicLivePrice(entry: WsPriceData): boolean {
  if (!entry || !entry.symbol || typeof entry.price !== 'number' || entry.price <= 0) return false;
  const now = Date.now();
  if (!entry.timestamp || entry.timestamp > now + 5000) entry.timestamp = now;
  entry.receivedAt = now;

  const norm = normalizeSymbolKey(entry.symbol);
  const existing = tiingoPrices.get(norm);

  const lastProvTs = providerLastTimestamps[entry.source || 'unknown'] || 0;
  if (lastProvTs && entry.timestamp <= lastProvTs - 50 && entry.sequence === undefined) {
    // stale from same provider
    return false;
  }

  if (existing) {
    const existingPriority = sourcePriority[existing.source || ''] || 50;
    const incomingPriority = sourcePriority[entry.source || ''] || 50;
    if (existing.timestamp > entry.timestamp && (existing.timestamp - entry.timestamp) > 20) return false;
    if (existing.timestamp === entry.timestamp && incomingPriority < existingPriority) return false;
  }

  providerLastTimestamps[entry.source || 'unknown'] = Math.max(providerLastTimestamps[entry.source || 'unknown'] || 0, entry.timestamp);

  tiingoPrices.set(norm, { ...entry, serverTimestamp: now });
  return true;
}

export function getPriceFromCache(symbol: string) {
  const norm = normalizeSymbolKey(symbol);
  return tiingoPrices.get(norm);
}

export function getFreshTradePrice(symbol: string, maxAgeMs = 3500) {
  const p = getPriceFromCache(symbol);
  if (!p) return null;
  const age = Date.now() - (p.timestamp || p.serverTimestamp || Date.now());
  return { ...p, isFresh: age <= maxAgeMs, ageMs: age };
}

export async function resolveExecutionPrice(symbol: string, opts?: { maxAgeMs?: number; requireBrokerConfirm?: boolean; brokerId?: string }) {
  const maxAgeMs = opts?.maxAgeMs ?? 3500;
  const cached = getFreshTradePrice(symbol, maxAgeMs);
  if (cached && cached.isFresh) {
    return { ok: true, price: cached.price, source: cached.source || 'CACHE', timestamp: cached.timestamp || Date.now(), ageMs: cached.ageMs, fromCache: true };
  }

  // Broker confirm
  if (opts?.requireBrokerConfirm && opts.brokerId) {
    try {
      const adapter = getAdapter(opts.brokerId) as any;
      if (adapter) {
        const quote = await adapter.getQuote(symbol);
        if (quote && quote.price) {
          return { ok: true, price: quote.price, source: `BROKER:${opts.brokerId}`, timestamp: quote.timestamp || Date.now(), ageMs: Date.now() - (quote.timestamp || Date.now()), fromCache: false };
        }
      }
    } catch (err) {
      // continue to fallback
    }
  }

  // Fallback to last snapshot as limit if allowed
  if (process.env.ALLOW_LIMIT_FALLBACK === 'true') {
    const snapshot = getPriceFromCache(symbol) || null;
    if (snapshot) {
      return { ok: 'fallback', price: snapshot.price, source: snapshot.source || 'LAST_SNAPSHOT', timestamp: snapshot.timestamp || Date.now(), ageMs: Date.now() - (snapshot.timestamp || Date.now()) };
    }
  }

  return { ok: false, error: `No fresh price for ${symbol}` };
}
