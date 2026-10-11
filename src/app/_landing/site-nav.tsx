"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { LOGO_URL } from "@/lib/constants";
import { ArrowUpRightIcon } from "./icons";

type NavState = "top" | "overHero" | "overContent";

// Height of the compact (scrolled) bar — the point where the hero counts
// as "passed" for the dark→light frosted switch.
const COMPACT_NAV_HEIGHT = 64;

export function SiteNav({
  heroId,
  labels,
  switcherOnDark,
  switcherOnLight,
}: {
  heroId: string;
  labels: { howItWorks: string; product: string; faq: string; signIn: string };
  // Server-rendered LanguageSwitcher variants (plain forms → work without JS).
  switcherOnDark: ReactNode;
  switcherOnLight: ReactNode;
}) {
  const [state, setState] = useState<NavState>("top");

  useEffect(() => {
    const update = () => {
      if (window.scrollY < 24) return setState("top");
      const heroBottom =
        document.getElementById(heroId)?.getBoundingClientRect().bottom ?? 0;
      setState(heroBottom > COMPACT_NAV_HEIGHT ? "overHero" : "overContent");
    };

    // Initial read covers a reload that restores a mid-page scroll position.
    const frame = requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, [heroId]);

  const light = state === "overContent";
  const links = [
    { href: "#how-it-works", label: labels.howItWorks },
    { href: "#product", label: labels.product },
    { href: "#faq", label: labels.faq },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500 ease-out ${
        state === "top"
          ? "border-transparent"
          : light
            ? "border-slate-200/70 bg-white/70 backdrop-blur-xl backdrop-saturate-150"
            : "border-white/10 bg-brand-900/60 backdrop-blur-xl backdrop-saturate-150"
      }`}
    >
      <nav
        className={`mx-auto flex w-full max-w-6xl items-center justify-between px-6 transition-[padding] duration-500 ease-out ${
          state === "top" ? "py-6" : "py-3"
        }`}
      >
        <a
          href={`#${heroId}`}
          className={`flex items-center gap-2 transition-colors duration-500 ${
            light ? "text-brand-900" : "text-white"
          }`}
        >
          <Image
            src={LOGO_URL}
            alt="Konek+ logo"
            width={80}
            height={80}
            unoptimized
            className={`object-contain transition-[width,height] duration-500 ease-out ${
              state === "top" ? "h-12 w-12 sm:h-20 sm:w-20" : "h-10 w-10"
            }`}
          />
          <span className="text-lg font-semibold tracking-tight">Konek+</span>
        </a>

        <div
          className={`hidden items-center gap-8 text-sm font-medium transition-colors duration-500 md:flex ${
            light ? "text-slate-600" : "text-white/70"
          }`}
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`transition ${light ? "hover:text-brand-900" : "hover:text-white"}`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {light ? switcherOnLight : switcherOnDark}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-accent-500 py-2 pl-4 pr-2 text-sm font-semibold text-brand-900 transition hover:bg-accent-500/90"
          >
            {labels.signIn}
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-accent-500">
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
