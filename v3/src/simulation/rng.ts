// Generatori deterministici e funzioni statistiche di base.
// Tutto è seedabile: stesso seed → stessi sentieri di mercato (paired Monte Carlo).

export function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randn(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// t-Student standardizzata (varianza 1) a nu gradi di libertà.
// T = Z / sqrt(V/nu) con V ~ chi2(nu); riscalata per varianza unitaria.
// Nota di pairing: consuma 1 + round(nu) gaussiane per campione — costante,
// quindi il sentiero di mercato resta identico tra strategie a parità di seed.
export function randTStandardized(rng: () => number, nu: number): number {
  if (nu <= 2) return randn(rng); // varianza non definita: fallback gaussiano
  const k = Math.max(3, Math.round(nu));
  const z = randn(rng);
  let v = 0;
  for (let i = 0; i < k; i++) {
    const g = randn(rng);
    v += g * g;
  }
  return z / Math.sqrt(v / k) / Math.sqrt(k / (k - 2));
}

// CDF normale standard (Abramowitz & Stegun 26.2.17, errore < 7.5e-8).
export function normCdf(x: number): number {
  const p = 0.2316419;
  const c = 0.39894228;
  const b = [0.31938153, -0.356563782, 1.781477937, -1.821255978, 1.330274429];
  const ax = Math.abs(x);
  const k = 1 / (1 + p * ax);
  let poly = 0;
  let kp = k;
  for (let i = 0; i < 5; i++) {
    poly += b[i] * kp;
    kp *= k;
  }
  const y = 1 - c * Math.exp(-ax * ax * 0.5) * poly;
  return x >= 0 ? y : 1 - y;
}

export function percentile(sortedAsc: number[], p: number): number {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  if (n === 1) return sortedAsc[0];
  const idx = (n - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  const w = idx - lo;
  return sortedAsc[lo] * (1 - w) + sortedAsc[hi] * w;
}

export function quantiles(arr: number[]): { p5: number; p50: number; p95: number } {
  const s = [...arr].sort((a, b) => a - b);
  return { p5: percentile(s, 0.05), p50: percentile(s, 0.5), p95: percentile(s, 0.95) };
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
