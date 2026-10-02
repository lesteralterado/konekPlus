"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function setTestimonialApproved(testimonialId: string, approved: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profile_testimonials")
    .update({ approved })
    .eq("id", testimonialId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/testimonials");
}

export async function deleteTestimonial(testimonialId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profile_testimonials")
    .delete()
    .eq("id", testimonialId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/testimonials");
}
