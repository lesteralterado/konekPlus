type IconProps = { className?: string };

const base = "h-5 w-5";

function Svg({ className = base, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M14 8.5h-1.5a2 2 0 0 0-2 2V12H9v2.5h1.5V19h2.5v-4.5H15l.4-2.5h-2.4v-1.2a.7.7 0 0 1 .7-.7H15z" />
    </Svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </Svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 4v10.5a3.5 3.5 0 1 1-3-3.46" />
      <path d="M14 4c0 2.5 2 4.5 4.5 4.5" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <polyline points="15 18 9 12 15 6" />
    </Svg>
  );
}

export function KeychainIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="4.5" />
      <path d="M11.2 11.2 20 20" />
      <path d="M15.5 15.5 20 15.5 20 20" />
    </Svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  );
}
