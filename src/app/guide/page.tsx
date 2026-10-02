import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SiteChrome } from "../site-chrome";
import { GuideSection } from "./guide-section";

export const metadata: Metadata = {
  title: "Quick Guide — Konek+",
  description: "How to tap or scan your Konek+ card, straight from the guide in your box.",
};

export default async function GuidePage() {
  const dict = await getDictionary();

  return (
    <SiteChrome>
      <div className="py-14 sm:py-20">
        <GuideSection t={dict.guide} variant="page" />
      </div>
    </SiteChrome>
  );
}
