import { useEffect, useState } from "react";
import type React from "react";
import { fmtEUR, fmtPct } from "./format";
import type { TERMS } from "./constants";
import { THEME } from "./theme";
import { BookIcon, CoinsIcon, PiggyBankIcon, ShieldIcon, TrendingUpIcon } from "./icons";
import type {
  ChartShellProps,
  ClickableLegendProps,
  DefinitionRotorProps,
  DotPillProps,
  IconProps,
  MiniLegendProps,
  NumberFieldProps,
  OrderedTooltipProps,
  ProfileGridProps,
  SurfaceCardProps,
  ToggleRowProps,
} from "./types";

export function SurfaceCard({ title, description, children }: SurfaceCardProps) {
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

export function NumberField({ label, value, setValue, step = 0.1, min, max }: NumberFieldProps) {
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

export function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
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

export function DotPill({ color, children }: DotPillProps) {
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

export function FinanceGlow({ icon: Icon, position = "right" }: { icon: React.ComponentType<IconProps>; position?: "left" | "right" }) {
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

export function DefinitionRotor({ selectedTerm, setSelectedTerm, terms }: DefinitionRotorProps) {
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

export function ClickableLegend({ items, visibleSeries, setVisibleSeries, activeSeries, setActiveSeries }: ClickableLegendProps) {
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

export function ProfileGrid({ items }: ProfileGridProps) {
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

export function MiniLegend({ color, title, text }: MiniLegendProps) {
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

export function OrderedTooltip({ active, payload, label, labelFormatter = null, valueFormatter = null }: OrderedTooltipProps) {
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

export function ChartShell({ title, description, xLabel, yLabel, children }: ChartShellProps) {
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

export function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
