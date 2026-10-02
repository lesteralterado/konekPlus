import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/locale";
import { PrivacyContentEn } from "./privacy-content.en";
import { PrivacyContentFil } from "./privacy-content.fil";

export const metadata: Metadata = {
  title: "Privacy Policy — Konek+",
  description: "How Konek+ collects, uses, and protects your data.",
};

export default async function PrivacyPolicyPage() {
  const locale = await getLocale();
  return locale === "fil" ? <PrivacyContentFil /> : <PrivacyContentEn />;
}
