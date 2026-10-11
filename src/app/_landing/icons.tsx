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

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <Stroke className={className} strokeWidth={2}>
      <path d="m6 9 6 6 6-6" />
    </Stroke>
  );
}
