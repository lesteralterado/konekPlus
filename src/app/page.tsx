import { createPublicClient } from "@/lib/supabase/public";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/locale";
import { About } from "./_landing/about";
import { CtaBand, FinalCta } from "./_landing/cta";
import { Faq } from "./_landing/faq";
import { Footer } from "./_landing/footer";
import { Gallery } from "./_landing/gallery";
import { Hero } from "./_landing/hero";
import { LogoStrip } from "./_landing/logo-strip";
import { Showcase } from "./_landing/showcase";
import { SiteNav } from "./_landing/site-nav";
import { SmoothScroll } from "./_landing/smooth-scroll";
import { GuideSection } from "./guide/guide-section";
import { LanguageSwitcher } from "./language-switcher";

// Refresh the "cards claimed" stat every 5 minutes rather than on every
// request, so the homepage stays statically served.
export const revalidate = 300;

const HERO_ID = "top";

export default async function Home() {
  const supabase = createPublicClient();
  const [
    locale,
    dict,
    { data: claimedData },
    { data: recentViewData },
    { data: avgRatingData },
    { data: ratingCountData },
  ] = await Promise.all([
    getLocale(),
    getDictionary(),
    supabase.rpc("claimed_tag_count"),
    supabase.rpc("recent_tag_view_count"),
    supabase.rpc("average_feedback_rating"),
    supabase.rpc("feedback_rating_count"),
  ]);
  const t = dict.home;

  return (
    <>
      <SmoothScroll />
      <SiteNav
        heroId={HERO_ID}
        labels={{
          howItWorks: t.nav.howItWorks,
          product: t.nav.product,
          faq: t.nav.faq,
          signIn: dict.common.signIn,
        }}
        switcherOnDark={<LanguageSwitcher locale={locale} variant="dark" />}
        switcherOnLight={<LanguageSwitcher locale={locale} />}
      />
      <main className="flex-1">
        <Hero
          id={HERO_ID}
          t={t}
          averageRating={avgRatingData ?? null}
          ratingCount={ratingCountData ?? 0}
        />
        <LogoStrip />
        <About
          t={t.about}
          claimedCount={claimedData ?? 0}
          recentViewCount={recentViewData ?? 0}
        />
        <Gallery t={t.gallery} />
        <section id="guide" className="scroll-mt-24 bg-white py-20 sm:py-28">
          <GuideSection t={dict.guide} />
        </section>
        <Showcase />
        <CtaBand t={t.cta} />
        <Faq t={t.faq} />
        <FinalCta t={t.finalCta} />
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
