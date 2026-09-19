import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import ReactDOM from "react-dom";
import "./globals.css";
import { LOGO_URL } from "@/lib/constants";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  // The homepage navbar/footer render this logo (src/app/page.tsx) —
  // hint the browser to fetch it early so it's ready without a pop-in by
  // the time the preloader below finishes. ReactDOM.preload is the App
  // Router's documented way to emit resource hints (a raw <link> isn't
  // supported in the component tree).
  ReactDOM.preload(LOGO_URL, { as: "image", fetchPriority: "high" });

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Preloader />
        {children}
      </body>
    </html>
  );
}
