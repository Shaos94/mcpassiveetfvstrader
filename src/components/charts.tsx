import React from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StrategyResult, WaterfallStep } from "../simulation/types";
import { THEME, fmtEUR, fmtPp, fmtSignedEUR } from "./ui";

function kFmt(v: number): string {
  return `${Math.round(v / 1000)}k`;
}

// ---------------------------------------------------------------------------
// Atto 2 — Evoluzione del patrimonio: mediane appaiate + banda p5–p95 del trader
// ---------------------------------------------------------------------------

export function WealthChart({
  etf,
  trader,
  traderColor,
  traderName,
}: {
  etf: StrategyResult;
  trader: StrategyResult;
  traderColor: string;
  traderName: string;
}) {
  const data = etf.yearly.map((row, i) => ({
    year: row.year,
    etf: Math.round(row.p50),
    trader: Math.round(trader.yearly[i]?.p50 ?? 0),
    band: [Math.round(trader.yearly[i]?.p5 ?? 0), Math.round(trader.yearly[i]?.p95 ?? 0)] as [number, number],
  }));

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 8, bottom: 8 }}>
          <CartesianGrid stroke={THEME.grid} strokeDasharray="4 4" />
          <XAxis dataKey="year" tick={{ fill: THEME.text, fontSize: 13 }} />
          <YAxis tickFormatter={kFmt} tick={{ fill: THEME.text, fontSize: 13 }} width={56} />
          <Tooltip
            content={
              <WealthTooltip traderColor={traderColor} traderName={traderName} />
            }
          />
          <Area
            dataKey="band"
            name="Banda trader (5°–95°)"
            stroke="none"
            fill={traderColor}
            fillOpacity={0.12}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="etf"
            name="ETF passivo"
            stroke={THEME.etf}
            strokeWidth={3.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="trader"
            name={traderName}
            stroke={traderColor}
            strokeWidth={3.5}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

type WealthTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ dataKey?: string; value?: number | [number, number] }>;
  traderColor: string;
  traderName: string;
};

function WealthTooltip({ active, label, payload, traderColor, traderName }: WealthTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const byKey = new Map(payload.map((e) => [e.dataKey, e.value]));
  const band = byKey.get("band") as [number, number] | undefined;
  const etf = byKey.get("etf") as number | undefined;
  const trader = byKey.get("trader") as number | undefined;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">Anno {label} · patrimonio mediano</div>
      {etf != null ? (
        <TooltipRow color={THEME.etf} name="ETF passivo" value={fmtEUR(etf)} />
      ) : null}
      {trader != null ? <TooltipRow color={traderColor} name={traderName} value={fmtEUR(trader)} /> : null}
      {band ? (
        <TooltipRow
          color={traderColor}
          name="Banda 5°–95° trader"
          value={`${fmtEUR(band[0])} – ${fmtEUR(band[1])}`}
          faded
        />
      ) : null}
    </div>
  );
}

function TooltipRow({
  color,
  name,
  value,
  faded,
}: {
  color: string;
  name: string;
  value: string;
  faded?: boolean;
}) {
  return (
    <div className="chart-tooltip-row" style={faded ? { opacity: 0.7 } : undefined}>
      <span className="chart-tooltip-name">
        <span className="chart-tooltip-dot" style={{ background: color }} />
        {name}
      </span>
      <span className="chart-tooltip-value">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Atto 3 — Waterfall del divario: barre flottanti, tooltip per chiave di passo
// ---------------------------------------------------------------------------

type WaterfallRow = {
  key: string;
  label: string;
  base: number;
  size: number;
  fill: string;
  /** Valore mostrato nel tooltip: livello per i totali, delta firmato per i passi. */
  display: string;
  kind: "total" | "delta";
};

export function WaterfallChart({
  steps,
  traderColor,
}: {
  steps: WaterfallStep[];
  traderColor: string;
}) {
  let running = 0;
  const rows: WaterfallRow[] = steps.map((s) => {
    if (s.kind === "total") {
      running = s.value;
      return {
        key: s.key,
        label: s.label,
        base: 0,
        size: s.value,
        fill: s.key === "etf" ? THEME.etf : traderColor,
        display: fmtEUR(s.value),
        kind: "total",
      };
    }
    const start = running;
    running += s.value;
    return {
      key: s.key,
      label: s.label,
      base: Math.min(start, running),
      size: Math.abs(s.value),
      fill: s.value >= 0 ? THEME.good : THEME.bad,
      display: fmtSignedEUR(s.value),
      kind: "delta",
    };
  });

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 10, right: 20, left: 8, bottom: 8 }}>
          <CartesianGrid stroke={THEME.grid} strokeDasharray="4 4" />
          <XAxis dataKey="label" tick={{ fill: THEME.text, fontSize: 12 }} interval={0} />
          <YAxis tickFormatter={kFmt} tick={{ fill: THEME.text, fontSize: 13 }} width={56} />
          <Tooltip content={<WaterfallTooltip />} cursor={{ fill: THEME.soft, opacity: 0.5 }} />
          <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="size" stackId="wf" radius={[8, 8, 0, 0]} isAnimationActive={false}>
            {rows.map((r) => (
              <Cell key={r.key} fill={r.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type WaterfallTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: WaterfallRow }>;
};

// Il match avviene sulla riga (key del passo) trasportata nel payload,
// mai per confronto di valori: due passi con lo stesso importo non si confondono.
function WaterfallTooltip({ active, payload }: WaterfallTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{row.label}</div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-name">
          <span className="chart-tooltip-dot" style={{ background: row.fill }} />
          {row.kind === "total" ? "Patrimonio mediano" : "Contributo al divario"}
        </span>
        <span className="chart-tooltip-value">{row.display}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Atto 4 — Net alpha richiesto per battere l'ETF, con cap dichiarato
// ---------------------------------------------------------------------------

export function AlphaRequiredChart({
  data,
  currentAlpha,
  traderColor,
}: {
  data: Array<{ target: string; alpha: number | null }>;
  currentAlpha: number;
  traderColor: string;
}) {
  const hasUnreachable = data.some((d) => d.alpha == null);
  return (
    <div>
      <div className="chart-box chart-box-short">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 8, bottom: 8 }}>
            <CartesianGrid stroke={THEME.grid} strokeDasharray="4 4" />
            <XAxis dataKey="target" tick={{ fill: THEME.text, fontSize: 13 }} />
            <YAxis
              tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}`}
              tick={{ fill: THEME.text, fontSize: 13 }}
              width={56}
            />
            <Tooltip content={<AlphaTooltip />} cursor={{ fill: THEME.soft, opacity: 0.5 }} />
            <ReferenceLine
              y={currentAlpha}
              stroke={traderColor}
              strokeDasharray="6 6"
              label={{
                value: `il tuo profilo: ${fmtPp(currentAlpha)}`,
                fill: traderColor,
                fontSize: 12,
                position: "insideTopRight",
              }}
            />
            <ReferenceLine y={0} stroke={THEME.muted} />
            <Bar dataKey="alpha" name="Net alpha richiesto" radius={[8, 8, 0, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.target} fill={d.alpha != null && d.alpha <= currentAlpha ? THEME.good : THEME.strong} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {hasUnreachable ? (
        <p className="chart-footnote">
          Le barre assenti indicano obiettivi non raggiungibili nemmeno con +15 pp di net alpha:
          oltre quel limite la simulazione smette di cercare e lo dichiara, invece di inventare un numero.
        </p>
      ) : null}
    </div>
  );
}

type AlphaTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: { target: string; alpha: number | null } }>;
};

function AlphaTooltip({ active, payload }: AlphaTooltipProps) {
  const row = payload?.[0]?.payload;
  if (!active || !row || row.alpha == null) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">Batte l'ETF nel {row.target} dei mercati</div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-name">Net alpha richiesto</span>
        <span className="chart-tooltip-value">{fmtPp(row.alpha)}</span>
      </div>
    </div>
  );
}
