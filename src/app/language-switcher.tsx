import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/locale";

// No "use client" needed — these are plain forms posting to a Server
// Action (same pattern as the sign-out button in src/app/admin/layout.tsx),
// so the switcher works even with JS disabled.
export function LanguageSwitcher({
  locale,
  variant = "light",
  className = "",
}: {
  locale: Locale;
  variant?: "light" | "dark" | "ios";
  className?: string;
}) {
  // "ios" follows the public profile's light/dark tokens (.profile-ui).
  const activeClass = {
    light: "text-brand-900",
    dark: "text-white",
    ios: "text-ios-label",
  }[variant];
  const inactiveClass = {
    light: "text-slate-400 hover:text-slate-600",
    dark: "text-white/50 hover:text-white/80",
    ios: "text-ios-label-3 hover:text-ios-label-2",
  }[variant];
  const dividerClass = {
    light: "text-slate-300",
    dark: "text-white/30",
    ios: "text-ios-label-3",
  }[variant];

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${className}`}>
      <form action={setLocale.bind(null, "en" satisfies Locale)}>
        <button
          type="submit"
          className={`transition ${locale === "en" ? activeClass : inactiveClass}`}
        >
          EN
        </button>
      </form>
      <span className={dividerClass}>·</span>
      <form action={setLocale.bind(null, "fil" satisfies Locale)}>
        <button
          type="submit"
          className={`transition ${locale === "fil" ? activeClass : inactiveClass}`}
        >
          FIL
        </button>
      </form>
    </div>
  );
}
