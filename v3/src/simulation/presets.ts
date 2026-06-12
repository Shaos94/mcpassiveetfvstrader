// Profili empirici e costanti di modello. I numeri sono ancorati alla letteratura
// citata in `source`; il net alpha è l'extra-rendimento annuo GIÀ al netto dei costi.

export const MARKET_SEED = 20260424;

export type ProfilePreset = {
  key: "retail" | "good" | "top1";
  name: string;
  claim: string;
  /** Net alpha annuo in punti %, al netto dei costi. */
  alphaPct: number;
  /** Costi annui di trading in %. Il lordo passato all'engine è alphaPct + costPct. */
  costPct: number;
  useSurvival: boolean;
  /** Drawdown attorno a cui accelera la probabilità di abbandono (0–1). */
  survivalMeanDd: number;
  rarity: string;
  rarityNote: string;
  source: string;
  color: string;
};

export const PROFILES: ProfilePreset[] = [
  {
    key: "retail",
    name: "Retail medio",
    claim: "Faccio trading, sono convinto di battere il mercato",
    alphaPct: -3,
    costPct: 2,
    useSurvival: true,
    survivalMeanDd: 0.35,
    rarity: "La maggioranza dei trader retail",
    rarityNote:
      "Il conto retail medio sottoperforma l'indice di circa 3 punti l'anno al netto dei costi, e il timing dei flussi (comprare dopo i rialzi, vendere dopo i ribassi) peggiora ulteriormente il risultato effettivo.",
    source: "Barber & Odean 2000, J. Finance; Dichev 2007, AER.",
    color: "#C084FC",
  },
  {
    key: "good",
    name: "Trader bravo",
    claim: "Sono più bravo della media, lo dimostro da anni",
    alphaPct: 1,
    costPct: 2.5,
    useSurvival: true,
    survivalMeanDd: 0.45,
    rarity: "Top 10–15% dei trader retail",
    rarityNote:
      "Pareggiare l'indice al netto dei costi colloca già nel top 15–20%. Un alpha netto di +1% mantenuto nel tempo è raro.",
    source: "Barber, Lee, Liu, Odean 2014, RAPS.",
    color: "#8B5CF6",
  },
  {
    key: "top1",
    name: "Top 1%",
    claim: "Ho una skill documentata e persistente",
    alphaPct: 4,
    costPct: 2,
    useSurvival: false,
    survivalMeanDd: 0.5,
    rarity: "Meno dell'1% dei trader retail",
    rarityNote:
      "Alpha netto di 4 pp/anno sostenuto per anni è rarissimo: per confronto, oltre l'80% dei gestori professionisti sottoperforma il benchmark a 10 anni.",
    source: "Barber et al. 2014; SPIVA Mid-Year 2025, S&P DJI.",
    color: "#6D28D9",
  },
];

export const TERMS: Record<string, { title: string; text: string }> = {
  alpha: {
    title: "Net alpha",
    text: "L'extra-rendimento annuo rispetto al mercato, già al netto dei costi. È il numero che misura quanto sei davvero più bravo: il mercato lo prendi comunque con un ETF.",
  },
  drawdown: {
    title: "Drawdown",
    text: "La discesa del patrimonio dal punto più alto al punto più basso, prima del recupero. È quello che metterà alla prova la tua tenuta psicologica.",
  },
  montecarlo: {
    title: "Monte Carlo",
    text: "Una simulazione che genera migliaia di futuri possibili. Non predice il futuro: mostra la distribuzione degli esiti plausibili sotto le tue ipotesi.",
  },
  paired: {
    title: "Confronto appaiato",
    text: "ETF e trading vivono gli stessi mercati simulati. Così la differenza che vedi dipende dalle scelte, non dalla fortuna di sentieri diversi.",
  },
  survival: {
    title: "Abbandono",
    text: "Circa il 40% dei day trader smette entro un anno, spesso dopo perdite pesanti. Il modello può simulare anche questo: chi molla migra su ETF con il capitale residuo.",
  },
};
