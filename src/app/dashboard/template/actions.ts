"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  await supabase
    .from("profiles")
    .update({ template: template as ProfileTemplate })
    .eq("user_id", user.id);

  revalidatePath("/dashboard/template");
  revalidatePath("/dashboard");
  revalidatePath("/t/[tag_id]", "page");
}
