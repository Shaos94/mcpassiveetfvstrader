import { simulate } from "./engine";
import type {
  CommonParams,
  CrashParams,
  EtfSpec,
  FiscalParams,
  MarketParams,
  StrategyResult,
  TraderSpec,
  WaterfallStep,
} from "./types";

// Winrate appaiato: % di sentieri in cui il trading finisce sopra l'ETF.
// Valido solo se entrambe le strategie sono state simulate con lo stesso seed.
export function pairedWinRate(trader: number[], etf: number[]): number {
  const n = Math.min(trader.length, etf.length);
  if (n === 0) return 0;
  let wins = 0;
  for (let i = 0; i < n; i++) if (trader[i] > etf[i]) wins++;
  return (wins / n) * 100;
}

export type SimBundle = {
  common: CommonParams;
  market: MarketParams;
  crash: CrashParams;
  fiscal: FiscalParams;
};

/**
 * Scompone il gap mediano ETF → trading in tre cause, sugli stessi mercati simulati:
 *   1. costi+fisco   — controfattuale S1: skill lorda zero, costi e tassazione del trader;
 *   2. effetto skill — S2 = S1 + skill lorda del profilo;
 *   3. abbandono     — S3 = S2 + funzione di abbandono (il trader reale).
 * Per costruzione: mediana(ETF) + Δ1 + Δ2 + Δ3 = mediana(trader reale).
 * Se la survival è disattivata, il passo "abbandono" è identicamente nullo
 * e viene omesso (niente barre a zero nel grafico).
 */
export function waterfallDecomposition(
  bundle: SimBundle,
  etfResult: StrategyResult,
  traderSpec: TraderSpec
): { steps: WaterfallStep[]; traderResult: StrategyResult } {
  const { common, market, crash, fiscal } = bundle;

  const s1: TraderSpec = { ...traderSpec, grossExtraPct: 0, survival: { ...traderSpec.survival, enabled: false } };
  const s2: TraderSpec = { ...traderSpec, survival: { ...traderSpec.survival, enabled: false } };
  const s3: TraderSpec = traderSpec;

  const r1 = simulate(common, market, crash, fiscal, s1);
  const r2 = simulate(common, market, crash, fiscal, s2);
  const r3 = traderSpec.survival.enabled ? simulate(common, market, crash, fiscal, s3) : r2;

  const etfP50 = etfResult.finalStats.p50;
  const steps: WaterfallStep[] = [
    { key: "etf", label: "ETF passivo", value: etfP50, kind: "total" },
    { key: "costsTax", label: "Costi e fisco", value: r1.finalStats.p50 - etfP50, kind: "delta" },
    { key: "skill", label: "Effetto skill", value: r2.finalStats.p50 - r1.finalStats.p50, kind: "delta" },
  ];
  if (traderSpec.survival.enabled) {
    steps.push({ key: "quit", label: "Effetto abbandono", value: r3.finalStats.p50 - r2.finalStats.p50, kind: "delta" });
  }
  steps.push({ key: "trader", label: "Trading", value: r3.finalStats.p50, kind: "total" });

  return { steps, traderResult: r3 };
}

// Limiti della bisezione sul net alpha richiesto. Il cap NON è silenzioso:
// se nemmeno ALPHA_CAP raggiunge il target, la funzione ritorna null.
export const ALPHA_FLOOR = -5;
export const ALPHA_CAP = 15;

/**
 * Net alpha annuo (pp) necessario perché il trading batta l'ETF in almeno
 * targetWinPct% dei mercati appaiati, dato il profilo (costi, vol extra, abbandono).
 * Ritorna null se il target non è raggiungibile entro ALPHA_CAP.
 */
export function requiredNetAlpha(
  bundle: SimBundle,
  etfWealth: number[],
  traderBase: TraderSpec,
  targetWinPct: number,
  iterations = 9
): number | null {
  let lo = ALPHA_FLOOR;
  let hi = ALPHA_CAP;
  let reached = false;

  for (let k = 0; k < iterations; k++) {
    const mid = (lo + hi) / 2;
    const spec: TraderSpec = { ...traderBase, grossExtraPct: mid + traderBase.annualCostPct };
    const sim = simulate(bundle.common, bundle.market, bundle.crash, bundle.fiscal, spec);
    const wr = pairedWinRate(sim.finalWealth, etfWealth);
    if (wr >= targetWinPct) {
      hi = mid;
      reached = true;
    } else {
      lo = mid;
    }
  }
  return reached ? hi : null;
}

export function buildEtfSpec(annualCostPct: number, applyIvafe: boolean): EtfSpec {
  return { kind: "etf", annualCostPct, applyIvafe };
}
