# mcpassiveetfvstrader — v3

Single-page app didattica (React/Vite/TypeScript/Recharts) che confronta investimento
passivo in ETF e trading attivo con una simulazione Monte Carlo appaiata e fiscalità italiana.

URL: `https://shaos94.github.io/mcpassiveetfvstrader/`

## Cosa cambia nella v3

**Struttura a percorso guidato** invece che dashboard: (1) scegli che trader sei →
(2) vedi cosa succede → (3) vedi da dove nasce il divario → (4) vedi quanto dovresti
essere bravo per ribaltarlo → (5) regola tutti i parametri.

**Novità principali:**
- **Selettore di profilo interattivo**: i tre profili empirici (Retail medio / Trader
  bravo / Top 1%) sono l'interazione centrale; selezionarne uno ricalcola tutta la pagina.
- **Waterfall del divario**: il gap mediano ETF→trading scomposto in tre cause —
  drag di costi+fisco, effetto skill, effetto abbandono — sugli stessi mercati simulati.
- **Architettura modulare**: motore in `src/simulation/` (engine, analysis, presets, rng,
  types), componenti in `src/components/`, `App.tsx` come orchestratore.

**Scelte di modello dichiarate:**
- Paired Monte Carlo: stesso seed di mercato per tutte le strategie (requisito).
- Innovazioni t-Student (ν=5) di default per code realistiche (Cont 2001).
- Crisi manuale **OFF di default**: con le code pesanti attive il rischio estremo è già
  nel modello; tenerla accesa di default conterebbe il tail risk due volte.
- Net alpha dei profili ancorato alla letteratura: −3% (retail medio, Barber & Odean 2000),
  +1% (top 10–15%), +4% (top 1%, Barber et al. 2014).
- Survival: chi abbandona in drawdown profondo migra su ETF; tassazione realizzata al quit,
  differita sul guadagno successivo. Le minusvalenze residue (redditi diversi) non
  compensano i guadagni ETF (redditi di capitale), come nella realtà.
- Fiscalità italiana: 26% capital gain, compensazione minusvalenze FIFO 4 anni per il
  trading (art. 68 TUIR), differimento per ETF ad accumulazione, IVAFE opzionale.

## Sviluppo

```bash
npm install
npm run dev    # localhost:5173
npm run build  # produzione in dist/
```

## Deploy

Push su `main` → GitHub Actions pubblica su Pages. Non rimuovere
`base: '/mcpassiveetfvstrader/'` da `vite.config.ts`.

## Limiti noti (onestà metodologica)

- La calibrazione della funzione di abbandono (soglie 35–45% di drawdown, hazard mensile
  max 12%) è indicativa, non stimata formalmente dai microdati di Barber et al. 2014.
- t-Student i.i.d. non modella il volatility clustering (GARCH): accettabile su
  orizzonti ≥5 anni, ottimista sulle code per orizzonti brevi.
- Fiscalità semplificata: non copre ETF non armonizzati, PIR, Tobin tax per titolo.
- Letteratura di riferimento prevalentemente USA/Taiwan: trasferibilità al
  retail italiano plausibile ma non verificata su microdati locali.

Strumento didattico: non è una previsione né un consiglio finanziario.
