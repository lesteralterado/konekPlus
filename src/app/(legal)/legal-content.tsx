import type { ReactNode } from "react";

export function LegalHeader({ title, updated }: { title: string; updated: string }) {
  return (
    <header className="mb-12">
      <h1 className="text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-slate-400">Last updated {updated}</p>
    </header>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10 border-t border-slate-100 pt-10 first:mt-0 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-semibold text-brand-900">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-slate-300">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
