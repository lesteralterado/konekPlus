import { ChevronRightIcon } from "@/app/dashboard/icons";

// Server-safe building blocks for the public profile's iOS-style kit. No
// hooks here, so both server templates and client islands (share sheet,
// copy rows) can share the exact same classes. Colours come from the
// .profile-ui tokens in src/app/globals.css.

export type ActionVariant = "glass" | "solid" | "round";

const ACTION_ITEM: Record<ActionVariant, string> = {
  glass:
    "ios-press flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-white/15 py-2.5 text-white ring-1 ring-inset ring-white/20 backdrop-blur-xl backdrop-saturate-150",
  solid:
    "ios-press flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-ios-surface py-3 text-ios-tint",
  round: "ios-press flex min-w-0 flex-1 flex-col items-center gap-1.5 text-ios-tint",
};

export function actionItemClass(variant: ActionVariant) {
  return ACTION_ITEM[variant];
}

// Icon above label, identical for every action (incl. Share) so they line
// up — the old Editorial Share label rendered a size larger than the rest.
export function ActionItemContent({
  variant,
  icon,
  label,
}: {
  variant: ActionVariant;
  icon: React.ReactNode;
  label: string;
}) {
  if (variant === "round") {
    return (
      <>
        <span className="grid h-12 w-12 place-items-center rounded-full bg-ios-surface">
          {icon}
        </span>
        <span className="max-w-full truncate text-xs font-semibold">{label}</span>
      </>
    );
  }
  return (
    <>
      {icon}
      <span className="max-w-full truncate text-xs font-semibold">{label}</span>
    </>
  );
}

export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-4 pb-1.5 text-[13px] font-semibold uppercase tracking-wide text-ios-label-2">
      {children}
    </h2>
  );
}

// iOS "inset grouped" list. Rows must be direct children so the inset
// separators can drop on the last one (group-last/row).
export function GroupedList({
  header,
  children,
}: {
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      {header && <SectionHeader>{header}</SectionHeader>}
      <div className="overflow-hidden rounded-[22px] bg-ios-surface">{children}</div>
    </section>
  );
}

// App-icon style tile. White in both modes so brand-coloured glyphs (incl.
// the black TikTok/X marks) stay legible on dark surfaces.
export function IconTile({
  children,
  className = "bg-white text-slate-800 ring-1 ring-inset ring-black/5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`ios-squircle grid size-7.5 shrink-0 place-items-center rounded-lg ${className}`}
    >
      {children}
    </span>
  );
}

// Shared row body: the inset separator lives on this element (not the row),
// so it starts after the icon like iOS Settings.
export function RowBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`ml-3 flex min-h-13 min-w-0 flex-1 items-center gap-2 border-b border-ios-separator group-last/row:border-b-0 ${className}`}
    >
      {children}
    </span>
  );
}

export function RowText({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col py-2.5 text-left">
      <span className="truncate text-[17px] leading-snug text-ios-label">{title}</span>
      {subtitle && (
        <span className="truncate text-[13px] leading-snug text-ios-label-2">{subtitle}</span>
      )}
    </span>
  );
}

export function ListRow({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string | null;
}) {
  const external = /^https?:/i.test(href);
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="ios-row group/row flex items-center pl-4"
    >
      <IconTile>{icon}</IconTile>
      <RowBody className="pr-4">
        <RowText title={title} subtitle={subtitle} />
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-ios-label-3" />
      </RowBody>
    </a>
  );
}

export const glassChipClass =
  "inline-flex h-8 items-center rounded-full px-3 text-xs font-bold backdrop-blur-xl backdrop-saturate-150";
