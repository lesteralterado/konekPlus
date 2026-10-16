// Extra glyphs for the public profile, in the same stroke style as
// src/app/dashboard/icons.tsx (which still supplies Phone/Mail/Share/brands).

type IconProps = { className?: string };

function Svg({
  className = "h-5 w-5",
  strokeWidth = 1.9,
  children,
}: IconProps & { strokeWidth?: number; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function MessageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.5A8.4 8.4 0 1 1 21 11.5z" />
    </Svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth={2.4}>
      <polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

export function UserPlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15 20v-1.5A4.5 4.5 0 0 0 10.5 14h-5A4.5 4.5 0 0 0 1 18.5V20" />
      <circle cx="8" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </Svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 17 17 7M8 7h9v9" />
    </Svg>
  );
}

export function EllipsisIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className ?? "h-5 w-5"} aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}
