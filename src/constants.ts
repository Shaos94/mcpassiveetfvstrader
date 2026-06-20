export const TERMS = {
  edge: { title: "Edge", text: "È un vantaggio reale e ripetibile. Il trader non vince per fortuna, ma perché il suo metodo compensa costi, tasse e periodi negativi." },
  drawdown: { title: "Drawdown", text: "È la discesa più dolorosa del patrimonio dal punto più alto al punto più basso, prima del recupero." },
  montecarlo: { title: "Monte Carlo", text: "È una simulazione che immagina molti futuri possibili. Non predice il futuro esatto, ma mostra una gamma di esiti plausibili." },
  volatilita: { title: "Volatilità", text: "Misura quanto il percorso si muove su e giù. Più è alta, più il cammino è irregolare." },
  lordo: { title: "Rendimento lordo", text: "È il rendimento prima di costi e tasse. Quello che resta davvero in tasca è il rendimento netto." },
  scenari: { title: "Peggiore, tipico, migliore", text: "Tre letture semplici del risultato finale: una versione sfavorevole, una normale e una molto favorevole." },
};

export const profileDefaults = {
  weak: { gross: 9.5, vol: 26, cost: 4.5, crash: 1.1 },
  skilled: { gross: 13, vol: 22, cost: 3.5, crash: 0.95 },
  strong: { gross: 16, vol: 20, cost: 2.5, crash: 0.8 },
};
