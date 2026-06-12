import React, { useEffect, useState } from "react";
import type { ProfilePreset } from "../simulation/presets";

export const THEME = {
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
  good: "#86EFAC",
};

export function SurfaceCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card">
      {title ? <h2 className="surface-card-title">{title}</h2> : null}
      {description ? <p className="surface-card-description">{description}</p> : null}
      <div className={title || description ? "surface-card-body" : undefined}>{children}</div>
    </section>
  );
}

export function ActHeader({
  act,
  title,
  lead,
}: {
  act: number;
  title: string;
  lead: string;
}) {
  return (
    <header className="act-header">
      <span className="act-chip">Atto {act}</span>
      <h2 className="act-title">{title}</h2>
      <p className="act-lead">{lead}</p>
    </header>
  );
}

export function ProfileSelector({
  profiles,
  selectedKey,
  onSelect,
}: {
  profiles: ProfilePreset[];
  selectedKey: string;
  onSelect: (key: ProfilePreset["key"]) => void;
}) {
  return (
    <div className="profile-options" role="radiogroup" aria-label="Profilo trader">
      {profiles.map((p) => {
        const selected = p.key === selectedKey;
        return (
          <button
            key={p.key}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`profile-option${selected ? " profile-option-selected" : ""}`}
            style={{ "--profile-color": p.color } as React.CSSProperties}
            onClick={() => onSelect(p.key)}
          >
            <span className="profile-option-name">{p.name}</span>
            <span className="profile-option-claim">“{p.claim}”</span>
            <span className="profile-option-meta">
              Net alpha {p.alphaPct > 0 ? "+" : ""}
              {p.alphaPct} pp · costi {p.costPct}%/anno
            </span>
            <span className="profile-option-rarity">{p.rarity}</span>
          </button>
        );
      })}
    </div>
  );
}

export function RarityCard({ profile }: { profile: ProfilePreset }) {
  return (
    <div className="rarity-card" style={{ "--profile-color": profile.color } as React.CSSProperties}>
      <div className="rarity-card-head">Quanto è rara questa skill?</div>
      <p className="rarity-card-text">{profile.rarityNote}</p>
      <div className="rarity-card-source">Fonte: {profile.source}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub ? <div className="stat-card-sub">{sub}</div> : null}
    </div>
  );
}

export function DotPill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="dot-pill">
      <span className="dot-pill-dot" style={{ background: color }} />
      {children}
    </span>
  );
}

export function MiniLegend({ color, title, text }: { color: string; title: string; text: string }) {
  return (
    <div className="mini-legend">
      <div className="mini-legend-title">
        <span className="mini-legend-dot" style={{ background: color }} />
        {title}
      </div>
      <div className="mini-legend-text">{text}</div>
    </div>
  );
}

/**
 * Campo numerico robusto: stato testuale locale, nessuno 0 spurio quando il
 * campo è vuoto o in digitazione intermedia, clamp ai limiti dichiarati.
 */
export function NumberField({
  label,
  value,
  setValue,
  step = 0.1,
  min,
  max,
  suffix,
}: {
  label: string;
  value: number;
  setValue: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    if (Number(text) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function commit(raw: string) {
    setText(raw);
    const parsed = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(parsed)) return;
    let next = parsed;
    if (min != null) next = Math.max(min, next);
    if (max != null) next = Math.min(max, next);
    setValue(next);
  }

  return (
    <label className="field">
      <span className="field-label">
        {label}
        {suffix ? <span className="field-suffix"> ({suffix})</span> : null}
      </span>
      <input
        className="field-input"
        type="number"
        value={text}
        min={min}
        max={max}
        step={step}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => setText(String(value))}
      />
    </label>
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" className="toggle-row" aria-pressed={checked} onClick={() => onChange(!checked)}>
      <span className="toggle-row-label">{label}</span>
      <span className={`switch${checked ? " switch-on" : ""}`}>
        <span className="switch-knob" />
      </span>
    </button>
  );
}

export function TermPills({
  terms,
  selected,
  onSelect,
}: {
  terms: Record<string, { title: string; text: string }>;
  selected: string;
  onSelect: (key: string) => void;
}) {
  const current = terms[selected];
  return (
    <div>
      <div className="term-pills">
        {Object.entries(terms).map(([key, t]) => (
          <button
            key={key}
            type="button"
            className={`term-pill${key === selected ? " term-pill-selected" : ""}`}
            aria-pressed={key === selected}
            onClick={() => onSelect(key)}
          >
            {t.title}
          </button>
        ))}
      </div>
      <div className="term-card">
        <div className="term-card-title">{current.title}</div>
        <p className="term-card-text">{current.text}</p>
      </div>
    </div>
  );
}

export function fmtEUR(v: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v || 0);
}

export function fmtSignedEUR(v: number): string {
  return `${v >= 0 ? "+" : "−"}${fmtEUR(Math.abs(v))}`;
}

export function fmtPct(v: number, d = 1): string {
  return `${(v || 0).toFixed(d)}%`;
}

export function fmtPp(v: number, d = 1): string {
  return `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(d)} pp`;
}
