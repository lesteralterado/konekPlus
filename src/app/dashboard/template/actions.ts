"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canUseTemplate } from "@/lib/plan";
import type { ProfileTemplate } from "@/lib/types";

const VALID_TEMPLATES: ProfileTemplate[] = ["classic", "editorial", "minimal"];

export async function setTemplate(template: string) {
  if (!VALID_TEMPLATES.includes(template as ProfileTemplate)) {
    throw new Error("Unknown template.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // The picker only offers Pro styles to Pro owners; this is the backstop.
  const { data: profile } = await supabase
    .from("profiles")
    .select("pro_until")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile || !canUseTemplate(profile, template as ProfileTemplate)) {
    throw new Error("That style comes with Pro.");
  }

  await supabase
    .from("profiles")
    .update({ template: template as ProfileTemplate })
    .eq("user_id", user.id);

  revalidatePath("/dashboard/template");
  revalidatePath("/dashboard");
  revalidatePath("/t/[tag_id]", "page");
}
