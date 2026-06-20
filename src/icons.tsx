import type React from "react";
import type { IconProps } from "./types";

export function IconBase({ children, className = "", style = {} }: React.PropsWithChildren<IconProps>) {
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

export function SparklesIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3l1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4L12 3z" />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8.8-2.2z" />
      <path d="M5 15l.8 2L8 17.8l-2.2.7L5 20.5l-.8-2L2 17.8l2.2-.8L5 15z" />
    </IconBase>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </IconBase>
  );
}

export function TrendingUpIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 16l5-5 4 4 7-8" />
      <path d="M15 7h5v5" />
    </IconBase>
  );
}

export function BarsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 19V11" />
      <path d="M12 19V6" />
      <path d="M19 19v-9" />
      <path d="M3 19h18" />
    </IconBase>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </IconBase>
  );
}

export function SlidersIcon(props: IconProps) {
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

export function PiggyBankIcon(props: IconProps) {
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

export function CoinsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <ellipse cx="9" cy="7" rx="4" ry="2.2" />
      <path d="M5 7v5c0 1.2 1.8 2.2 4 2.2s4-1 4-2.2V7" />
      <ellipse cx="16.5" cy="12.5" rx="3.5" ry="2" />
      <path d="M13 12.5V16c0 1.1 1.6 2 3.5 2s3.5-.9 3.5-2v-3.5" />
    </IconBase>
  );
}

export function LandmarkIcon(props: IconProps) {
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

export function ShieldIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3l7 3v5c0 4.5-2.7 7.8-7 10-4.3-2.2-7-5.5-7-10V6l7-3z" />
      <path d="M9.5 12l1.7 1.7L15 10" />
    </IconBase>
  );
}

export function CoinStackIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <ellipse cx="12" cy="6" rx="6" ry="2.5" />
      <path d="M6 6v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6" />
      <path d="M6 10v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4" />
    </IconBase>
  );
}
