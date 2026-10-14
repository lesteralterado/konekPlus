import { formatPrice, LOWEST_PRICE_PHP } from "@/lib/finishes";
import { format } from "@/lib/i18n/format";
import { createPublicClient } from "@/lib/supabase/public";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/locale";
import { About } from "./_landing/about";
import { CtaBand, FinalCta } from "./_landing/cta";
import { Faq } from "./_landing/faq";
import { Footer } from "./_landing/footer";
import { Gallery } from "./_landing/gallery";
import { Hero } from "./_landing/hero";
import { FeatureMarquee } from "./_landing/marquee";
import { images } from "./_landing/images";
import { OrderSection } from "./_landing/order-section";
import { SiteNav } from "./_landing/site-nav";
import { SmoothScroll } from "./_landing/smooth-scroll";
import { StickyCta } from "./_landing/sticky-cta";
import { TryIt } from "./_landing/try-it";
import { Unboxing } from "./_landing/unboxing";
import { GuideSection } from "./guide/guide-section";
import { LanguageSwitcher } from "./language-switcher";

// Refresh the "cards claimed" stat every 5 minutes rather than on every
// request, so the homepage stays statically served.
export const revalidate = 300;

const HERO_ID = "top";
const ORDER_ID = "order";

// Sales funnel order: hook (hero + deck) → show it (unboxing) → proof
// (stats) → nudge (CTA) → detail (kit) → buy (order) → objections (FAQ).
// The owner-facing unboxing guide sits after the FAQ, out of the buying path.
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
          order: t.nav.order,
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
        <TryIt t={t.tryIt} />
        <Unboxing
          clip={images.unboxing}
          kicker={t.unboxing.kicker}
          beats={t.unboxing.beats}
        />
        <FeatureMarquee items={t.marquee} />
        <About
          t={t.about}
          claimedCount={claimedData ?? 0}
          recentViewCount={recentViewData ?? 0}
        />
        <CtaBand t={t.cta} />
        <Gallery t={t.gallery} />
        <OrderSection t={t} />
        <Faq t={t.faq} />
        <section id="guide" className="scroll-mt-24 bg-white py-20 sm:py-28">
          <GuideSection t={dict.guide} />
        </section>
        <FinalCta t={t.finalCta} />
      </main>
      <Footer dict={dict} locale={locale} />
      <StickyCta
        heroId={HERO_ID}
        orderId={ORDER_ID}
        fromLabel={format(t.stickyCta.from, { price: formatPrice(LOWEST_PRICE_PHP) })}
        orderLabel={t.stickyCta.order}
      />
    </>
  );
}
