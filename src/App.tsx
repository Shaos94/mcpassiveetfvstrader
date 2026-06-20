import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";
import { compareWinRate, simulateStrategy } from "./simulation";
import { fmtEUR, fmtPct } from "./format";
import { TERMS, profileDefaults } from "./constants";
import { THEME } from "./theme";
import type { ProfileItem } from "./types";
import { CoinStackIcon, LandmarkIcon, PiggyBankIcon, SparklesIcon } from "./icons";
import {
  ChartShell,
  ClickableLegend,
  DefinitionRotor,
  DotPill,
  FinanceGlow,
  MiniLegend,
  NumberField,
  OrderedTooltip,
  ProfileGrid,
  SurfaceCard,
  TabButton,
  ToggleRow,
} from "./components";

export default function App() {
  const [initialCapital, setInitialCapital] = useState(100000);
  const [monthlyContribution, setMonthlyContribution] = useState(400);
  const [years, setYears] = useState(10);
  const [numPaths, setNumPaths] = useState(2000);
  const [etfGross, setEtfGross] = useState(7);
  const [etfVol, setEtfVol] = useState(16);
  const [etfTER, setEtfTER] = useState(0.2);
  const [etfOther, setEtfOther] = useState(0.05);
  const [capTax, setCapTax] = useState(26);
  const [ivafe, setIvafe] = useState(0.2);
  const [applyIvafeEtf, setApplyIvafeEtf] = useState(false);
  const [applyIvafeTrading, setApplyIvafeTrading] = useState(false);
  const [useLossCarry, setUseLossCarry] = useState(true);
  const [crashEnabled, setCrashEnabled] = useState(true);
  const [crashYear, setCrashYear] = useState(2);
  const [crashShock, setCrashShock] = useState(-30);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({ ETF: true, Weak: true, Skilled: true, Strong: true });
  const [activeSeries, setActiveSeries] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<keyof typeof TERMS>("edge");
  const [activeTab, setActiveTab] = useState<"main" | "range" | "need">("main");

  const results = useMemo(() => {
    const weak = profileDefaults.weak;
    const skilled = profileDefaults.skilled;
    const strong = profileDefaults.strong;

    const common = {
      numPaths,
      years,
      initialCapital,
      monthlyContribution,
      capGainsTax: capTax,
      useLossCarry,
      crashEnabled,
      crashYear,
      crashShock,
    };

    const etf = simulateStrategy({ ...common, rngSeed: 101, annualGrossReturn: etfGross, annualVol: etfVol, annualCost: etfTER + etfOther, annualWealthTax: applyIvafeEtf ? ivafe : 0, taxTiming: "end", crashSensitivity: 1 });
    const weakRes = simulateStrategy({ ...common, rngSeed: 202, annualGrossReturn: weak.gross, annualVol: weak.vol, annualCost: weak.cost, annualWealthTax: applyIvafeTrading ? ivafe : 0, taxTiming: "annual", crashSensitivity: weak.crash });
    const skilledRes = simulateStrategy({ ...common, rngSeed: 303, annualGrossReturn: skilled.gross, annualVol: skilled.vol, annualCost: skilled.cost, annualWealthTax: applyIvafeTrading ? ivafe : 0, taxTiming: "annual", crashSensitivity: skilled.crash });
    const strongRes = simulateStrategy({ ...common, rngSeed: 404, annualGrossReturn: strong.gross, annualVol: strong.vol, annualCost: strong.cost, annualWealthTax: applyIvafeTrading ? ivafe : 0, taxTiming: "annual", crashSensitivity: strong.crash });

    const summary: ProfileItem[] = [
      { name: "ETF passivo", final: etf.finalStats.p50, dd: etf.drawdownStats.p50, win: null, tint: "#EEF0FF" },
      { name: "Trading debole", final: weakRes.finalStats.p50, dd: weakRes.drawdownStats.p50, win: compareWinRate(weakRes.finalWealth, etf.finalWealth), tint: "#FBF3FF" },
      { name: "Trading bravo", final: skilledRes.finalStats.p50, dd: skilledRes.drawdownStats.p50, win: compareWinRate(skilledRes.finalWealth, etf.finalWealth), tint: "#F5F0FF" },
      { name: "Trading molto bravo", final: strongRes.finalStats.p50, dd: strongRes.drawdownStats.p50, win: compareWinRate(strongRes.finalWealth, etf.finalWealth), tint: "#F0EBFF" },
    ];

    const ordered = [...summary].sort((a, b) => b.final - a.final);
    const best = ordered[0];
    const second = ordered[1];
    const leadPct = second && second.final > 0 ? ((best.final - second.final) / second.final) * 100 : 0;

    const bestReason = best.name === "ETF passivo"
      ? "È davanti perché, con questi parametri, i costi e il drag fiscale sono più contenuti rispetto agli scenari di trading."
      : "È davanti perché, con questi parametri, il rendimento lordo ipotizzato compensa meglio costi, tasse e shock di mercato.";

    const lineData = etf.yearlyStats.map((row, i) => ({
      year: row.year,
      ETF: row.p50,
      Weak: weakRes.yearlyStats[i].p50,
      Skilled: skilledRes.yearlyStats[i].p50,
      Strong: strongRes.yearlyStats[i].p50,
    }));

    const simpleRangeData = [
      { name: "ETF passivo", Peggiore: etf.finalStats.p5, Tipico: etf.finalStats.p50, Migliore: etf.finalStats.p95 },
      { name: "Trading bravo", Peggiore: skilledRes.finalStats.p5, Tipico: skilledRes.finalStats.p50, Migliore: skilledRes.finalStats.p95 },
    ];

    function requiredGross(baseProfile: { vol: number; cost: number; crash: number }, targetWin: number) {
      let lo = etfGross - 5;
      let hi = etfGross + 25;
      const quickPaths = Math.max(600, Math.round(numPaths * 0.35));
      for (let k = 0; k < 10; k++) {
        const mid = (lo + hi) / 2;
        const sim = simulateStrategy({ ...common, numPaths: quickPaths, rngSeed: 900 + k, annualGrossReturn: mid, annualVol: baseProfile.vol, annualCost: baseProfile.cost, annualWealthTax: applyIvafeTrading ? ivafe : 0, taxTiming: "annual", crashSensitivity: baseProfile.crash });
        const benchmark = simulateStrategy({ ...common, numPaths: quickPaths, rngSeed: 1200 + k, annualGrossReturn: etfGross, annualVol: etfVol, annualCost: etfTER + etfOther, annualWealthTax: applyIvafeEtf ? ivafe : 0, taxTiming: "end", crashSensitivity: 1 });
        const wr = compareWinRate(sim.finalWealth, benchmark.finalWealth);
        if (wr >= targetWin) hi = mid; else lo = mid;
      }
      return hi;
    }

    const needData = [40, 50, 60, 70].map((target) => ({
      target: `${target}% dei casi`,
      Debole: requiredGross(weak, target),
      Bravo: requiredGross(skilled, target),
      MoltoBravo: requiredGross(strong, target),
    }));

    const diagnostics = [
      `Simulazioni: ${numPaths}`,
      `Anni: ${years}`,
      `Capitale iniziale: ${fmtEUR(initialCapital)}`,
      `Versamento mensile: ${fmtEUR(monthlyContribution)}`,
      `Scenario guida: ${best.name}`,
    ];

    return { summary, lineData, simpleRangeData, needData, best, second, leadPct, bestReason, diagnostics };
  }, [initialCapital, monthlyContribution, years, numPaths, etfGross, etfVol, etfTER, etfOther, capTax, ivafe, applyIvafeEtf, applyIvafeTrading, useLossCarry, crashEnabled, crashYear, crashShock]);

  const legendItems = [
    { key: "ETF", label: "ETF passivo", color: THEME.etf },
    { key: "Weak", label: "Trading debole", color: THEME.weak },
    { key: "Skilled", label: "Trading bravo", color: THEME.skilled },
    { key: "Strong", label: "Trading molto bravo", color: THEME.strong },
  ];

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, color: THEME.text, padding: 16, boxSizing: "border-box" }}>
      <style>{`
        * { box-sizing: border-box; }
        .page-shell { max-width: 1280px; margin: 0 auto; display: grid; gap: 20px; }
        .hero-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 16px; align-items: stretch; }
        .profile-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .two-col-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .three-col-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .finance-glow-icon { width: 96px; height: 96px; }
        .profile-card-icon { position: absolute; right: 12px; top: 12px; width: 64px; height: 64px; }
        .dictionary-icon { position: absolute; right: 16px; top: 16px; width: 64px; height: 64px; }
        .tab-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding: 6px; border-radius: 18px; background: ${THEME.soft}; }
        @media (max-width: 1100px) {
          .hero-grid, .two-col-grid, .three-col-grid, .profile-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 760px) {
          .hero-grid, .two-col-grid, .three-col-grid, .profile-grid { grid-template-columns: 1fr; }
          .finance-glow-icon { width: 72px; height: 72px; }
        }
      `}</style>

      <div className="page-shell">
        <div className="hero-grid">
          <SurfaceCard title="Futuri finanziari a confronto" description="Una web app single-page per confrontare ETF passivo e scenari estremi di trading sullo stesso patrimonio iniziale.">
            <div style={{ display: "flex", minHeight: 1, flexDirection: "column", gap: 16, height: "100%" }}>
              <p style={{ maxWidth: 780, fontSize: 15, lineHeight: 1.8, color: THEME.muted, margin: 0 }}>
                In alto trovi ciò che conta di più: confronto visuale dei possibili esiti. Sotto trovi i parametri modificabili, organizzati in tre colonne vere per cambiare rapidamente il modello.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <DotPill color={THEME.etf}>ETF passivo</DotPill>
                <DotPill color={THEME.weak}>Trading debole</DotPill>
                <DotPill color={THEME.skilled}>Trading bravo</DotPill>
                <DotPill color={THEME.strong}>Trading molto bravo</DotPill>
              </div>

              <div
                style={{
                  position: "relative",
                  marginTop: "auto",
                  overflow: "hidden",
                  borderRadius: 22,
                  border: `1px solid ${THEME.border}`,
                  background: THEME.soft,
                  padding: "16px 96px 16px 16px",
                }}
              >
                <div style={{ position: "absolute", right: 8, top: 8, width: 96, height: 96, borderRadius: "50%", background: "#DDD6FE", filter: "blur(28px)", opacity: 0.72 }} />
                <SparklesIcon style={{ position: "absolute", right: 16, top: 16, width: 56, height: 56, color: THEME.strong, opacity: 0.09 }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: THEME.text }}>Chi è davanti in questo momento</div>
                <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: THEME.strong }}>{results.best.name}</div>
                <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.7, color: THEME.muted }}>
                  Ha una mediana finale di {fmtEUR(results.best.final)}. Il margine sul secondo scenario, {results.second.name}, è circa {fmtPct(results.leadPct)}.
                </div>
                <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.7, color: THEME.muted }}>{results.bestReason}</div>
              </div>
            </div>
          </SurfaceCard>

          <DefinitionRotor selectedTerm={selectedTerm} setSelectedTerm={setSelectedTerm} terms={TERMS} />
        </div>

        <ProfileGrid items={results.summary} />

        <div style={{ display: "grid", gap: 16 }}>
          <div className="tab-strip">
            <TabButton active={activeTab === "main"} onClick={() => setActiveTab("main")}>Chi cresce di più</TabButton>
            <TabButton active={activeTab === "range"} onClick={() => setActiveTab("range")}>Dove può finire</TabButton>
            <TabButton active={activeTab === "need"} onClick={() => setActiveTab("need")}>Quanto deve essere più bravo</TabButton>
          </div>

          {activeTab === "main" ? (
            <ChartShell title="Chi cresce di più nel tempo" description="Il confronto principale: come cambia il patrimonio tipico anno dopo anno." xLabel="Anni della simulazione" yLabel="Patrimonio tipico in euro (€)">
              <ClickableLegend items={legendItems} visibleSeries={visibleSeries} setVisibleSeries={setVisibleSeries} activeSeries={activeSeries} setActiveSeries={setActiveSeries} />
              <div style={{ width: "100%", height: 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.lineData} margin={{ top: 10, right: 20, left: 8, bottom: 8 }}>
                    <CartesianGrid stroke={THEME.grid} strokeDasharray="4 4" />
                    <XAxis dataKey="year" tick={{ fill: THEME.text, fontSize: 13 }} />
                    <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} tick={{ fill: THEME.text, fontSize: 13 }} width={56} />
                    <Tooltip content={<OrderedTooltip labelFormatter={(label) => `Anno ${label} · patrimonio tipico`} valueFormatter={(value, name) => `${fmtEUR(value)} · ${name}`} />} />
                    <ReferenceLine y={initialCapital} stroke={THEME.muted} strokeDasharray="6 6" />
                    {visibleSeries.ETF && <Line type="monotone" dataKey="ETF" name="ETF passivo" stroke={THEME.etf} strokeWidth={activeSeries === "ETF" ? 6 : 4} strokeOpacity={activeSeries && activeSeries !== "ETF" ? 0.22 : 1} dot={false} />}
                    {visibleSeries.Weak && <Line type="monotone" dataKey="Weak" name="Trading debole" stroke={THEME.weak} strokeWidth={activeSeries === "Weak" ? 6 : 4} strokeOpacity={activeSeries && activeSeries !== "Weak" ? 0.22 : 1} dot={false} />}
                    {visibleSeries.Skilled && <Line type="monotone" dataKey="Skilled" name="Trading bravo" stroke={THEME.skilled} strokeWidth={activeSeries === "Skilled" ? 6 : 4} strokeOpacity={activeSeries && activeSeries !== "Skilled" ? 0.22 : 1} dot={false} />}
                    {visibleSeries.Strong && <Line type="monotone" dataKey="Strong" name="Trading molto bravo" stroke={THEME.strong} strokeWidth={activeSeries === "Strong" ? 6 : 4} strokeOpacity={activeSeries && activeSeries !== "Strong" ? 0.22 : 1} dot={false} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartShell>
          ) : null}

          {activeTab === "range" ? (
            <ChartShell title="Scenario semplice: peggiore, tipico, migliore" description="Una lettura immediata del risultato finale in tre possibili zone." xLabel="Strategia confrontata" yLabel="Patrimonio finale in euro (€)">
              <div className="three-col-grid" style={{ paddingBottom: 16 }}>
                <MiniLegend color={THEME.bad} title="Peggiore" text="Esito sfavorevole." />
                <MiniLegend color={THEME.typical} title="Tipico" text="Esito più normale." />
                <MiniLegend color={THEME.good} title="Migliore" text="Esito favorevole." />
              </div>
              <div style={{ width: "100%", height: 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.simpleRangeData} margin={{ top: 10, right: 20, left: 8, bottom: 8 }}>
                    <CartesianGrid stroke={THEME.grid} strokeDasharray="4 4" />
                    <XAxis dataKey="name" tick={{ fill: THEME.text, fontSize: 13 }} />
                    <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} tick={{ fill: THEME.text, fontSize: 13 }} width={56} />
                    <Tooltip content={<OrderedTooltip labelFormatter={(label) => `${label} · patrimonio finale`} valueFormatter={(value, name) => `${fmtEUR(value)} · ${name}`} />} />
                    <Bar dataKey="Peggiore" name="Peggiore" fill={THEME.bad} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Tipico" name="Tipico" fill={THEME.typical} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Migliore" name="Migliore" fill={THEME.good} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartShell>
          ) : null}

          {activeTab === "need" ? (
            <ChartShell title="Quanto deve essere più bravo del mercato" description="Mostra il rendimento lordo annuo necessario perché il trading batta l’ETF con probabilità crescenti." xLabel="Probabilità di battere l'ETF" yLabel="Rendimento lordo annuo richiesto (%)">
              <div className="three-col-grid" style={{ paddingBottom: 16 }}>
                <MiniLegend color={THEME.weak} title="Trading debole" text="Vantaggio piccolo, serve molto extra-rendimento." />
                <MiniLegend color={THEME.skilled} title="Trading bravo" text="Metodo buono, ma non dominante." />
                <MiniLegend color={THEME.strong} title="Trading molto bravo" text="Vantaggio raro e più stabile." />
              </div>
              <div style={{ width: "100%", height: 360 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.needData} margin={{ top: 10, right: 20, left: 8, bottom: 8 }}>
                    <CartesianGrid stroke={THEME.grid} strokeDasharray="4 4" />
                    <XAxis dataKey="target" tick={{ fill: THEME.text, fontSize: 13 }} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: THEME.text, fontSize: 13 }} width={56} />
                    <Tooltip content={<OrderedTooltip labelFormatter={(label) => `${label} · rendimento richiesto`} valueFormatter={(value, name) => `${fmtPct(value)} · ${name}`} />} />
                    <Bar dataKey="Debole" name="Trading debole" fill={THEME.weak} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Bravo" name="Trading bravo" fill={THEME.skilled} radius={[8, 8, 0, 0]} />
                    <Bar dataKey="MoltoBravo" name="Trading molto bravo" fill={THEME.strong} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartShell>
          ) : null}
        </div>

        <SurfaceCard title="Parametri modificabili" description="Sotto i grafici trovi tutti i controlli, organizzati in tre colonne reali per occupare meno spazio e restare leggibili.">
          <div className="three-col-grid">
            <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, border: `1px solid ${THEME.border}`, background: THEME.soft, padding: "16px 96px 16px 16px" }}>
              <FinanceGlow icon={PiggyBankIcon} position="right" />
              <div style={{ marginBottom: 12, paddingRight: 24, fontSize: 14, fontWeight: 700, color: THEME.text }}>Capitale e orizzonte</div>
              <div style={{ display: "grid", gap: 12 }}>
                <NumberField label="Capitale iniziale (€)" value={initialCapital} setValue={setInitialCapital} step={1000} min={1000} />
                <NumberField label="Aggiunta mensile (€)" value={monthlyContribution} setValue={setMonthlyContribution} step={50} min={0} />
                <NumberField label="Orizzonte in anni" value={years} setValue={setYears} step={1} min={1} max={30} />
                <label style={{ display: "block" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: THEME.text, marginBottom: 6 }}>Numero simulazioni Monte Carlo: {numPaths}</div>
                  <input
                    type="range"
                    min={500}
                    max={4000}
                    step={250}
                    value={numPaths}
                    onChange={(e) => setNumPaths(Number(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </label>
              </div>
            </div>

            <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, border: `1px solid ${THEME.border}`, background: THEME.soft, padding: "16px 96px 16px 16px" }}>
              <FinanceGlow icon={LandmarkIcon} position="right" />
              <div style={{ marginBottom: 12, paddingRight: 24, fontSize: 14, fontWeight: 700, color: THEME.text }}>Ipotesi ETF</div>
              <div style={{ display: "grid", gap: 12 }}>
                <NumberField label="Rendimento lordo ETF annuo (%)" value={etfGross} setValue={setEtfGross} step={0.1} />
                <NumberField label="Volatilità ETF annua (%)" value={etfVol} setValue={setEtfVol} step={0.1} />
                <NumberField label="TER ETF (%)" value={etfTER} setValue={setEtfTER} step={0.01} />
                <NumberField label="Altri costi ETF (%)" value={etfOther} setValue={setEtfOther} step={0.01} />
                <NumberField label="Tassa capital gain (%)" value={capTax} setValue={setCapTax} step={0.1} />
              </div>
            </div>

            <div style={{ position: "relative", overflow: "hidden", borderRadius: 24, border: `1px solid ${THEME.border}`, background: THEME.soft, padding: "16px 96px 16px 16px" }}>
              <FinanceGlow icon={CoinStackIcon} position="right" />
              <div style={{ marginBottom: 12, paddingRight: 24, fontSize: 14, fontWeight: 700, color: THEME.text }}>Shock, tasse e opzioni</div>
              <div style={{ display: "grid", gap: 12 }}>
                <ToggleRow label="Crisi attiva" checked={crashEnabled} onChange={setCrashEnabled} />
                <NumberField label="Anno della crisi" value={crashYear} setValue={setCrashYear} step={1} min={1} max={years} />
                <NumberField label="Shock della crisi (%)" value={crashShock} setValue={setCrashShock} step={1} min={-80} max={0} />
                <ToggleRow label="IVAFE ETF" checked={applyIvafeEtf} onChange={setApplyIvafeEtf} />
                <ToggleRow label="IVAFE Trading" checked={applyIvafeTrading} onChange={setApplyIvafeTrading} />
                <ToggleRow label="Riporto minusvalenze" checked={useLossCarry} onChange={setUseLossCarry} />
                <NumberField label="IVAFE (%)" value={ivafe} setValue={setIvafe} step={0.01} min={0} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, borderRadius: 16, border: `1px solid ${THEME.border}`, background: "white", padding: 12, fontSize: 12, color: THEME.muted }}>
            <div style={{ marginBottom: 6, fontWeight: 700, color: THEME.text }}>Controllo rapido</div>
            <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              {results.diagnostics.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
