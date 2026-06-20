import type React from "react";
import type { TERMS } from "./constants";

export type IconProps = {
  className?: string;
  style?: React.CSSProperties;
};

export type SurfaceCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export type NumberFieldProps = {
  label: string;
  value: number;
  setValue: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
};

export type ToggleRowProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

export type DotPillProps = {
  color: string;
  children: React.ReactNode;
};

export type ProfileItem = {
  name: string;
  final: number;
  dd: number;
  win: number | null;
  tint: string;
};

export type ProfileGridProps = {
  items: ProfileItem[];
};

export type MiniLegendProps = {
  color: string;
  title: string;
  text: string;
};

export type TooltipLike = {
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

export type OrderedTooltipProps = TooltipLike & {
  labelFormatter?: ((label: string | number | undefined) => string) | null;
  valueFormatter?: ((value: number, name: string | undefined) => string) | null;
};

export type ChartShellProps = {
  title: string;
  description: string;
  xLabel: string;
  yLabel: string;
  children: React.ReactNode;
};

export type DefinitionRotorProps = {
  selectedTerm: keyof typeof TERMS;
  setSelectedTerm: (value: keyof typeof TERMS) => void;
  terms: typeof TERMS;
};

export type ClickableLegendProps = {
  items: Array<{ key: string; label: string; color: string }>;
  visibleSeries: Record<string, boolean>;
  setVisibleSeries: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeSeries: string | null;
  setActiveSeries: React.Dispatch<React.SetStateAction<string | null>>;
};
