import Image from "next/image";
import Link from "next/link";
import { LOGO_URL } from "@/lib/constants";
import { createPublicClient } from "@/lib/supabase/public";

// Refresh the "cards claimed" stat every 5 minutes rather than on every
// request, so the homepage stays statically served.
export const revalidate = 300;

function TapIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4.5 12a7.5 7.5 0 0 1 7.5-7.5" />
      <path d="M7.3 12a4.7 4.7 0 0 1 4.7-4.7" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9L1.5 7.7l5.9-.8L10 1.5z" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 11a8 8 0 0 0-14.9-3.5M4 5v4h4" />
      <path d="M4 13a8 8 0 0 0 14.9 3.5M20 19v-4h-4" />
    </svg>
  );
}

function LinkChainIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9.5 15.5 15.5 9.5" />
      <path d="M8 15H6a4 4 0 0 1 0-8h2" />
      <path d="M16 9h2a4 4 0 0 1 0 8h-2" />
    </svg>
  );
}

function CardChipIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <rect x="1" y="1" width="22" height="14" rx="3" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  );
}

function buildFloatingCards(claimedCount: number) {
  return [
    {
      tilt: "-rotate-[6deg] translate-y-2 md:-rotate-[12deg] md:translate-y-4",
      z: "z-10",
      content: (
        <div className="flex h-full flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              A
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Alex Ade</p>
              <p className="text-[10px] text-slate-400">Studio Lead</p>
            </div>
          </div>
          <div className="h-px bg-slate-100" />
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-900 px-2.5 py-1 text-[10px] font-medium text-white">
            Save to contacts
          </span>
        </div>
      ),
    },
    {
      tilt: "-rotate-[3deg] translate-y-1 md:-rotate-[5deg] md:translate-y-1",
      z: "z-20",
      content: (
        <div className="flex h-full flex-col items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <TapIcon className="h-[18px] w-[18px]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">Tap to connect</p>
            <p className="text-[10px] text-slate-400">Works with any phone</p>
          </div>
        </div>
      ),
    },
    {
      tilt: "-translate-y-1 md:-translate-y-3",
      z: "z-30",
      content: (
        <div className="flex h-full flex-col justify-between gap-3">
          <div className="flex items-center justify-center gap-1.5">
            <CardChipIcon className="h-3 w-[18px] text-slate-300" />
            <CardChipIcon className="h-3 w-[18px] text-slate-400" />
            <CardChipIcon className="h-3 w-[18px] text-brand-600" />
          </div>
          <div className="flex justify-center text-slate-300">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M12 4v13M7 13l5 5 5-5" />
            </svg>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-brand-700">
            <UserIcon className="h-4 w-4" />
            <p className="text-[10px] font-semibold text-slate-800">1 profile</p>
          </div>
        </div>
      ),
    },
    {
      tilt: "rotate-[4deg] translate-y-1 md:rotate-[7deg] md:translate-y-2",
      z: "z-20",
      dark: true,
      content: (
        <div className="flex h-full flex-col justify-between">
          <p className="text-2xl font-bold text-white">{claimedCount}</p>
          <p className="text-[10px] leading-snug text-white/50">
            cards linked so far
          </p>
        </div>
      ),
    },
    {
      tilt: "rotate-[7deg] translate-y-2 md:rotate-[13deg] md:translate-y-5",
      z: "z-10",
      content: (
        <div className="flex h-full flex-col items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500/15 text-accent-500">
            <RefreshIcon className="h-[18px] w-[18px]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">Edit once</p>
            <p className="text-[10px] text-slate-400">Every card updates instantly</p>
          </div>
        </div>
      ),
    },
  ];
}

const faqs = [
  {
    q: "Do I need to install an app?",
    a: "No. Tapping a Konek+ card opens your profile straight in the phone's browser — nothing to download, on iPhone or Android.",
  },
  {
    q: "What if I have more than one Konek+ card?",
    a: "Every card you own links back to the same profile. Edit it once from your dashboard and the change shows up no matter which card gets tapped.",
  },
  {
    q: "Can I change my info after the card is already out in the world?",
    a: "Yes — sign in to your dashboard any time to update your name, photo, contact details, or socials.",
  },
  {
    q: "Who can see my public profile?",
    a: "Anyone who taps or scans your card — that's the point. You choose exactly what goes on it: name, contact info, and socials, nothing more.",
  },
  {
    q: "What happens if a card is lost?",
    a: "Contact us and we'll unlink it from your profile, so it can't share your info anymore and can be reissued.",
  },
];

const productGallery: {
  title: string;
  description: string;
  src: string;
}[] = [
  {
    title: "The full kit",
    description: "Your Konek+ card, arriving ready to tap on day one.",
    src: "https://res.cloudinary.com/dhxi75eld/image/upload/v1789025285/ChatGPT_Image_Sep_10_2026_02_59_11_PM_dhpx6b.png",
  },
  {
    title: "Every angle",
    description: "A closer look at the card from all sides.",
    src: "https://res.cloudinary.com/dhxi75eld/image/upload/v1789025282/ChatGPT_Image_Sep_10_2026_03_00_56_PM_u31ljz.png",
  },
  {
    title: "Thoughtful packaging",
    description: "Presentation that feels as premium as the card itself.",
    src: "https://res.cloudinary.com/dhxi75eld/image/upload/v1789025270/ChatGPT_Image_Sep_10_2026_02_57_04_PM_hwvubn.png",
  },
  {
    title: "What's inside",
    description: "The NFC chip and antenna that make the tap work.",
    src: "https://res.cloudinary.com/dhxi75eld/image/upload/v1789025560/ChatGPT_Image_Sep_10_2026_03_31_50_PM_xcvlyr.png",
  },
];

export default async function Home() {
  const supabase = createPublicClient();
  const [{ data: claimedData }, { data: recentViewData }] = await Promise.all([
    supabase.rpc("claimed_tag_count"),
    supabase.rpc("recent_tag_view_count"),
  ]);
  const claimedCount = claimedData ?? 0;
  const recentViewCount = recentViewData ?? 0;
  const floatingCards = buildFloatingCards(claimedCount);

  const year = new Date().getFullYear();

  return (
    <>
    <main className="flex-1">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-brand-900">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://res.cloudinary.com/dhxi75eld/image/upload/v1788155374/NFC_business_cards_render_2K_202608311349_wkunuq.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-900/80 via-brand-900/60 to-brand-900/85" />

        <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2 text-white">
            {/* <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"> */}
              <Image
                src={LOGO_URL}
                alt="Konek+ logo"
                width={20}
                height={20}
                unoptimized
                className="h-20 w-20 object-contain"
              />
            {/* </span> */}
            <span className="text-lg font-semibold tracking-tight">Konek+</span>
          </div>

          <div className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#about" className="transition hover:text-white">
              About
            </a>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-accent-500 py-2 pl-4 pr-2 text-sm font-semibold text-brand-900 transition hover:bg-accent-500/90"
          >
            Sign in
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-accent-500">
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </span>
          </Link>
        </nav>

        <div
          className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 pb-10 pt-8 text-center sm:pt-14"
          style={{ textShadow: "0 2px 20px rgba(0,0,0,0.45)" }}
        >
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-medium uppercase tracking-wide text-white/80 backdrop-blur-sm">
            NFC digital business cards
          </span>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white text-balance sm:text-5xl">
            Tap your card,
            <br />
            <span className="text-accent-500">share who you are.</span>
          </h1>

          <p className="mt-5 max-w-md text-balance text-white/75">
            One profile behind every card you own. Update it once, and
            every tap — on any card — stays current.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#how-it-works"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              See how it works
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-accent-500 py-2.5 pl-5 pr-2.5 text-sm font-semibold text-brand-900 transition hover:bg-accent-500/90"
            >
              Sign in to your dashboard
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-accent-500">
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>

          <div className="mt-7 flex flex-col items-center gap-1.5">
            <div className="flex gap-0.5 text-accent-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} className="h-3.5 w-3.5" />
              ))}
            </div>
            <p className="text-xs text-white/55">
              Rated X.X/5 by XX+ card owners{" "}
              <span className="italic text-white/35">(placeholder)</span>
            </p>
          </div>

          <p className="mt-6 text-sm text-white/55">
            Got a new card? Tap it — the code on the back opens{" "}
            <code className="rounded bg-white/15 px-1.5 py-0.5 text-white/80">
              /t/&lt;code&gt;
            </code>
            .
          </p>
        </div>

        <div
          id="how-it-works"
          className="relative z-10 mx-auto flex max-w-5xl scroll-mt-24 items-end justify-center px-6 pb-16 -space-x-9 sm:-space-x-4 md:space-x-0 md:gap-3 lg:gap-5 md:pb-20"
        >
          {floatingCards.map((card, i) => (
            <div
              key={i}
              className={`h-28 w-20 shrink-0 cursor-default rounded-2xl p-3 shadow-xl transition-all duration-300 ease-out hover:z-40 hover:-translate-y-3 hover:rotate-0 hover:scale-105 hover:shadow-2xl sm:h-32 sm:w-28 sm:p-4 md:w-32 lg:w-40 ${card.tilt} ${card.z} ${
                card.dark ? "bg-brand-900 ring-1 ring-white/10" : "bg-white"
              }`}
            >
              {card.content}
            </div>
          ))}
        </div>
      </section>

      {/* ============ LOGO STRIP ============ */}
      <section className="border-b border-slate-100 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-300"
            >
              <span className="h-2 w-2 rounded-full bg-slate-200" />
              Logoipsum
            </span>
          ))}
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section id="about" className="scroll-mt-24 bg-white py-20 sm:py-28">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              • About us
            </span>
            <h2 className="mt-4 text-3xl font-semibold leading-snug text-balance text-brand-900 sm:text-4xl">
              A digital card platform built to keep your profile{" "}
              <span className="inline-flex h-7 w-7 -translate-y-0.5 items-center justify-center rounded-full bg-brand-100 align-middle text-brand-700">
                <RefreshIcon className="h-3.5 w-3.5" />
              </span>{" "}
              always current and{" "}
              <span className="inline-flex h-7 w-7 -translate-y-0.5 items-center justify-center rounded-full bg-accent-500/15 align-middle text-accent-500">
                <LinkChainIcon className="h-3.5 w-3.5" />
              </span>{" "}
              effortlessly shareable
            </h2>
            <p className="mt-5 text-slate-500">
              Every Konek+ card carries the same live link back to your
              profile. Whether it&apos;s your first card or your fifth,
              one dashboard controls exactly what people see the moment
              they tap.
            </p>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-xl">
            <Image
              src="https://res.cloudinary.com/dhxi75eld/image/upload/v1788159282/NFC_business_card_displayed_2K_202608311454_c1ho83.jpg"
              alt="A Konek+ NFC business card"
              fill
              unoptimized
              className="object-cover object-[35%_45%]"
            />
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-brand-900 p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
              <TapIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{claimedCount}</p>
              <p className="mt-1 text-sm text-white/50">
                Physical cards claimed and linked to a profile so far.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-slate-50 p-6">
            <p className="text-3xl font-bold text-brand-900">100%</p>
            <p className="text-sm text-slate-500">
              Of profile edits sync to every linked card instantly — no
              re-tapping required.
            </p>
          </div>

          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-accent-500 p-6">
            <p className="text-3xl font-bold text-brand-900">{recentViewCount}</p>
            <p className="text-sm text-brand-900/70">
              Profile taps served in the last 30 days.
            </p>
          </div>

          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-brand-900 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">
              Always in sync
            </p>
            <p className="text-2xl font-bold text-white">
              One tap.
              <br />
              <span className="text-lg font-medium text-white/60">
                Every card you own.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ============ PRODUCT GALLERY ============ */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              • The card kit
            </span>
            <h2 className="mt-4 text-3xl font-semibold text-balance text-brand-900 sm:text-4xl">
              Every detail, made to be tapped.
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {productGallery.map((item) => (
              <div
                key={item.title}
                className="overflow-hidden rounded-3xl bg-white shadow-[0_2px_20px_-6px_rgba(15,23,42,0.10)]"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                  {item.src ? (
                    <Image
                      src={item.src}
                      alt={item.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center border-2 border-dashed border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-300">
                      Image coming soon
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-brand-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SHOWCASE IMAGE ============ */}
      <section className="relative h-[50vh] max-h-[560px] min-h-[320px] w-full">
        <Image
          src="https://res.cloudinary.com/dhxi75eld/image/upload/v1788155884/Smartphone_tapping_NFC_business___202608311357_vcyllv.jpg"
          alt="A Konek+ card tapping a smartphone to share a profile over NFC"
          fill
          unoptimized
          className="object-cover"
        />
      </section>

      {/* ============ CTA ============ */}
      <section className="bg-brand-900 py-20 sm:py-24">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
          <h2 className="text-3xl font-semibold text-balance text-white sm:text-4xl">
            Ready to make your card{" "}
            <span className="text-accent-500">do more?</span>
          </h2>
          <p className="mt-4 max-w-md text-balance text-white/60">
            Sign in to set up your profile, then tap any Konek+ card to
            share it — no app, no re-typing, ever.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent-500 py-2.5 pl-5 pr-2.5 text-sm font-semibold text-brand-900 transition hover:bg-accent-500/90"
          >
            Sign in to your dashboard
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-accent-500">
              <ArrowUpRightIcon className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-2xl px-6">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              • FAQ
            </span>
            <h2 className="mt-4 text-3xl font-semibold text-balance text-brand-900 sm:text-4xl">
              Questions, answered.
            </h2>
          </div>

          <div className="mt-10 flex flex-col divide-y divide-slate-100 rounded-3xl bg-slate-50 px-6">
            {faqs.map((faq) => (
              <details key={faq.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-brand-900 marker:content-none">
                  {faq.q}
                  <ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center gap-6 rounded-[2.5rem] bg-brand-900 px-6 py-14 text-center sm:px-16">
            <h2 className="max-w-lg text-3xl font-semibold text-balance text-white sm:text-4xl">
              One card. Every version of you,{" "}
              <span className="text-accent-500">always current.</span>
            </h2>
            <p className="max-w-md text-balance text-white/60">
              Set up your profile once — every Konek+ card you own shares
              it, updated the instant you change it.
            </p>
            <Link
              href="/login"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-accent-500 py-2.5 pl-5 pr-2.5 text-sm font-semibold text-brand-900 transition hover:bg-accent-500/90"
            >
              Sign in to your dashboard
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-900 text-accent-500">
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>

    {/* ============ FOOTER ============ */}
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
            <p className="mt-3 text-sm text-slate-500">
              One profile behind every card you own — tap to share, edit
              once to keep it current.
            </p>
          </div>

          <nav className="flex gap-10 text-sm">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Product
              </span>
              <a href="#how-it-works" className="text-slate-600 transition hover:text-brand-700">
                How it works
              </a>
              <a href="#about" className="text-slate-600 transition hover:text-brand-700">
                About
              </a>
              <Link href="/login" className="text-slate-600 transition hover:text-brand-700">
                Sign in
              </Link>
            </div>
          </nav>
        </div>

        <div className="mt-12 border-t border-slate-100 pt-6 text-center text-xs text-slate-400 sm:text-left">
          © {year} Konek+. All rights reserved.
        </div>
      </div>
    </footer>
    </>
  );
}
