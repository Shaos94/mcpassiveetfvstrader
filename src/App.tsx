import React, { useEffect, useMemo, useState } from "react";
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
import { clamp, compareWinRate, fmtEUR, fmtPct, simulateStrategy } from "./simulation";


const THEME = {
  bg: "#F7F5FF",
  panel: "#FFFFFF",
  soft: "#F1EBFF",
  soft2: "#E8DFFF",
  border: "#E5DDFF",
  text: "#231A35",
  muted: "#6D6591",
  grid: "#ECE5FF",
  etf: "#4F46E5",
  weak: "#C084FC",
  skilled: "#8B5CF6",
  strong: "#6D28D9",
  bad: "#FCA5A5",
  typical: "#93C5FD",
  good: "#86EFAC",
};

type IconProps = {
  className?: string;
  style?: React.CSSProperties;
};

type SurfaceCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

type NumberFieldProps = {
  label: string;
  value: number;
  setValue: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
};

type ToggleRowProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

type DotPillProps = {
  color: string;
  children: React.ReactNode;
};

type ProfileItem = {
  name: string;
  final: number;
  dd: number;
  win: number | null;
  tint: string;
};

type ProfileGridProps = {
  items: ProfileItem[];
};

type MiniLegendProps = {
  color: string;
  title: string;
  text: string;
};

type TooltipLike = {
  active?: boolean;
  payload?: Array<{
    color?: string;
    fill?: string;
    name?: string;
    value?: number;
    dataKey?: string;
  }>;
  label?: string | number;
};

type OrderedTooltipProps = TooltipLike & {
  labelFormatter?: ((label: string | number | undefined) => string) | null;
  valueFormatter?: ((value: number, name: string | undefined) => string) | null;
};

type ChartShellProps = {
  title: string;
  description: string;
  xLabel: string;
  yLabel: string;
  children: React.ReactNode;
};

type DefinitionRotorProps = {
  selectedTerm: keyof typeof TERMS;
  setSelectedTerm: (value: keyof typeof TERMS) => void;
  terms: typeof TERMS;
};

type ClickableLegendProps = {
  items: Array<{ key: string; label: string; color: string }>;
  visibleSeries: Record<string, boolean>;
  setVisibleSeries: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeSeries: string | null;
  setActiveSeries: React.Dispatch<React.SetStateAction<string | null>>;
};

function IconBase({ children, className = "", style = {} }: React.PropsWithChildren<IconProps>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function SparklesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3l1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4L12 3z" />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8.8-2.2z" />
      <path d="M5 15l.8 2L8 17.8l-2.2.7L5 20.5l-.8-2L2 17.8l2.2-.8L5 15z" />
    </IconBase>
  );
}

function BookIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </IconBase>
  );
}

function TrendingUpIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 16l5-5 4 4 7-8" />
      <path d="M15 7h5v5" />
    </IconBase>
  );
}

function BarsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 19V11" />
      <path d="M12 19V6" />
      <path d="M19 19v-9" />
      <path d="M3 19h18" />
    </IconBase>
  );
}

function ArrowUpRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </IconBase>
  );
}

function SlidersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16" />
      <circle cx="9" cy="6" r="2" />
      <path d="M4 12h16" />
      <circle cx="15" cy="12" r="2" />
      <path d="M4 18h16" />
      <circle cx="11" cy="18" r="2" />
    </IconBase>
  );
}

function PiggyBankIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 12a6 6 0 0 1 9.6-4.8l2.2 1.6H20v3h-1l-1 2v2H8a4 4 0 0 1-4-4z" />
      <circle cx="14.5" cy="10.5" r=".8" fill="currentColor" stroke="none" />
      <path d="M11 8h3" />
      <path d="M8 17v2" />
      <path d="M15 17v2" />
    </IconBase>
  );
}

function CoinsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <ellipse cx="9" cy="7" rx="4" ry="2.2" />
      <path d="M5 7v5c0 1.2 1.8 2.2 4 2.2s4-1 4-2.2V7" />
      <ellipse cx="16.5" cy="12.5" rx="3.5" ry="2" />
      <path d="M13 12.5V16c0 1.1 1.6 2 3.5 2s3.5-.9 3.5-2v-3.5" />
    </IconBase>
  );
}

function LandmarkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 10l9-5 9 5" />
      <path d="M5 10v7" />
      <path d="M10 10v7" />
      <path d="M14 10v7" />
      <path d="M19 10v7" />
      <path d="M3 19h18" />
    </IconBase>
  );
}

function ShieldIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3l7 3v5c0 4.5-2.7 7.8-7 10-4.3-2.2-7-5.5-7-10V6l7-3z" />
      <path d="M9.5 12l1.7 1.7L15 10" />
    </IconBase>
  );
}

function CoinStackIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <ellipse cx="12" cy="6" rx="6" ry="2.5" />
      <path d="M6 6v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6" />
      <path d="M6 10v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4" />
    </IconBase>
  );
}

function SurfaceCard({ title, description, children }: SurfaceCardProps) {
  return (
    <section
      style={{
        background: THEME.panel,
        border: `1px solid ${THEME.border}`,
        borderRadius: 28,
        boxShadow: "0 8px 22px rgba(36, 26, 53, 0.05)",
        overflow: "hidden",
        height: "100%",
      }}
    >
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: THEME.text }}>{title}</div>
        {description ? (
          <div style={{ fontSize: 14, lineHeight: 1.7, color: THEME.muted, marginTop: 8 }}>{description}</div>
        ) : null}
        <div style={{ marginTop: 16 }}>{children}</div>
      </div>
    </section>
  );
}

function NumberField({ label, value, setValue, step = 0.1, min, max }: NumberFieldProps) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: THEME.text, marginBottom: 6 }}>{label}</div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{
          width: "100%",
          height: 40,
          borderRadius: 16,
          border: `1px solid ${THEME.border}`,
          background: "white",
          padding: "0 12px",
          color: THEME.text,
          fontSize: 14,
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderRadius: 16,
        border: `1px solid ${THEME.border}`,
        background: "white",
        cursor: "pointer",
      }}
    >
      <span style={{ color: THEME.text, fontSize: 14 }}>{label}</span>
      <span
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          background: checked ? THEME.strong : "#D9D4ED",
          display: "inline-flex",
          alignItems: "center",
          padding: 2,
          boxSizing: "border-box",
          transition: "all 0.2s ease",
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "white",
            display: "block",
            transform: checked ? "translateX(20px)" : "translateX(0)",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
          }}
        />
      </span>
    </button>
  );
}

function DotPill({ color, children }: DotPillProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 999,
        border: `1px solid ${THEME.border}`,
        background: THEME.panel,
        color: THEME.text,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: color, display: "inline-block" }} />
      {children}
    </div>
  );
}

function FinanceGlow({ icon: Icon, position = "right" }: { icon: React.ComponentType<IconProps>; position?: "left" | "right" }) {
  const sideStyle: React.CSSProperties = position === "left" ? { left: 0 } : { right: 0 };
  const iconStyle: React.CSSProperties = position === "left" ? { left: 16 } : { right: 16 };

  return (
    <>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          ...sideStyle,
          width: 128,
          height: 128,
          borderRadius: "50%",
          background: "#E6DEFF",
          filter: "blur(28px)",
          opacity: 0.75,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "absolute", bottom: 12, ...iconStyle, pointerEvents: "none" }}>
        <Icon className="finance-glow-icon" style={{ color: THEME.strong, opacity: 0.08 }} />
      </div>
    </>
  );
}

function DefinitionRotor({ selectedTerm, setSelectedTerm, terms }: DefinitionRotorProps) {
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    setRotating(true);
    const t = setTimeout(() => setRotating(false), 550);
    return () => clearTimeout(t);
  }, [selectedTerm]);

  const current = terms[selectedTerm];

  return (
    <SurfaceCard title="Dizionario veloce" description="Tocca un termine e la scheda ruota dall’alto verso il basso.">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {Object.entries(terms).map(([key, item]) => (
          <button
            key={key}
            onClick={() => setSelectedTerm(key as keyof typeof TERMS)}
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: `1px solid ${selectedTerm === key ? THEME.strong : THEME.border}`,
              background: selectedTerm === key ? THEME.strong : THEME.soft,
              color: selectedTerm === key ? "white" : THEME.text,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {item.title}
          </button>
        ))}
      </div>

      <div
        style={{
          position: "relative",
          minHeight: 280,
          display: "flex",
          alignItems: "center",
          borderRadius: 24,
          border: `1px solid ${THEME.border}`,
          background: `linear-gradient(180deg, ${THEME.soft2} 0%, #FFFFFF 100%)`,
          padding: "24px 96px 24px 24px",
          transform: rotating ? "rotateX(180deg)" : "rotateX(0deg)",
          transformStyle: "preserve-3d",
          transformOrigin: "top center",
          transition: "transform 0.55s ease",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 8,
            top: 8,
            width: 112,
            height: 112,
            borderRadius: "50%",
            background: "#DDD6FE",
            filter: "blur(28px)",
            opacity: 0.72,
            pointerEvents: "none",
          }}
        />
        <BookIcon className="dictionary-icon" style={{ color: THEME.strong, opacity: 0.09 }} />
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 16,
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: THEME.strong,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 20px rgba(109,40,217,0.18)",
          }}
        >
          <span style={{ transform: rotating ? "rotateX(180deg)" : "rotateX(0deg)", transition: "transform 0.55s ease" }}>↻</span>
        </div>
        <div style={{ position: "relative", zIndex: 1, width: "100%", paddingTop: 28, textAlign: "center" }}>
          <div style={{ margin: "0 auto 12px", maxWidth: 420, fontSize: 36, fontWeight: 700, color: THEME.text }}>{current.title}</div>
          <div style={{ margin: "0 auto", maxWidth: 460, fontSize: 16, lineHeight: 1.8, color: THEME.muted }}>{current.text}</div>
        </div>
      </div>
    </SurfaceCard>
  );
}

function ClickableLegend({ items, visibleSeries, setVisibleSeries, activeSeries, setActiveSeries }: ClickableLegendProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
      {items.map((item) => {
        const visible = visibleSeries[item.key];
        const active = activeSeries === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setVisibleSeries((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
            onMouseEnter={() => setActiveSeries(item.key)}
            onMouseLeave={() => setActiveSeries(null)}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: `2px solid ${item.color}`,
              background: visible ? item.color : THEME.panel,
              color: visible ? "white" : item.color,
              opacity: activeSeries && !active ? 0.55 : 1,
              boxShadow: active ? `0 0 0 4px ${THEME.soft}` : "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {visible ? "✓" : "○"} {item.label}
          </button>
        );
      })}
    </div>
  );
}

function ProfileGrid({ items }: ProfileGridProps) {
  const icons = [PiggyBankIcon, CoinsIcon, TrendingUpIcon, ShieldIcon];

  return (
    <div className="profile-grid">
      {items.map((s, i) => {
        const Icon = icons[i % icons.length];
        const displayName = s.name === "Trading molto bravo" ? "Trader molto bravo" : s.name;
        return (
          <div
            key={s.name}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 24,
              border: `1px solid ${THEME.border}`,
              boxShadow: "0 8px 22px rgba(36, 26, 53, 0.05)",
              background: s.tint,
            }}
          >
            <div
              style={{
                position: "absolute",
                right: -16,
                top: -16,
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: "#E6DEFF",
                filter: "blur(28px)",
                opacity: 0.65,
                pointerEvents: "none",
              }}
            />
            <Icon className="profile-card-icon" style={{ color: THEME.strong, opacity: 0.08 }} />
            <div style={{ position: "relative", zIndex: 1, minHeight: 132, display: "flex", flexDirection: "column", justifyContent: "center", padding: "16px 80px 16px 16px" }}>
              <div style={{ marginBottom: 6, fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: THEME.text }}>{displayName}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: THEME.text }}>{fmtEUR(s.final)}</div>
              <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: THEME.muted }}>
                {s.win == null ? `Caduta tipica: ${fmtPct(s.dd)}` : `Batte ETF: ${fmtPct(s.win)} • Caduta: ${fmtPct(s.dd)}`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniLegend({ color, title, text }: MiniLegendProps) {
  return (
    <div style={{ borderRadius: 16, border: `1px solid ${THEME.border}`, background: THEME.panel, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: 14, fontWeight: 700, color: THEME.text }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: color, display: "inline-block" }} />
        {title}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: THEME.muted }}>{text}</div>
    </div>
  );
}

function OrderedTooltip({ active, payload, label, labelFormatter = null, valueFormatter = null }: OrderedTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const sorted = [...payload].sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0));
  const shownLabel = labelFormatter ? labelFormatter(label) : String(label ?? "");

  return (
    <div style={{ minWidth: 240, borderRadius: 16, border: `1px solid ${THEME.border}`, padding: 12, background: THEME.panel, boxShadow: "0 8px 22px rgba(36, 26, 53, 0.08)" }}>
      {shownLabel ? <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 700, color: THEME.text }}>{shownLabel}</div> : null}
      <div style={{ display: "grid", gap: 6 }}>
        {sorted.map((entry, index) => {
          const val = valueFormatter ? valueFormatter(Number(entry.value ?? 0), entry.name) : String(entry.value ?? "");
          return (
            <div key={`${entry.dataKey}-${index}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: THEME.text }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: entry.color || entry.fill || THEME.strong, display: "inline-block" }} />
                <span>{entry.name}</span>
              </div>
              <div style={{ color: THEME.text, fontWeight: 600, textAlign: "right" }}>{val}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartShell({ title, description, xLabel, yLabel, children }: ChartShellProps) {
  return (
    <SurfaceCard title={title} description={description}>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "56px minmax(0, 1fr)", alignItems: "stretch", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ transform: "rotate(-90deg)", whiteSpace: "nowrap", fontSize: 12, fontWeight: 600, color: THEME.muted }}>{yLabel}</div>
          </div>
          <div>{children}</div>
        </div>
        <div style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: THEME.muted }}>{xLabel}</div>
      </div>
    </SurfaceCard>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        border: 0,
        padding: "12px 14px",
        borderRadius: 16,
        background: active ? THEME.strong : "transparent",
        color: active ? "white" : THEME.text,
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

const TERMS = {
  edge: { title: "Edge", text: "È un vantaggio reale e ripetibile. Il trader non vince per fortuna, ma perché il suo metodo compensa costi, tasse e periodi negativi." },
  drawdown: { title: "Drawdown", text: "È la discesa più dolorosa del patrimonio dal punto più alto al punto più basso, prima del recupero." },
  montecarlo: { title: "Monte Carlo", text: "È una simulazione che immagina molti futuri possibili. Non predice il futuro esatto, ma mostra una gamma di esiti plausibili." },
  volatilita: { title: "Volatilità", text: "Misura quanto il percorso si muove su e giù. Più è alta, più il cammino è irregolare." },
  lordo: { title: "Rendimento lordo", text: "È il rendimento prima di costi e tasse. Quello che resta davvero in tasca è il rendimento netto." },
  scenari: { title: "Peggiore, tipico, migliore", text: "Tre letture semplici del risultato finale: una versione sfavorevole, una normale e una molto favorevole." },
};

const profileDefaults = {
  weak: { gross: 9.5, vol: 26, cost: 4.5, crash: 1.1 },
  skilled: { gross: 13, vol: 22, cost: 3.5, crash: 0.95 },
  strong: { gross: 16, vol: 20, cost: 2.5, crash: 0.8 },
};

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
  const [visibleSeries, setVisibleSeries] = useState({ ETF: true, Weak: true, Skilled: true, Strong: true });
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
