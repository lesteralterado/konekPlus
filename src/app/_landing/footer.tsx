import Image from "next/image";
import Link from "next/link";
import { LOGO_URL } from "@/lib/constants";
import type { Dictionary } from "@/lib/i18n/dictionaries/types";
import type { Locale } from "@/lib/i18n/locale";
import { LanguageSwitcher } from "../language-switcher";

export function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.home;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 text-brand-900">
              <Image
                src={LOGO_URL}
                alt="Konek+ logo"
                width={28}
                height={28}
                unoptimized
                className="h-7 w-7 object-contain"
              />
              <span className="text-lg font-semibold tracking-tight">Konek+</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">{t.footer.tagline}</p>
          </div>

          <nav className="flex gap-10 text-sm">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t.footer.productKicker}
              </span>
              <a href="#how-it-works" className="text-slate-600 transition hover:text-brand-700">
                {t.nav.howItWorks}
              </a>
              <a href="#product" className="text-slate-600 transition hover:text-brand-700">
                {t.nav.product}
              </a>
              <a href="#about" className="text-slate-600 transition hover:text-brand-700">
                {t.nav.about}
              </a>
              <a href="#faq" className="text-slate-600 transition hover:text-brand-700">
                {t.nav.faq}
              </a>
              <Link href="/guide" className="text-slate-600 transition hover:text-brand-700">
                {dict.guide.kicker}
              </Link>
              <Link href="/login" className="text-slate-600 transition hover:text-brand-700">
                {dict.common.signIn}
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t.footer.legalKicker}
              </span>
              <Link href="/privacy" className="text-slate-600 transition hover:text-brand-700">
                {t.footer.privacyPolicy}
              </Link>
              <Link href="/terms" className="text-slate-600 transition hover:text-brand-700">
                {t.footer.termsOfService}
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {dict.common.langEnglish} / {dict.common.langFilipino}
              </span>
              <LanguageSwitcher locale={locale} />
            </div>
          </nav>
        </div>

        <div className="mt-12 border-t border-slate-100 pt-6 text-center text-xs text-slate-400 sm:text-left">
          © {year} Konek+. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
