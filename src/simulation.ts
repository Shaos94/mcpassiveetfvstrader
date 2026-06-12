export type SimulateArgs = {
  rngSeed: number;
  numPaths: number;
  years: number;
  initialCapital: number;
  monthlyContribution: number;
  annualGrossReturn: number;
  annualVol: number;
  annualCost: number;
  annualWealthTax: number;
  capGainsTax: number;
  taxTiming: "annual" | "end";
  useLossCarry: boolean;
  crashEnabled: boolean;
  crashYear: number;
  crashShock: number;
  crashSensitivity: number;
};

export function fmtEUR(v: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v || 0);
}

export function fmtPct(v: number, d = 1) {
  return `${(v || 0).toFixed(d)}%`;
}

export function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}

export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randn(rng: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function percentile(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

export function quantiles(arr: number[]) {
  const s = [...arr].sort((a, b) => a - b);
  return {
    p5: percentile(s, 0.05),
    p50: percentile(s, 0.5),
    p95: percentile(s, 0.95),
  };
}

export function annualToLogMonthly(muPct: number, sigmaPct: number) {
  const mu = muPct / 100;
  const sigma = sigmaPct / 100;
  return {
    drift: (mu - 0.5 * sigma * sigma) / 12,
    vol: sigma / Math.sqrt(12),
  };
}

export function compareWinRate(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  let wins = 0;
  for (let i = 0; i < n; i++) if (a[i] > b[i]) wins++;
  return (wins / n) * 100;
}

export function simulateStrategy({
  rngSeed,
  numPaths,
  years,
  initialCapital,
  monthlyContribution,
  annualGrossReturn,
  annualVol,
  annualCost,
  annualWealthTax,
  capGainsTax,
  taxTiming,
  useLossCarry,
  crashEnabled,
  crashYear,
  crashShock,
  crashSensitivity,
}: SimulateArgs) {
  const rng = mulberry32(rngSeed);
  const months = years * 12;
  const crashMonth = clamp(crashYear, 1, years) * 12;
  const { drift, vol } = annualToLogMonthly(annualGrossReturn, annualVol);
  const monthlyCost = annualCost / 100 / 12;
  const monthlyWealthTax = annualWealthTax / 100 / 12;

  const yearlySnapshots = Array.from({ length: years + 1 }, () => [] as number[]);
  const finalWealth: number[] = [];
  const drawdowns: number[] = [];

  for (let p = 0; p < numPaths; p++) {
    let value = initialCapital;
    let startOfYear = initialCapital;
    let peak = initialCapital;
    let maxDD = 0;
    let lossCarry = [0, 0, 0, 0];
    yearlySnapshots[0].push(value);

    for (let m = 1; m <= months; m++) {
      value += monthlyContribution;
      const z = randn(rng);
      let monthlyRet = Math.exp(drift + vol * z) - 1;
      if (crashEnabled && m === crashMonth) monthlyRet += (crashShock / 100) * crashSensitivity;

      value = value * (1 + monthlyRet);
      value = value * (1 - monthlyCost);
      value = value * (1 - monthlyWealthTax);
      value = Math.max(0, value);

      peak = Math.max(peak, value);
      maxDD = Math.max(maxDD, peak > 0 ? (peak - value) / peak : 0);

      if (m % 12 === 0) {
        if (taxTiming === "annual") {
          const pnl = value - startOfYear - monthlyContribution * 12;
          if (useLossCarry) {
            if (pnl > 0) {
              let taxable = pnl;
              for (let i = 0; i < lossCarry.length; i++) {
                const offset = Math.min(taxable, lossCarry[i]);
                taxable -= offset;
                lossCarry[i] -= offset;
              }
              value -= Math.max(0, taxable) * (capGainsTax / 100);
              lossCarry.pop();
              lossCarry.unshift(0);
            } else if (pnl < 0) {
              lossCarry.pop();
              lossCarry.unshift(Math.abs(pnl));
            } else {
              lossCarry.pop();
              lossCarry.unshift(0);
            }
          } else {
            value -= Math.max(0, pnl) * (capGainsTax / 100);
          }
          startOfYear = value;
        }
        yearlySnapshots[m / 12].push(value);
      }
    }

    if (taxTiming === "end") {
      const contributed = initialCapital + monthlyContribution * months;
      const gain = Math.max(0, value - contributed);
      value -= gain * (capGainsTax / 100);
    }

    finalWealth.push(value);
    drawdowns.push(maxDD * 100);
  }

  return {
    finalWealth,
    finalStats: quantiles(finalWealth),
    drawdownStats: quantiles(drawdowns),
    yearlyStats: yearlySnapshots.map((arr, year) => ({ year, ...quantiles(arr) })),
  };
}
