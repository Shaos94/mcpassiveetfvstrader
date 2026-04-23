import React, { useEffect, useMemo, useState } from 'react'
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
} from 'recharts'

type IconProps = { className?: string; style?: React.CSSProperties }

type PremiumCardProps = {
  title: string
  description?: string
  icon?: React.ComponentType<IconProps> | null
  iconPosition?: 'left' | 'right'
  children: React.ReactNode
}

type NumberFieldProps = {
  label: string
  value: number
  setValue: (v: number) => void
  step?: number
  min?: number
  max?: number
}

type ToggleRowProps = {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}

type StrategyResult = {
  finalWealth: number[]
  finalStats: ReturnType<typeof quantiles>
  drawdownStats: ReturnType<typeof quantiles>
  yearlyStats: Array<{ year: number; p5: number; p50: number; p95: number }>
}

type OrderedTooltipProps = {
  active?: boolean
  payload?: Array<any>
  label?: string | number
  labelFormatter?: ((label: string | number | undefined) => string) | null
  valueFormatter?: ((value: number, name: string) => string) | null
}

const THEME = {
  bg: '#F7F5FF',
  panel: '#FFFFFF',
  soft: '#F1EBFF',
  soft2: '#E8DFFF',
  border: '#E5DDFF',
  text: '#231A35',
  muted: '#6D6591',
  grid: '#ECE5FF',
  etf: '#4F46E5',
  weak: '#C084FC',
  skilled: '#8B5CF6',
  strong: '#6D28D9',
  bad: '#FCA5A5',
  typical: '#93C5FD',
  good: '#86EFAC',
}

function SvgIcon({ children, className = 'icon', style }: React.PropsWithChildren<IconProps>) {
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
  )
}

function SparklesIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3l1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4L12 3z" />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8.8-2.2z" />
      <path d="M5 15l.8 2L8 17.8l-2.2.7L5 20.5l-.8-2L2 17.8l2.2-.8L5 15z" />
    </SvgIcon>
  )
}

function BookIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </SvgIcon>
  )
}

function OrbitIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="1.8" />
      <ellipse cx="12" cy="12" rx="8.5" ry="3.5" />
      <ellipse cx="12" cy="12" rx="3.5" ry="8.5" />
    </SvgIcon>
  )
}

function TrendingUpIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 16l5-5 4 4 7-8" />
      <path d="M15 7h5v5" />
    </SvgIcon>
  )
}

function BarsIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M5 19V11" />
      <path d="M12 19V6" />
      <path d="M19 19v-9" />
      <path d="M3 19h18" />
    </SvgIcon>
  )
}

function ArrowUpRightIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </SvgIcon>
  )
}

function SlidersIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M4 6h16" />
      <circle cx="9" cy="6" r="2" />
      <path d="M4 12h16" />
      <circle cx="15" cy="12" r="2" />
      <path d="M4 18h16" />
      <circle cx="11" cy="18" r="2" />
    </SvgIcon>
  )
}

function PiggyBankIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M6 12a6 6 0 0 1 9.6-4.8l2.2 1.6H20v3h-1l-1 2v2H8a4 4 0 0 1-4-4z" />
      <circle cx="14.5" cy="10.5" r=".8" fill="currentColor" stroke="none" />
      <path d="M11 8h3" />
      <path d="M8 17v2" />
      <path d="M15 17v2" />
    </SvgIcon>
  )
}

function CoinsIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <ellipse cx="9" cy="7" rx="4" ry="2.2" />
      <path d="M5 7v5c0 1.2 1.8 2.2 4 2.2s4-1 4-2.2V7" />
      <ellipse cx="16.5" cy="12.5" rx="3.5" ry="2" />
      <path d="M13 12.5V16c0 1.1 1.6 2 3.5 2s3.5-.9 3.5-2v-3.5" />
    </SvgIcon>
  )
}

function LandmarkIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M3 10l9-5 9 5" />
      <path d="M5 10v7" />
      <path d="M10 10v7" />
      <path d="M14 10v7" />
      <path d="M19 10v7" />
      <path d="M3 19h18" />
    </SvgIcon>
  )
}

function ShieldIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path d="M12 3l7 3v5c0 4.5-2.7 7.8-7 10-4.3-2.2-7-5.5-7-10V6l7-3z" />
      <path d="M9.5 12l1.7 1.7L15 10" />
    </SvgIcon>
  )
}

function CoinStackIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <ellipse cx="12" cy="6" rx="6" ry="2.5" />
      <path d="M6 6v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6" />
      <path d="M6 10v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4" />
    </SvgIcon>
  )
}

function fmtEUR(v: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(v || 0)
}

function fmtPct(v: number, d = 1) {
  return `${(v || 0).toFixed(d)}%`
}

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x))
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randn(rng: () => number) {
  let u = 0
  let v = 0
  while (u === 0) u = rng()
  while (v === 0) v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return 0
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  const w = idx - lo
  return sorted[lo] * (1 - w) + sorted[hi] * w
}

function quantiles(arr: number[]) {
  const s = [...arr].sort((a, b) => a - b)
  return {
    p5: percentile(s, 0.05),
    p50: percentile(s, 0.5),
    p95: percentile(s, 0.95),
  }
}

function annualToLogMonthly(muPct: number, sigmaPct: number) {
  const mu = muPct / 100
  const sigma = sigmaPct / 100
  return {
    drift: (mu - 0.5 * sigma * sigma) / 12,
    vol: sigma / Math.sqrt(12),
  }
}

function compareWinRate(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length)
  let wins = 0
  for (let i = 0; i < n; i++) if (a[i] > b[i]) wins++
  return (wins / n) * 100
}

function simulateStrategy({
  rngSeed,
  numPaths,
  years,
  initialCapital,
  monthlyContribution,
  annualGrossReturn,
  annualVol,
  annualCost,
  annualWealthTax,
  capGainsTax,
  taxTiming,
  useLossCarry,
  crashEnabled,
  crashYear,
  crashShock,
  crashSensitivity,
}: {
  rngSeed: number
  numPaths: number
  years: number
  initialCapital: number
  monthlyContribution: number
  annualGrossReturn: number
  annualVol: number
  annualCost: number
  annualWealthTax: number
  capGainsTax: number
  taxTiming: 'annual' | 'end'
  useLossCarry: boolean
  crashEnabled: boolean
  crashYear: number
  crashShock: number
  crashSensitivity: number
}): StrategyResult {
  const rng = mulberry32(rngSeed)
  const months = years * 12
  const crashMonth = clamp(crashYear, 1, years) * 12
  const { drift, vol } = annualToLogMonthly(annualGrossReturn, annualVol)
  const monthlyCost = annualCost / 100 / 12
  const monthlyWealthTax = annualWealthTax / 100 / 12

  const yearlySnapshots = Array.from({ length: years + 1 }, () => [] as number[])
  const finalWealth: number[] = []
  const drawdowns: number[] = []

  for (let p = 0; p < numPaths; p++) {
    let value = initialCapital
    let startOfYear = initialCapital
    let peak = initialCapital
    let maxDD = 0
    let lossCarry = [0, 0, 0, 0]
    yearlySnapshots[0].push(value)

    for (let m = 1; m <= months; m++) {
      value += monthlyContribution
      const z = randn(rng)
      let monthlyRet = Math.exp(drift + vol * z) - 1
      if (crashEnabled && m === crashMonth) monthlyRet += (crashShock / 100) * crashSensitivity

      value = value * (1 + monthlyRet)
      value = value * (1 - monthlyCost)
      value = value * (1 - monthlyWealthTax)
      value = Math.max(0, value)

      peak = Math.max(peak, value)
      maxDD = Math.max(maxDD, peak > 0 ? (peak - value) / peak : 0)

      if (m % 12 === 0) {
        if (taxTiming === 'annual') {
          const pnl = value - startOfYear - monthlyContribution * 12
          if (useLossCarry) {
            if (pnl > 0) {
              let taxable = pnl
              for (let i = 0; i < lossCarry.length; i++) {
                const offset = Math.min(taxable, lossCarry[i])
                taxable -= offset
                lossCarry[i] -= offset
              }
              value -= Math.max(0, taxable) * (capGainsTax / 100)
              lossCarry.pop()
              lossCarry.unshift(0)
            } else if (pnl < 0) {
              lossCarry.pop()
              lossCarry.unshift(Math.abs(pnl))
            } else {
              lossCarry.pop()
              lossCarry.unshift(0)
            }
          } else {
            value -= Math.max(0, pnl) * (capGainsTax / 100)
          }
          startOfYear = value
        }
        yearlySnapshots[m / 12].push(value)
      }
    }

    if (taxTiming === 'end') {
      const contributed = initialCapital + monthlyContribution * months
      const gain = Math.max(0, value - contributed)
      value -= gain * (capGainsTax / 100)
    }

    finalWealth.push(value)
    drawdowns.push(maxDD * 100)
  }

  return {
    finalWealth,
    finalStats: quantiles(finalWealth),
    drawdownStats: quantiles(drawdowns),
    yearlyStats: yearlySnapshots.map((arr, year) => ({ year, ...quantiles(arr) })),
  }
}

function NumberField({ label, value, setValue, step = 0.1, min, max }: NumberFieldProps) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => setValue(Number(e.target.value))}
        className="field-input"
      />
    </div>
  )
}

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="toggle-row">
      <span>{label}</span>
      <span className={`switch ${checked ? 'switch-on' : ''}`} aria-hidden="true">
        <span className="switch-knob" />
      </span>
    </button>
  )
}

function DotPill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="dot-pill">
      <span className="dot-pill-dot" style={{ backgroundColor: color }} />
      {children}
    </div>
  )
}

function FinanceGlow({ icon: Icon, position = 'right' }: { icon: React.ComponentType<IconProps>; position?: 'left' | 'right' }) {
  return (
    <>
      <div className={`finance-glow ${position === 'left' ? 'finance-glow-left' : 'finance-glow-right'}`} />
      <div className={`finance-icon-wrap ${position === 'left' ? 'finance-icon-left' : 'finance-icon-right'}`}>
        <Icon className="finance-icon" style={{ color: THEME.strong, opacity: 0.08 }} />
      </div>
    </>
  )
}

function PremiumCard({ title, description, icon: Icon, children, iconPosition = 'right' }: PremiumCardProps) {
  return (
    <section className="premium-card">
      {Icon ? <FinanceGlow icon={Icon} position={iconPosition} /> : null}
      <div className="premium-card-head">
        <h2 className="premium-card-title">{title}</h2>
        {description ? <p className="premium-card-description">{description}</p> : null}
      </div>
      <div className="premium-card-body">{children}</div>
    </section>
  )
}

function DefinitionRotor({
  selectedTerm,
  setSelectedTerm,
  terms,
}: {
  selectedTerm: string
  setSelectedTerm: (term: string) => void
  terms: Record<string, { title: string; text: string }>
}) {
  const [rotating, setRotating] = useState(false)

  useEffect(() => {
    setRotating(true)
    const t = setTimeout(() => setRotating(false), 550)
    return () => clearTimeout(t)
  }, [selectedTerm])

  const current = terms[selectedTerm]

  return (
    <PremiumCard title="Dizionario veloce" description="Tocca un termine e la scheda ruota dall’alto verso il basso.">
      <div className="stack-16">
        <div className="pill-row">
          {Object.entries(terms).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setSelectedTerm(key)}
              className="term-pill"
              style={{
                backgroundColor: selectedTerm === key ? THEME.strong : THEME.soft,
                color: selectedTerm === key ? 'white' : THEME.text,
                borderColor: selectedTerm === key ? THEME.strong : THEME.border,
              }}
            >
              {item.title}
            </button>
          ))}
        </div>

        <div
          className="definition-rotor"
          style={{
            transform: rotating ? 'rotateX(180deg)' : 'rotateX(0deg)',
            background: `linear-gradient(180deg, ${THEME.soft2} 0%, #FFFFFF 100%)`,
          }}
        >
          <div className="definition-glow" />
          <BookIcon className="definition-book" style={{ color: THEME.strong, opacity: 0.09 }} />
          <div className="definition-rotate-chip">↻</div>
          <div className="definition-center-text">
            <div className="definition-title">{current.title}</div>
            <div className="definition-text">{current.text}</div>
          </div>
        </div>
      </div>
    </PremiumCard>
  )
}

function ClickableLegend({
  items,
  visibleSeries,
  setVisibleSeries,
  activeSeries,
  setActiveSeries,
}: {
  items: Array<{ key: string; label: string; color: string }>
  visibleSeries: Record<string, boolean>
  setVisibleSeries: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  activeSeries: string | null
  setActiveSeries: (key: string | null) => void
}) {
  return (
    <div className="pill-row legend-row">
      {items.map((item) => {
        const visible = visibleSeries[item.key]
        const active = activeSeries === item.key
        return (
          <button
            key={item.key}
            onClick={() => setVisibleSeries((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
            onMouseEnter={() => setActiveSeries(item.key)}
            onMouseLeave={() => setActiveSeries(null)}
            className="legend-pill"
            style={{
              borderColor: item.color,
              backgroundColor: visible ? item.color : THEME.panel,
              color: visible ? 'white' : item.color,
              opacity: activeSeries && !active ? 0.55 : 1,
              boxShadow: active ? `0 0 0 4px ${THEME.soft}` : 'none',
            }}
          >
            {visible ? '✓' : '○'} {item.label}
          </button>
        )
      })}
    </div>
  )
}

function ProfileGrid({ items }: { items: Array<{ name: string; final: number; dd: number; win: number | null; tint: string }> }) {
  const icons = [PiggyBankIcon, CoinsIcon, TrendingUpIcon, ShieldIcon]
  return (
    <div className="profile-grid">
      {items.map((s, i) => {
        const Icon = icons[i % icons.length]
        const displayName = s.name === 'Trading molto bravo' ? 'Trader molto bravo' : s.name
        return (
          <div key={s.name} className="profile-card" style={{ backgroundColor: s.tint, borderColor: THEME.border }}>
            <div className="profile-glow" />
            <Icon className="profile-icon" style={{ color: THEME.strong, opacity: 0.08 }} />
            <div className="profile-content">
              <div className="profile-name">{displayName}</div>
              <div className="profile-value">{fmtEUR(s.final)}</div>
              <div className="profile-meta">
                {s.win == null ? `Caduta tipica: ${fmtPct(s.dd)}` : `Batte ETF: ${fmtPct(s.win)} • Caduta: ${fmtPct(s.dd)}`}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MiniLegend({ color, title, text }: { color: string; title: string; text: string }) {
  return (
    <div className="mini-legend">
      <div className="mini-legend-title">
        <span className="mini-legend-dot" style={{ backgroundColor: color }} />
        {title}
      </div>
      <div className="mini-legend-text">{text}</div>
    </div>
  )
}

function OrderedTooltip({ active, payload, label, labelFormatter = null, valueFormatter = null }: OrderedTooltipProps) {
  if (!active || !payload || !payload.length) return null
  const sorted = [...payload].sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0))
  const shownLabel = labelFormatter ? labelFormatter(label) : label

  return (
    <div className="ordered-tooltip">
      {shownLabel !== undefined && shownLabel !== null ? <div className="ordered-tooltip-label">{shownLabel}</div> : null}
      <div className="ordered-tooltip-list">
        {sorted.map((entry, index) => {
          const val = valueFormatter ? valueFormatter(Number(entry.value), entry.name) : entry.value
          return (
            <div key={`${entry.dataKey}-${index}`} className="ordered-tooltip-row">
              <div className="ordered-tooltip-name">
                <span className="ordered-tooltip-dot" style={{ backgroundColor: entry.color || entry.fill || THEME.strong }} />
                <span>{entry.name}</span>
              </div>
              <div className="ordered-tooltip-value">{val}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChartShell({
  title,
  description,
  xLabel,
  yLabel,
  icon,
  children,
}: {
  title: string
  description: string
  xLabel: string
  yLabel: string
  icon: React.ComponentType<IconProps>
  children: React.ReactNode
}) {
  return (
    <PremiumCard title={title} description={description} icon={icon}>
      <div className="stack-16">
        <div className="chart-frame">
          <div className="chart-y-label">{yLabel}</div>
          <div>{children}</div>
        </div>
        <div className="chart-x-label">{xLabel}</div>
      </div>
    </PremiumCard>
  )
}

const TERMS = {
  edge: {
    title: 'Edge',
    text: 'È un vantaggio reale e ripetibile. Il trader non vince per fortuna, ma perché il suo metodo compensa costi, tasse e periodi negativi.',
  },
  drawdown: {
    title: 'Drawdown',
    text: 'È la discesa più dolorosa del patrimonio dal punto più alto al punto più basso, prima del recupero.',
  },
  montecarlo: {
    title: 'Monte Carlo',
    text: 'È una simulazione che immagina molti futuri possibili. Non predice il futuro esatto, ma mostra una gamma di esiti plausibili.',
  },
  volatilita: {
    title: 'Volatilità',
    text: 'Misura quanto il percorso si muove su e giù. Più è alta, più il cammino è irregolare.',
  },
  lordo: {
    title: 'Rendimento lordo',
    text: 'È il rendimento prima di costi e tasse. Quello che resta davvero in tasca è il rendimento netto.',
  },
  scenari: {
    title: 'Peggiore, tipico, migliore',
    text: 'Tre letture semplici del risultato finale: una versione sfavorevole, una normale e una molto favorevole.',
  },
}

const profileDefaults = {
  weak: { gross: 9.5, vol: 26, cost: 4.5, crash: 1.1 },
  skilled: { gross: 13, vol: 22, cost: 3.5, crash: 0.95 },
  strong: { gross: 16, vol: 20, cost: 2.5, crash: 0.8 },
}

export default function App() {
  const [initialCapital, setInitialCapital] = useState(100000)
  const [monthlyContribution, setMonthlyContribution] = useState(400)
  const [years, setYears] = useState(10)
  const [numPaths, setNumPaths] = useState(2000)
  const [etfGross, setEtfGross] = useState(7)
  const [etfVol, setEtfVol] = useState(16)
  const [etfTER, setEtfTER] = useState(0.2)
  const [etfOther, setEtfOther] = useState(0.05)
  const [capTax, setCapTax] = useState(26)
  const [ivafe, setIvafe] = useState(0.2)
  const [applyIvafeEtf, setApplyIvafeEtf] = useState(false)
  const [applyIvafeTrading, setApplyIvafeTrading] = useState(false)
  const [useLossCarry, setUseLossCarry] = useState(true)
  const [crashEnabled, setCrashEnabled] = useState(true)
  const [crashYear, setCrashYear] = useState(2)
  const [crashShock, setCrashShock] = useState(-30)
  const [visibleSeries, setVisibleSeries] = useState({ ETF: true, Weak: true, Skilled: true, Strong: true })
  const [activeSeries, setActiveSeries] = useState<string | null>(null)
  const [selectedTerm, setSelectedTerm] = useState('edge')
  const [activeTab, setActiveTab] = useState<'main' | 'range' | 'need'>('main')

  const results = useMemo(() => {
    const weak = profileDefaults.weak
    const skilled = profileDefaults.skilled
    const strong = profileDefaults.strong

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
    }

    const etf = simulateStrategy({ ...common, rngSeed: 101, annualGrossReturn: etfGross, annualVol: etfVol, annualCost: etfTER + etfOther, annualWealthTax: applyIvafeEtf ? ivafe : 0, taxTiming: 'end', crashSensitivity: 1 })
    const weakRes = simulateStrategy({ ...common, rngSeed: 202, annualGrossReturn: weak.gross, annualVol: weak.vol, annualCost: weak.cost, annualWealthTax: applyIvafeTrading ? ivafe : 0, taxTiming: 'annual', crashSensitivity: weak.crash })
    const skilledRes = simulateStrategy({ ...common, rngSeed: 303, annualGrossReturn: skilled.gross, annualVol: skilled.vol, annualCost: skilled.cost, annualWealthTax: applyIvafeTrading ? ivafe : 0, taxTiming: 'annual', crashSensitivity: skilled.crash })
    const strongRes = simulateStrategy({ ...common, rngSeed: 404, annualGrossReturn: strong.gross, annualVol: strong.vol, annualCost: strong.cost, annualWealthTax: applyIvafeTrading ? ivafe : 0, taxTiming: 'annual', crashSensitivity: strong.crash })

    const summary = [
      { name: 'ETF passivo', final: etf.finalStats.p50, dd: etf.drawdownStats.p50, win: null, tint: '#EEF0FF' },
      { name: 'Trading debole', final: weakRes.finalStats.p50, dd: weakRes.drawdownStats.p50, win: compareWinRate(weakRes.finalWealth, etf.finalWealth), tint: '#FBF3FF' },
      { name: 'Trading bravo', final: skilledRes.finalStats.p50, dd: skilledRes.drawdownStats.p50, win: compareWinRate(skilledRes.finalWealth, etf.finalWealth), tint: '#F5F0FF' },
      { name: 'Trading molto bravo', final: strongRes.finalStats.p50, dd: strongRes.drawdownStats.p50, win: compareWinRate(strongRes.finalWealth, etf.finalWealth), tint: '#F0EBFF' },
    ]

    const ordered = [...summary].sort((a, b) => b.final - a.final)
    const best = ordered[0]
    const second = ordered[1]
    const leadPct = second && second.final > 0 ? ((best.final - second.final) / second.final) * 100 : 0
    const bestReason =
      best.name === 'ETF passivo'
        ? 'È davanti perché, con questi parametri, i costi e il drag fiscale sono più contenuti rispetto agli scenari di trading.'
        : 'È davanti perché, con questi parametri, il rendimento lordo ipotizzato compensa meglio costi, tasse e shock di mercato.'

    const lineData = etf.yearlyStats.map((row, i) => ({
      year: row.year,
      ETF: row.p50,
      Weak: weakRes.yearlyStats[i].p50,
      Skilled: skilledRes.yearlyStats[i].p50,
      Strong: strongRes.yearlyStats[i].p50,
    }))

    const simpleRangeData = [
      { name: 'ETF passivo', Peggiore: etf.finalStats.p5, Tipico: etf.finalStats.p50, Migliore: etf.finalStats.p95 },
      { name: 'Trading bravo', Peggiore: skilledRes.finalStats.p5, Tipico: skilledRes.finalStats.p50, Migliore: skilledRes.finalStats.p95 },
    ]

    function requiredGross(baseProfile: typeof profileDefaults.weak, targetWin: number) {
      let lo = etfGross - 5
      let hi = etfGross + 25
      const quickPaths = Math.max(600, Math.round(numPaths * 0.35))
      for (let k = 0; k < 10; k++) {
        const mid = (lo + hi) / 2
        const sim = simulateStrategy({
          ...common,
          numPaths: quickPaths,
          rngSeed: 900 + k,
          annualGrossReturn: mid,
          annualVol: baseProfile.vol,
          annualCost: baseProfile.cost,
          annualWealthTax: applyIvafeTrading ? ivafe : 0,
          taxTiming: 'annual',
          crashSensitivity: baseProfile.crash,
        })
        const benchmark = simulateStrategy({
          ...common,
          numPaths: quickPaths,
          rngSeed: 1200 + k,
          annualGrossReturn: etfGross,
          annualVol: etfVol,
          annualCost: etfTER + etfOther,
          annualWealthTax: applyIvafeEtf ? ivafe : 0,
          taxTiming: 'end',
          crashSensitivity: 1,
        })
        const wr = compareWinRate(sim.finalWealth, benchmark.finalWealth)
        if (wr >= targetWin) hi = mid
        else lo = mid
      }
      return hi
    }

    const needData = [40, 50, 60, 70].map((target) => ({
      target: `${target}% dei casi`,
      Debole: requiredGross(weak, target),
      Bravo: requiredGross(skilled, target),
      MoltoBravo: requiredGross(strong, target),
    }))

    const diagnostics = [
      `Simulazioni: ${numPaths}`,
      `Anni: ${years}`,
      `Capitale iniziale: ${fmtEUR(initialCapital)}`,
      `Versamento mensile: ${fmtEUR(monthlyContribution)}`,
      `Scenario guida: ${best.name}`,
    ]

    return { summary, lineData, simpleRangeData, needData, best, second, leadPct, bestReason, diagnostics }
  }, [initialCapital, monthlyContribution, years, numPaths, etfGross, etfVol, etfTER, etfOther, capTax, ivafe, applyIvafeEtf, applyIvafeTrading, useLossCarry, crashEnabled, crashYear, crashShock])

  const legendItems = [
    { key: 'ETF', label: 'ETF passivo', color: THEME.etf },
    { key: 'Weak', label: 'Trading debole', color: THEME.weak },
    { key: 'Skilled', label: 'Trading bravo', color: THEME.skilled },
    { key: 'Strong', label: 'Trading molto bravo', color: THEME.strong },
  ]

  return (
    <div className="page" style={{ backgroundColor: THEME.bg, color: THEME.text }}>
      <div className="app-shell">
        <section className="top-grid">
          <PremiumCard title="Futuri finanziari a confronto" description="Single-page app per confrontare ETF passivo e scenari estremi di trading sullo stesso patrimonio iniziale.">
            <div className="stack-16 grow-col">
              <p className="hero-copy">
                In alto trovi ciò che conta di più: confronto visuale dei possibili esiti. Sotto trovi i parametri modificabili, organizzati in tre colonne vere per cambiare rapidamente il modello.
              </p>
              <div className="pill-row">
                <DotPill color={THEME.etf}>ETF passivo</DotPill>
                <DotPill color={THEME.weak}>Trading debole</DotPill>
                <DotPill color={THEME.skilled}>Trading bravo</DotPill>
                <DotPill color={THEME.strong}>Trading molto bravo</DotPill>
              </div>
              <div className="leader-box">
                <div className="leader-glow" />
                <SparklesIcon className="leader-icon" style={{ color: THEME.strong, opacity: 0.09 }} />
                <div className="leader-label">Chi è davanti in questo momento</div>
                <div className="leader-title">{results.best.name}</div>
                <div className="leader-copy">
                  Ha una mediana finale di {fmtEUR(results.best.final)}. Il margine sul secondo scenario, {results.second.name}, è circa {fmtPct(results.leadPct)}.
                </div>
                <div className="leader-copy">{results.bestReason}</div>
              </div>
            </div>
          </PremiumCard>

          <DefinitionRotor selectedTerm={selectedTerm} setSelectedTerm={setSelectedTerm} terms={TERMS} />
        </section>

        <ProfileGrid items={results.summary} />

        <section className="stack-16">
          <div className="tabs-row">
            <button className={`tab-btn ${activeTab === 'main' ? 'tab-btn-active' : ''}`} onClick={() => setActiveTab('main')}>Chi cresce di più</button>
            <button className={`tab-btn ${activeTab === 'range' ? 'tab-btn-active' : ''}`} onClick={() => setActiveTab('range')}>Dove può finire</button>
            <button className={`tab-btn ${activeTab === 'need' ? 'tab-btn-active' : ''}`} onClick={() => setActiveTab('need')}>Quanto deve essere più bravo</button>
          </div>

          {activeTab === 'main' ? (
            <ChartShell title="Chi cresce di più nel tempo" description="Il confronto principale: come cambia il patrimonio tipico anno dopo anno." xLabel="Anni della simulazione" yLabel="Patrimonio tipico in euro (€)" icon={TrendingUpIcon}>
              <ClickableLegend items={legendItems} visibleSeries={visibleSeries} setVisibleSeries={setVisibleSeries} activeSeries={activeSeries} setActiveSeries={setActiveSeries} />
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.lineData} margin={{ top: 10, right: 20, left: 8, bottom: 8 }}>
                    <CartesianGrid stroke={THEME.grid} strokeDasharray="4 4" />
                    <XAxis dataKey="year" tick={{ fill: THEME.text, fontSize: 13 }} />
                    <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} tick={{ fill: THEME.text, fontSize: 13 }} width={56} />
                    <Tooltip content={<OrderedTooltip labelFormatter={(label) => `Anno ${label} · patrimonio tipico`} valueFormatter={(value, name) => `${fmtEUR(value)} · ${name}`} />} />
                    <ReferenceLine y={initialCapital} stroke={THEME.muted} strokeDasharray="6 6" />
                    {visibleSeries.ETF ? <Line type="monotone" dataKey="ETF" name="ETF passivo" stroke={THEME.etf} strokeWidth={activeSeries === 'ETF' ? 6 : 4} strokeOpacity={activeSeries && activeSeries !== 'ETF' ? 0.22 : 1} dot={false} /> : null}
                    {visibleSeries.Weak ? <Line type="monotone" dataKey="Weak" name="Trading debole" stroke={THEME.weak} strokeWidth={activeSeries === 'Weak' ? 6 : 4} strokeOpacity={activeSeries && activeSeries !== 'Weak' ? 0.22 : 1} dot={false} /> : null}
                    {visibleSeries.Skilled ? <Line type="monotone" dataKey="Skilled" name="Trading bravo" stroke={THEME.skilled} strokeWidth={activeSeries === 'Skilled' ? 6 : 4} strokeOpacity={activeSeries && activeSeries !== 'Skilled' ? 0.22 : 1} dot={false} /> : null}
                    {visibleSeries.Strong ? <Line type="monotone" dataKey="Strong" name="Trading molto bravo" stroke={THEME.strong} strokeWidth={activeSeries === 'Strong' ? 6 : 4} strokeOpacity={activeSeries && activeSeries !== 'Strong' ? 0.22 : 1} dot={false} /> : null}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartShell>
          ) : null}

          {activeTab === 'range' ? (
            <ChartShell title="Scenario semplice: peggiore, tipico, migliore" description="Una lettura immediata del risultato finale in tre possibili zone." xLabel="Strategia confrontata" yLabel="Patrimonio finale in euro (€)" icon={BarsIcon}>
              <div className="mini-legend-grid">
                <MiniLegend color={THEME.bad} title="Peggiore" text="Esito sfavorevole." />
                <MiniLegend color={THEME.typical} title="Tipico" text="Esito più normale." />
                <MiniLegend color={THEME.good} title="Migliore" text="Esito favorevole." />
              </div>
              <div className="chart-box">
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

          {activeTab === 'need' ? (
            <ChartShell title="Quanto deve essere più bravo del mercato" description="Mostra il rendimento lordo annuo necessario perché il trading batta l’ETF con probabilità crescenti." xLabel="Probabilità di battere l'ETF" yLabel="Rendimento lordo annuo richiesto (%)" icon={ArrowUpRightIcon}>
              <div className="mini-legend-grid">
                <MiniLegend color={THEME.weak} title="Trading debole" text="Vantaggio piccolo, serve molto extra-rendimento." />
                <MiniLegend color={THEME.skilled} title="Trading bravo" text="Metodo buono, ma non dominante." />
                <MiniLegend color={THEME.strong} title="Trading molto bravo" text="Vantaggio raro e più stabile." />
              </div>
              <div className="chart-box small-chart-box">
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
        </section>

        <PremiumCard title="Parametri modificabili" description="Sotto i grafici trovi tutti i controlli, organizzati in tre colonne reali per occupare meno spazio e restare leggibili." icon={SlidersIcon}>
          <div className="params-grid">
            <div className="param-box">
              <FinanceGlow icon={PiggyBankIcon} position="right" />
              <div className="param-title">Capitale e orizzonte</div>
              <div className="param-fields">
                <NumberField label="Capitale iniziale (€)" value={initialCapital} setValue={setInitialCapital} step={1000} min={1000} />
                <NumberField label="Aggiunta mensile (€)" value={monthlyContribution} setValue={setMonthlyContribution} step={50} min={0} />
                <NumberField label="Orizzonte in anni" value={years} setValue={setYears} step={1} min={1} max={30} />
                <div className="field">
                  <label className="field-label">Numero simulazioni Monte Carlo: {numPaths}</label>
                  <input className="range-input" type="range" min={500} max={4000} step={250} value={numPaths} onChange={(e) => setNumPaths(Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="param-box">
              <FinanceGlow icon={LandmarkIcon} position="right" />
              <div className="param-title">Ipotesi ETF</div>
              <div className="param-fields">
                <NumberField label="Rendimento lordo ETF annuo (%)" value={etfGross} setValue={setEtfGross} step={0.1} />
                <NumberField label="Volatilità ETF annua (%)" value={etfVol} setValue={setEtfVol} step={0.1} />
                <NumberField label="TER ETF (%)" value={etfTER} setValue={setEtfTER} step={0.01} />
                <NumberField label="Altri costi ETF (%)" value={etfOther} setValue={setEtfOther} step={0.01} />
                <NumberField label="Tassa capital gain (%)" value={capTax} setValue={setCapTax} step={0.1} />
              </div>
            </div>

            <div className="param-box">
              <FinanceGlow icon={CoinStackIcon} position="right" />
              <div className="param-title">Shock, tasse e opzioni</div>
              <div className="param-fields">
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

          <div className="diagnostic-box">
            <div className="diagnostic-title">Controllo rapido</div>
            <div className="diagnostic-grid">
              {results.diagnostics.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </div>
        </PremiumCard>
      </div>
    </div>
  )
}
