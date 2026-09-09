export const metrics = {
  staleTickRejects: 0,
  tradesRejectedDueToStalePrice: 0,
  fallbackUsedCount: 0,
  priceAgesMs: [] as number[],
};

export function recordPriceAge(ageMs: number) {
  metrics.priceAgesMs.push(ageMs);
  if (metrics.priceAgesMs.length > 1000) metrics.priceAgesMs.shift();
}

export function incrementStaleTickRejects() {
  metrics.staleTickRejects++;
}

export function incrementTradesRejectedDueToStalePrice() {
  metrics.tradesRejectedDueToStalePrice++;
}

export function incrementFallbackUsedCount() {
  metrics.fallbackUsedCount++;
}

export function summary() {
  const ages = metrics.priceAgesMs.slice();
  const sorted = ages.sort((a,b)=>a-b);
  const p50 = sorted.length ? sorted[Math.floor(sorted.length*0.5)] : 0;
  const p95 = sorted.length ? sorted[Math.floor(sorted.length*0.95)] : 0;
  return {
    staleTickRejects: metrics.staleTickRejects,
    tradesRejectedDueToStalePrice: metrics.tradesRejectedDueToStalePrice,
    fallbackUsedCount: metrics.fallbackUsedCount,
    priceAgeP50: p50,
    priceAgeP95: p95,
    samples: metrics.priceAgesMs.length
  };
}
