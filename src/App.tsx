import React, { useMemo, useState } from "react";
import { simulate } from "./simulation/engine";
import {
  buildEtfSpec,
  pairedWinRate,
  requiredNetAlpha,
  waterfallDecomposition,
  type SimBundle,
} from "./simulation/analysis";
import { MARKET_SEED, PROFILES, TERMS, type ProfilePreset } from "./simulation/presets";
import type { TraderSpec } from "./simulation/types";
import {
  ActHeader,
  DotPill,
  MiniLegend,
  NumberField,
  ProfileSelector,
  RarityCard,
  StatCard,
  SurfaceCard,
  TermPills,
  THEME,
  ToggleRow,
  fmtEUR,
  fmtPct,
  fmtPp,
} from "./components/ui";
import { AlphaRequiredChart, WaterfallChart, WealthChart } from "./components/charts";

const WIN_TARGETS = [50, 60, 70];

export default function App() {
  // --- Atto 1: profilo ---
  const [selectedKey, setSelectedKey] = useState<ProfilePreset["key"]>("retail");

  // --- Atto 5: parametri ---
  const [initialCapital, setInitialCapital] = useState(100000);
  const [monthlyContribution, setMonthlyContribution] = useState(400);
  const [years, setYears] = useState(10);
  const [numPaths, setNumPaths] = useState(1500);

  const [marketGross, setMarketGross] = useState(7);
  const [marketVol, setMarketVol] = useState(16);
  const [fatTails, setFatTails] = useState(true);
  const [crashEnabled, setCrashEnabled] = useState(false); // OFF: le code pesanti coprono già il tail risk
  const [crashYear, setCrashYear] = useState(2);
  const [crashShock, setCrashShock] = useState(-30);

  const [etfTER, setEtfTER] = useState(0.2);
  const [etfOther, setEtfOther] = useState(0.05);
  const [capTax, setCapTax] = useState(26);
  const [ivafe, setIvafe] = useState(0.2);
  const [applyIvafeEtf, setApplyIvafeEtf] = useState(false);
  const [applyIvafeTrading, setApplyIvafeTrading] = useState(false);
  const [useLossCarry, setUseLossCarry] = useState(true);

  const [extraVol, setExtraVol] = useState(8);
  const [survivalMaster, setSurvivalMaster] = useState(true);

  const [selectedTerm, setSelectedTerm] = useState("alpha");

  const profile = PROFILES.find((p) => p.key === selectedKey) ?? PROFILES[0];

  // -------------------------------------------------------------------------
  // Memo 1 — benchmark ETF: dipende solo dai parametri, NON dal profilo scelto.
  // Cliccare un profilo non lo ricalcola.
  // -------------------------------------------------------------------------
  const bundle: SimBundle = useMemo(
    () => ({
      common: { numPaths, years, initialCapital, monthlyContribution, marketSeed: MARKET_SEED },
      market: { annualGrossReturnPct: marketGross, annualVolPct: marketVol, fatTails },
      crash: { enabled: crashEnabled, year: crashYear, shockPct: crashShock },
      fiscal: { capGainsTaxPct: capTax, ivafePct: ivafe },
    }),
    [numPaths, years, initialCapital, monthlyContribution, marketGross, marketVol, fatTails, crashEnabled, crashYear, crashShock, capTax, ivafe]
  );

  const etfResult = useMemo(
    () => simulate(bundle.common, bundle.market, bundle.crash, bundle.fiscal, buildEtfSpec(etfTER + etfOther, applyIvafeEtf)),
    [bundle, etfTER, etfOther, applyIvafeEtf]
  );

  // -------------------------------------------------------------------------
  // Memo 2 — trader del profilo selezionato + waterfall (3 controfattuali).
  // -------------------------------------------------------------------------
  const traderSpec: TraderSpec = useMemo(
    () => ({
      kind: "trader",
      grossExtraPct: profile.alphaPct + profile.costPct,
      annualCostPct: profile.costPct,
      extraVolPct: extraVol,
      applyIvafe: applyIvafeTrading,
      useLossCarry,
      survival: { enabled: survivalMaster && profile.useSurvival, meanDd: profile.survivalMeanDd },
    }),
    [profile, extraVol, applyIvafeTrading, useLossCarry, survivalMaster]
  );

  const decomposition = useMemo(
    () => waterfallDecomposition(bundle, etfResult, traderSpec),
    [bundle, etfResult, traderSpec]
  );

  const traderResult = decomposition.traderResult;
  const winRate = useMemo(
    () => pairedWinRate(traderResult.finalWealth, etfResult.finalWealth),
    [traderResult, etfResult]
  );

  // -------------------------------------------------------------------------
  // Memo 3 — net alpha richiesto: bisezione su sentieri ridotti (quickPaths).
  // Il benchmark ridotto è in un memo a sé: non dipende dal profilo selezionato.
  // -------------------------------------------------------------------------
  const quickBundle: SimBundle = useMemo(
    () => ({ ...bundle, common: { ...bundle.common, numPaths: Math.max(500, Math.round(bundle.common.numPaths * 0.4)) } }),
    [bundle]
  );

  const quickEtfWealth = useMemo(
    () =>
      simulate(quickBundle.common, quickBundle.market, quickBundle.crash, quickBundle.fiscal, buildEtfSpec(etfTER + etfOther, applyIvafeEtf))
        .finalWealth,
    [quickBundle, etfTER, etfOther, applyIvafeEtf]
  );

  const alphaRequired = useMemo(
    () =>
      WIN_TARGETS.map((target) => ({
        target: `${target}%`,
        alpha: requiredNetAlpha(quickBundle, quickEtfWealth, traderSpec, target),
      })),
    [quickBundle, quickEtfWealth, traderSpec]
  );

  const alpha50 = alphaRequired[0]?.alpha ?? null;
  const medianGap = traderResult.finalStats.p50 - etfResult.finalStats.p50;

  return (
    <div className="page">
      <div className="app-shell">
        {/* ------------------------------------------------------------ Hero */}
        <header className="hero">
          <h1 className="hero-title">Quanto devi essere bravo perché il trading batta l'ETF?</h1>
          <p className="hero-lead">
            Un percorso in quattro atti su migliaia di mercati simulati: scegli che trader pensi di essere,
            guarda cosa succede al tuo patrimonio, scopri da dove nasce il divario e quanto alpha ti servirebbe
            per ribaltarlo. Stesso capitale, stessi mercati, fiscalità italiana.
          </p>
          <div className="pill-row">
            <DotPill color={THEME.etf}>Confronto appaiato</DotPill>
            <DotPill color={THEME.strong}>Code pesanti t-Student</DotPill>
            <DotPill color={THEME.skilled}>Fiscalità italiana (26%, art. 68 TUIR)</DotPill>
          </div>
        </header>

        {/* ---------------------------------------------------------- Atto 1 */}
        <SurfaceCard>
          <ActHeader
            act={1}
            title="Che trader sei?"
            lead="Tre profili ancorati alla letteratura empirica. Selezionane uno: tutta la pagina si ricalcola sui suoi numeri."
          />
          <ProfileSelector profiles={PROFILES} selectedKey={selectedKey} onSelect={setSelectedKey} />
          <RarityCard profile={profile} />
        </SurfaceCard>

        {/* ---------------------------------------------------------- Atto 2 */}
        <SurfaceCard>
          <ActHeader
            act={2}
            title="Cosa succede al tuo patrimonio"
            lead={`${fmtEUR(initialCapital)} iniziali più ${fmtEUR(monthlyContribution)} al mese per ${years} anni, vissuti sugli stessi ${numPaths.toLocaleString("it-IT")} mercati simulati.`}
          />
          <div className="stat-grid">
            <StatCard
              label="Mediana finale · trading"
              value={fmtEUR(traderResult.finalStats.p50)}
              sub={`contro ${fmtEUR(etfResult.finalStats.p50)} dell'ETF`}
              accent={profile.color}
            />
            <StatCard
              label="Batte l'ETF in"
              value={fmtPct(winRate, 0)}
              sub="dei mercati appaiati"
              accent={winRate >= 50 ? undefined : THEME.muted}
            />
            <StatCard
              label="Drawdown mediano"
              value={fmtPct(traderResult.drawdownStats.p50, 0)}
              sub={`ETF: ${fmtPct(etfResult.drawdownStats.p50, 0)}`}
            />
            <StatCard
              label="Abbandona il trading"
              value={fmtPct(traderResult.quitShare * 100, 0)}
              sub={traderSpec.survival.enabled ? "dei sentieri simulati" : "funzione di abbandono disattivata"}
            />
          </div>
          <div className="legend-row">
            <MiniLegend color={THEME.etf} title="ETF passivo" text="Accumulazione, tassa differita alla fine." />
            <MiniLegend color={profile.color} title={profile.name} text="Tassazione annuale, costi e comportamento del profilo." />
          </div>
          <WealthChart etf={etfResult} trader={traderResult} traderColor={profile.color} traderName={profile.name} />
          <p className="chart-footnote">
            Linee: patrimonio mediano. Banda: dal 5° al 95° percentile del trader. I valori annuali sono al lordo
            della tassa differita, che per ETF e post-abbandono viene applicata solo al risultato finale.
          </p>
        </SurfaceCard>

        {/* ---------------------------------------------------------- Atto 3 */}
        <SurfaceCard>
          <ActHeader
            act={3}
            title="Da dove nasce il divario"
            lead={`Il gap mediano di ${fmtEUR(Math.abs(medianGap))} ${medianGap >= 0 ? "a favore del" : "a sfavore del"} trading, scomposto nelle sue cause sugli stessi mercati.`}
          />
          <div className="legend-row">
            <MiniLegend color={THEME.bad} title="Contributo negativo" text="Riduce il patrimonio rispetto al passo precedente." />
            <MiniLegend color={THEME.good} title="Contributo positivo" text="Aumenta il patrimonio rispetto al passo precedente." />
          </div>
          <WaterfallChart steps={decomposition.steps} traderColor={profile.color} />
          <p className="chart-footnote">
            Tre cause in sequenza: il drag di costi e fisco (stessi mercati, zero skill), l'effetto della skill lorda
            del profilo, e — se attivo — l'effetto dell'abbandono in drawdown con migrazione su ETF.
            {!traderSpec.survival.enabled
              ? " Per questo profilo la funzione di abbandono non è attiva, quindi il passo non compare."
              : ""}
          </p>
        </SurfaceCard>

        {/* ---------------------------------------------------------- Atto 4 */}
        <SurfaceCard>
          <ActHeader
            act={4}
            title="Quanto dovresti essere bravo per ribaltarlo"
            lead={
              alpha50 == null
                ? "Con questi parametri, nemmeno +15 punti di net alpha bastano a battere l'ETF in un mercato su due."
                : `Per battere l'ETF in un mercato su due servono almeno ${fmtPp(alpha50)} di net alpha. Il tuo profilo ne ha ${fmtPp(profile.alphaPct)}.`
            }
          />
          <AlphaRequiredChart data={alphaRequired} currentAlpha={profile.alphaPct} traderColor={profile.color} />
          <p className="chart-footnote">
            Net alpha annuo (al netto dei costi) necessario perché il tuo profilo — con i suoi costi, la sua volatilità
            extra e il suo comportamento — batta l'ETF nella quota indicata di mercati appaiati.
          </p>
        </SurfaceCard>

        {/* ---------------------------------------------------------- Atto 5 */}
        <SurfaceCard>
          <ActHeader
            act={5}
            title="Regola le ipotesi"
            lead="Tutti i parametri del modello. Ogni modifica ricalcola l'intero percorso sugli stessi semi di mercato."
          />
          <div className="params-grid">
            <div className="param-box">
              <div className="param-title">Capitale e orizzonte</div>
              <div className="param-fields">
                <NumberField label="Capitale iniziale" suffix="€" value={initialCapital} setValue={setInitialCapital} step={1000} min={1000} />
                <NumberField label="Versamento mensile" suffix="€" value={monthlyContribution} setValue={setMonthlyContribution} step={50} min={0} />
                <NumberField label="Orizzonte" suffix="anni" value={years} setValue={setYears} step={1} min={1} max={40} />
                <label className="field">
                  <span className="field-label">Sentieri Monte Carlo: {numPaths.toLocaleString("it-IT")}</span>
                  <input
                    className="range-input"
                    type="range"
                    min={500}
                    max={4000}
                    step={250}
                    value={numPaths}
                    onChange={(e) => setNumPaths(Number(e.target.value))}
                  />
                </label>
              </div>
            </div>

            <div className="param-box">
              <div className="param-title">Mercato</div>
              <div className="param-fields">
                <NumberField label="Rendimento lordo annuo" suffix="%" value={marketGross} setValue={setMarketGross} step={0.1} />
                <NumberField label="Volatilità annua" suffix="%" value={marketVol} setValue={setMarketVol} step={0.5} min={1} />
                <ToggleRow label="Code pesanti (t-Student ν=5)" checked={fatTails} onChange={setFatTails} />
                <ToggleRow label="Crisi manuale" checked={crashEnabled} onChange={setCrashEnabled} />
                {crashEnabled ? (
                  <>
                    <NumberField label="Anno della crisi" value={crashYear} setValue={setCrashYear} step={1} min={1} max={years} />
                    <NumberField label="Shock della crisi" suffix="%" value={crashShock} setValue={setCrashShock} step={1} min={-80} max={0} />
                  </>
                ) : (
                  <p className="param-note">
                    OFF di default: con le code pesanti attive il rischio estremo è già nel modello; attivare
                    entrambe conta il tail risk due volte.
                  </p>
                )}
              </div>
            </div>

            <div className="param-box">
              <div className="param-title">Fiscalità e costi</div>
              <div className="param-fields">
                <NumberField label="Capital gain" suffix="%" value={capTax} setValue={setCapTax} step={0.5} min={0} />
                <NumberField label="TER ETF" suffix="%" value={etfTER} setValue={setEtfTER} step={0.01} min={0} />
                <NumberField label="Altri costi ETF" suffix="%" value={etfOther} setValue={setEtfOther} step={0.01} min={0} />
                <ToggleRow label="Riporto minusvalenze (4 anni)" checked={useLossCarry} onChange={setUseLossCarry} />
                <NumberField label="IVAFE" suffix="%" value={ivafe} setValue={setIvafe} step={0.01} min={0} />
                <ToggleRow label="IVAFE su ETF" checked={applyIvafeEtf} onChange={setApplyIvafeEtf} />
                <ToggleRow label="IVAFE su trading" checked={applyIvafeTrading} onChange={setApplyIvafeTrading} />
              </div>
            </div>

            <div className="param-box">
              <div className="param-title">Comportamenti umani</div>
              <div className="param-fields">
                <NumberField label="Volatilità extra del trader" suffix="% annuo" value={extraVol} setValue={setExtraVol} step={1} min={0} max={40} />
                <ToggleRow label="Funzione di abbandono" checked={survivalMaster} onChange={setSurvivalMaster} />
                <p className="param-note">
                  Se attiva (e prevista dal profilo), in drawdown profondo il trader può mollare: realizza il
                  fiscale e migra su un ETF a basso costo con il capitale residuo. Soglia del profilo corrente:
                  ~{Math.round(profile.survivalMeanDd * 100)}% di drawdown.
                </p>
              </div>
            </div>
          </div>
        </SurfaceCard>

        {/* ------------------------------------------------------ Dizionario */}
        <SurfaceCard title="Dizionario veloce" description="I termini del modello, senza giri di parole.">
          <TermPills terms={TERMS} selected={selectedTerm} onSelect={setSelectedTerm} />
        </SurfaceCard>

        {/* ---------------------------------------------------------- Footer */}
        <footer className="footer">
          <div className="footer-title">Limiti noti (onestà metodologica)</div>
          <ul className="footer-list">
            <li>La calibrazione della funzione di abbandono (soglie 35–45% di drawdown) è indicativa, non stimata formalmente dai microdati di Barber et al. 2014.</li>
            <li>Le innovazioni t-Student i.i.d. non modellano il volatility clustering (GARCH): accettabile su orizzonti ≥5 anni, ottimista sulle code per orizzonti brevi.</li>
            <li>Fiscalità semplificata: non copre ETF non armonizzati, PIR, Tobin tax per titolo.</li>
            <li>Letteratura di riferimento prevalentemente USA/Taiwan: trasferibilità al retail italiano plausibile ma non verificata su microdati locali.</li>
          </ul>
          <p className="footer-disclaimer">
            Strumento didattico: simula scenari sotto ipotesi esplicite. Non è una previsione né un consiglio finanziario.
          </p>
        </footer>
      </div>
    </div>
  );
}
