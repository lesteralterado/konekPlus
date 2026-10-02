import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FEEDBACK_SLUGS } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { FeedbackPageForm } from "./feedback-page-form";

export const metadata: Metadata = {
  title: "Feedback — Konek+",
  description: "Tell us what you think — bugs, ideas, anything.",
};

export default async function FeedbackSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!FEEDBACK_SLUGS.includes(slug as (typeof FEEDBACK_SLUGS)[number])) {
    notFound();
  }

  const dict = await getDictionary();
  return <FeedbackPageForm slug={slug} page={dict.feedbackPage} form={dict.feedbackWidget} />;
}
