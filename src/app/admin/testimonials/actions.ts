"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export type AddTestimonialState = { error: string | null; resetToken: number };

function revalidate() {
  revalidatePath("/admin/testimonials");
  // The homepage is ISR'd (revalidate = 300) — refresh it now so a
  // publish shows up immediately rather than within 5 minutes.
  revalidatePath("/");
}

export async function addTestimonial(
  prevState: AddTestimonialState,
  formData: FormData,
): Promise<AddTestimonialState> {
  await requireAdmin();

  const authorName = String(formData.get("author_name") ?? "").trim();
  const authorRole = String(formData.get("author_role") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 5);
  const fail = (error: string) => ({ error, resetToken: prevState.resetToken });

  if (!authorName || authorName.length > 80) return fail("Add the customer's name (80 characters max).");
  if (authorRole.length > 120) return fail("Keep the role under 120 characters.");
  if (!quote || quote.length > 400) return fail("Add the quote (400 characters max).");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail("Rating must be 1–5.");

  const supabase = await createClient();
  const { error } = await supabase.from("landing_testimonials").insert({
    author_name: authorName,
    author_role: authorRole || null,
    quote,
    rating,
  });
  if (error) return fail(error.message);

  revalidate();
  return { error: null, resetToken: Date.now() };
}

export async function setTestimonialPublished(id: string, published: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("landing_testimonials").update({ published }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidate();
}

export async function deleteTestimonial(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("landing_testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidate();
}
