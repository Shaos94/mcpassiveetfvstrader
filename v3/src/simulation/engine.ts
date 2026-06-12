import type {
  CommonParams,
  CrashParams,
  FiscalParams,
  MarketParams,
  StrategyResult,
  StrategySpec,
} from "./types";
import { clamp, mulberry32, normCdf, quantiles, randTStandardized, randn } from "./rng";

// Costo annuo applicato al capitale dopo l'abbandono del trader: rappresenta
// la migrazione su un ETF globale a basso costo (TER tipico ~0.20% + frizioni).
const POST_QUIT_ANNUAL_COST = 0.003;

// Gradi di libertà della t-Student per le code pesanti (Cont 2001).
const T_NU = 5;

// Funzione di abbandono: hazard mensile = QUIT_HAZARD_MAX * Φ((dd − meanDd) / QUIT_DD_SIGMA).
// Calibrazione indicativa (vedi README, limiti noti): vicino a meanDd di drawdown
// la probabilità accelera; in drawdown estremo tende al massimo mensile.
const QUIT_DD_SIGMA = 0.08;
const QUIT_HAZARD_MAX = 0.12;

// Coda FIFO a 4 anni per la compensazione delle minusvalenze (art. 68 TUIR).
// Ritorna la tassa dovuta nell'anno e aggiorna la coda in place.
function settleAnnualTax(
  pnl: number,
  lossCarry: number[],
  taxRate: number,
  useLossCarry: boolean
): number {
  if (!useLossCarry) {
    // Scorre comunque la coda per mantenere la finestra dei 4 anni coerente.
    lossCarry.pop();
    lossCarry.unshift(0);
    return Math.max(0, pnl) * taxRate;
  }
  if (pnl > 0) {
    let taxable = pnl;
    // FIFO: consuma prima le minusvalenze più vecchie (in coda), che scadono prima.
    for (let i = lossCarry.length - 1; i >= 0; i--) {
      const offset = Math.min(taxable, lossCarry[i]);
      taxable -= offset;
      lossCarry[i] -= offset;
      if (taxable === 0) break;
    }
    lossCarry.pop();
    lossCarry.unshift(0);
    return taxable * taxRate;
  }
  lossCarry.pop();
  lossCarry.unshift(pnl < 0 ? -pnl : 0);
  return 0;
}

/**
 * Simula una strategia su numPaths sentieri mensili.
 *
 * Disciplina di pairing:
 * - il flusso di mercato (marketRng) consuma un numero FISSO di estrazioni per mese
 *   (1 gaussiana, oppure 1+ν per la t-Student), identico per ogni strategia;
 * - le estrazioni comportamentali del trader (vol extra, decisione di abbandono)
 *   vengono da un flusso separato (behaviorRng) e vengono consumate OGNI mese
 *   anche quando non servono, così i controfattuali del waterfall restano allineati.
 */
export function simulate(
  common: CommonParams,
  market: MarketParams,
  crash: CrashParams,
  fiscal: FiscalParams,
  spec: StrategySpec
): StrategyResult {
  const marketRng = mulberry32(common.marketSeed >>> 0);
  const behaviorRng = mulberry32(((common.marketSeed ^ 0x9e3779b9) >>> 0) + 1);

  const months = common.years * 12;
  const crashMonth = crash.enabled ? clamp(crash.year, 1, common.years) * 12 : -1;

  const mu = market.annualGrossReturnPct / 100;
  const sigma = market.annualVolPct / 100;
  const driftM = (mu - 0.5 * sigma * sigma) / 12;
  const volM = sigma / Math.sqrt(12);

  const taxRate = fiscal.capGainsTaxPct / 100;
  const ivafeM = fiscal.ivafePct / 100 / 12;

  const isTrader = spec.kind === "trader";
  const grossSpreadM = isTrader ? spec.grossExtraPct / 100 / 12 : 0;
  const extraVolM = isTrader ? spec.extraVolPct / 100 / Math.sqrt(12) : 0;
  const activeCostM = spec.annualCostPct / 100 / 12;
  const postQuitCostM = POST_QUIT_ANNUAL_COST / 12;
  const applyIvafe = spec.applyIvafe;

  const yearlySnapshots = Array.from({ length: common.years + 1 }, () => [] as number[]);
  const finalWealth: number[] = [];
  const drawdowns: number[] = [];
  let quitCount = 0;

  for (let p = 0; p < common.numPaths; p++) {
    let value = common.initialCapital;
    let peak = value;
    let maxDD = 0;

    // Stato fiscale del trader attivo (tassazione annuale, redditi diversi).
    let startOfYear = value;
    let contribYTD = 0;
    const lossCarry = [0, 0, 0, 0];

    // Stato post-abbandono / ETF (tassazione differita, redditi di capitale).
    let deferredBasis = value; // base di costo: capitale versato non ancora tassato
    let quit = !isTrader; // l'ETF è "già" nel regime differito
    let quitHappened = false;

    yearlySnapshots[0].push(value);

    for (let m = 1; m <= months; m++) {
      value += common.monthlyContribution;
      if (quit) deferredBasis += common.monthlyContribution;
      else contribYTD += common.monthlyContribution;

      // --- Flusso di mercato (condiviso tra strategie a parità di seed) ---
      const z = market.fatTails ? randTStandardized(marketRng, T_NU) : randn(marketRng);
      let marketRet = Math.exp(driftM + volM * z) - 1;
      if (m === crashMonth) marketRet += crash.shockPct / 100;

      // --- Flusso comportamentale (consumato sempre, usato solo dal trader attivo) ---
      let e = 0;
      let u = 0;
      if (isTrader) {
        e = randn(behaviorRng);
        u = behaviorRng();
      }

      const active = isTrader && !quit;
      const ret = active ? marketRet + grossSpreadM + extraVolM * e : marketRet;
      const costM = quitHappened ? postQuitCostM : activeCostM;

      value *= 1 + ret;
      value *= 1 - costM;
      if (applyIvafe) value *= 1 - ivafeM;
      value = Math.max(0, value);

      peak = Math.max(peak, value);
      const dd = peak > 0 ? (peak - value) / peak : 0;
      maxDD = Math.max(maxDD, dd);

      // --- Abbandono: realizza il fiscale e migra su ETF a basso costo ---
      if (active && spec.survival.enabled) {
        const hazard = QUIT_HAZARD_MAX * normCdf((dd - spec.survival.meanDd) / QUIT_DD_SIGMA);
        if (u < hazard) {
          const pnl = value - startOfYear - contribYTD;
          value -= settleAnnualTax(pnl, lossCarry, taxRate, spec.useLossCarry);
          value = Math.max(0, value);
          // Le minusvalenze residue (redditi diversi) NON compensano i futuri
          // guadagni ETF (redditi di capitale): si perdono, come nella realtà.
          deferredBasis = value;
          quit = true;
          quitHappened = true;
        }
      }

      // --- Chiusura d'anno: tassazione annuale solo per il trader attivo ---
      if (m % 12 === 0) {
        if (isTrader && !quit) {
          const pnl = value - startOfYear - contribYTD;
          value -= settleAnnualTax(pnl, lossCarry, taxRate, spec.useLossCarry);
          value = Math.max(0, value);
          startOfYear = value;
          contribYTD = 0;
        }
        yearlySnapshots[m / 12].push(value);
      }
    }

    // Tassazione differita a fine orizzonte (ETF ad accumulazione e post-abbandono).
    // Il trader mai abbandonato non ha nulla da regolare qui: l'ultima chiusura
    // d'anno coincide con la fine dell'orizzonte (years interi).
    if (quit) {
      const gain = Math.max(0, value - deferredBasis);
      value -= gain * taxRate;
    }

    if (quitHappened) quitCount++;
    finalWealth.push(value);
    drawdowns.push(maxDD * 100);
  }

  return {
    finalWealth,
    finalStats: quantiles(finalWealth),
    drawdownStats: quantiles(drawdowns),
    yearly: yearlySnapshots.map((arr, year) => ({ year, ...quantiles(arr) })),
    quitShare: common.numPaths > 0 ? quitCount / common.numPaths : 0,
  };
}
