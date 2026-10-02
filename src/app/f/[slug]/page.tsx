import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FEEDBACK_SLUGS } from "@/lib/constants";
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

  return <FeedbackPageForm slug={slug} />;
}
