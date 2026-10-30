import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import ReactDOM from "react-dom";
import { TopLoader } from "@/components/top-loader";
import "./globals.css";
import { LOGO_URL, PRELOADER_CARD_BACK_URL, PRELOADER_CARD_FRONT_URL } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { FeedbackWidget } from "./feedback-widget";
import { Preloader } from "./preloader";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Konek+",
  description: "Your digital business card — tap to share.",
  icons: {
    icon: LOGO_URL,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The homepage navbar/footer render this logo (src/app/page.tsx) —
  // hint the browser to fetch it early so it's ready without a pop-in by
  // the time the preloader below finishes. ReactDOM.preload is the App
  // Router's documented way to emit resource hints (a raw <link> isn't
  // supported in the component tree).
  ReactDOM.preload(LOGO_URL, { as: "image", fetchPriority: "high" });
  // The splash itself is made of these two — they must be there for first paint.
  ReactDOM.preload(PRELOADER_CARD_FRONT_URL, { as: "image", fetchPriority: "high" });
  ReactDOM.preload(PRELOADER_CARD_BACK_URL, { as: "image", fetchPriority: "high" });

  const dict = await getDictionary();

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Preloader />
        {/* useSearchParams inside → needs its own Suspense boundary. */}
        <Suspense fallback={null}>
          <TopLoader />
        </Suspense>
        {children}
        <FeedbackWidget dict={dict.feedbackWidget} />
      </body>
    </html>
  );
}
