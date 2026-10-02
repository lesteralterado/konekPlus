import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/locale";
import { TermsContentEn } from "./terms-content.en";
import { TermsContentFil } from "./terms-content.fil";

export const metadata: Metadata = {
  title: "Terms of Service — Konek+",
  description: "The terms that govern your use of Konek+.",
};

export default async function TermsPage() {
  const locale = await getLocale();
  return locale === "fil" ? <TermsContentFil /> : <TermsContentEn />;
}
