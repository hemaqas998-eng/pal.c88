import { getFreshTradePrice, getPriceFromCache } from './marketDataEnhancements.js';
import { radarEngine } from './radarEngine.js';
import { incrementStaleTickRejects, incrementTradesRejectedDueToStalePrice, incrementFallbackUsedCount, recordPriceAge } from './metrics.js';

// Patch radarEngine.openTradeDirectly to enforce staleness guard using cached price (non-blocking)
(function patchOpenTrade() {
  try {
    if (!radarEngine || !radarEngine.openTradeDirectly) return;
    const original = radarEngine.openTradeDirectly.bind(radarEngine);

    radarEngine.openTradeDirectly = function (params: any) {
      try {
        const sym = params.symbol;
        const settings = radarEngine.getSettings ? radarEngine.getSettings() : { execMaxAgeMs: 2500 };
        const maxAge = (settings && (settings.execMaxAgeMs || settings.execMaxAgeMs === 0) ? settings.execMaxAgeMs : 2500) || 2500;

        const fresh = getFreshTradePrice(sym, maxAge);
        if (!fresh || !fresh.isFresh) {
          incrementTradesRejectedDueToStalePrice();
          // fallback handling
          if (process.env.ALLOW_LIMIT_FALLBACK === 'true') {
            incrementFallbackUsedCount();
            const snapshot = getPriceFromCache(sym);
            const res = original(params);
            if (res && res.trade) {
              res.trade.executionSnapshot = {
                price: snapshot?.price,
                source: snapshot?.source || 'SNAPSHOT_FALLBACK',
                timestamp: snapshot?.timestamp || Date.now(),
                ageMs: Date.now() - (snapshot?.timestamp || Date.now()),
                fallback: true
              };
              recordPriceAge(res.trade.executionSnapshot.ageMs || 0);
            }
            return res;
          }
          return { success: false, message: 'Stale price: trade rejected by engine guard' };
        }

        // Price is fresh; proceed
        const res = original(params);
        if (res && res.trade) {
          res.trade.executionSnapshot = {
            price: fresh.price,
            source: fresh.source || 'CACHE',
            timestamp: fresh.timestamp || Date.now(),
            ageMs: fresh.ageMs || 0,
            fromCache: !!fresh.isFresh
          };
          recordPriceAge(fresh.ageMs || 0);
        }
        return res;
      } catch (err) {
        // In case of unexpected error, fallback to original behavior
        try {
          return original(params);
        } catch (e) {
          return { success: false, message: (e as Error).message || 'Open trade failed' };
        }
      }
    };
  } catch (e) {
    // ignore patch failure
    console.warn('Failed to patch radarEngine.openTradeDirectly:', e);
  }
})();
