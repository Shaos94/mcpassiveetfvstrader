// Contratti del motore Monte Carlo. Nessuna dipendenza da React o dalla UI.

export type MarketParams = {
  /** Rendimento lordo annuo atteso del mercato, in %. */
  annualGrossReturnPct: number;
  /** Volatilità annua del mercato, in %. */
  annualVolPct: number;
  /** Innovazioni t-Student (ν=5) per code realistiche; false = gaussiane. */
  fatTails: boolean;
};

export type CrashParams = {
  /** OFF di default: con le code pesanti attive il tail risk è già nel modello. */
  enabled: boolean;
  year: number;
  /** Shock aritmetico sul mese della crisi, in % (negativo). */
  shockPct: number;
};

export type FiscalParams = {
  /** Aliquota capital gain, in % (Italia: 26). */
  capGainsTaxPct: number;
  /** IVAFE annua, in % (Italia: 0.2). */
  ivafePct: number;
};

export type CommonParams = {
  numPaths: number;
  years: number;
  initialCapital: number;
  monthlyContribution: number;
  /** Seed di mercato condiviso: il pairing tra strategie vale solo a parità di seed. */
  marketSeed: number;
};

export type EtfSpec = {
  kind: "etf";
  /** TER + altri costi, in % annuo. */
  annualCostPct: number;
  applyIvafe: boolean;
};

export type TraderSpec = {
  kind: "trader";
  /**
   * Extra-rendimento LORDO annuo rispetto al mercato, in punti %.
   * Per ottenere un net alpha A con costi C va passato grossExtraPct = A + C.
   */
  grossExtraPct: number;
  /** Costi annui di trading (commissioni, spread, slippage), in %. */
  annualCostPct: number;
  /** Volatilità idiosincratica extra del portafoglio del trader, in % annuo. */
  extraVolPct: number;
  applyIvafe: boolean;
  /** Compensazione minusvalenze FIFO a 4 anni (art. 68 TUIR). */
  useLossCarry: boolean;
  survival: {
    enabled: boolean;
    /** Drawdown attorno a cui la probabilità di abbandono accelera (0–1). */
    meanDd: number;
  };
};

export type StrategySpec = EtfSpec | TraderSpec;

export type Quantiles = { p5: number; p50: number; p95: number };

export type StrategyResult = {
  finalWealth: number[];
  finalStats: Quantiles;
  /** Max drawdown per sentiero, in %. */
  drawdownStats: Quantiles;
  /** Snapshot annuali (indice 0 = anno 0). */
  yearly: Array<{ year: number } & Quantiles>;
  /** Quota di sentieri in cui il trader ha abbandonato (0 per ETF). */
  quitShare: number;
};

export type WaterfallStepKey = "etf" | "costsTax" | "skill" | "quit" | "trader";

export type WaterfallStep = {
  key: WaterfallStepKey;
  label: string;
  /** Per i totali: livello assoluto. Per i delta: variazione in €. */
  value: number;
  kind: "total" | "delta";
};
