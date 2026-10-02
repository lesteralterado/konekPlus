import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LOGO_URL } from "@/lib/constants";

// Shared header/footer for standalone pages that aren't the marketing
// homepage or the dashboard — currently src/app/(legal)/ and src/app/f/.
// Each consumer wraps `children` in its own width container, since a legal
// document and a short form want different max-widths.
export function SiteChrome({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();

  return (
    <>
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2 text-brand-900">
            <Image
              src={LOGO_URL}
              alt="Konek+ logo"
              width={24}
              height={24}
              unoptimized
              className="h-6 w-6 object-contain"
            />
            <span className="text-base font-semibold tracking-tight">Konek+</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 transition hover:text-brand-700"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-white">{children}</main>

      <footer className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-6 py-10 text-center text-xs text-slate-400 sm:flex-row sm:justify-between sm:text-left">
          <span>© {year} Konek+. All rights reserved.</span>
          <div className="flex gap-5">
            <Link href="/privacy" className="transition hover:text-brand-700">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-brand-700">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
