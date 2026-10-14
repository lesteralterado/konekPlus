type IconProps = { className?: string };

function Stroke({
  className,
  strokeWidth = 1.8,
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

export function TapIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M4.5 12a7.5 7.5 0 0 1 7.5-7.5" />
      <path d="M7.3 12a4.7 4.7 0 0 1 4.7-4.7" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </Stroke>
  );
}

export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <Stroke className={className} strokeWidth={2}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </Stroke>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9L1.5 7.7l5.9-.8L10 1.5z" />
    </svg>
  );
}

export function RefreshIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M20 11a8 8 0 0 0-14.9-3.5M4 5v4h4" />
      <path d="M4 13a8 8 0 0 0 14.9 3.5M20 19v-4h-4" />
    </Stroke>
  );
}

export function LinkChainIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M9.5 15.5 15.5 9.5" />
      <path d="M8 15H6a4 4 0 0 1 0-8h2" />
      <path d="M16 9h2a4 4 0 0 1 0 8h-2" />
    </Stroke>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Stroke className={className} strokeWidth={2}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Stroke>
  );
}

export function WalletIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5" />
      <path d="M16 14h.01" />
    </Stroke>
  );
}

export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </Stroke>
  );
}

export function QrIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h3v3M21 14v.01M14 21h7v-4M17 21v.01" />
    </Stroke>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <Stroke className={className} strokeWidth={2}>
      <path d="m6 9 6 6 6-6" />
    </Stroke>
  );
}
