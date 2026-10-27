"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BASIC_PORTFOLIO_LIMIT, isPro } from "@/lib/plan";
import { createClient } from "@/lib/supabase/server";

// resetToken only changes on success — the form uses it as a React `key` to
// clear its uncontrolled inputs, without wiping what the owner typed if a
// submission comes back with a validation error instead.
export type PortfolioFormState = { error: string | null; resetToken: number };

export async function addPortfolioItem(
  prevState: PortfolioFormState,
  formData: FormData,
): Promise<PortfolioFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, pro_until")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) redirect("/dashboard");

  if (!isPro(profile)) {
    const { count } = await supabase
      .from("portfolio_items")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile.id);
    if ((count ?? 0) >= BASIC_PORTFOLIO_LIMIT) {
      return {
        error: `Basic shows ${BASIC_PORTFOLIO_LIMIT} projects. Remove one, or get Pro for unlimited.`,
        resetToken: prevState.resetToken,
      };
    }
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const projectUrl = String(formData.get("project_url") ?? "").trim();
  const tech = String(formData.get("tech") ?? "").trim();

  if (!title) return { error: "Give the project a title.", resetToken: prevState.resetToken };

  let imageUrl: string | null = null;
  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("portfolio")
      .upload(path, imageFile, { contentType: imageFile.type });
    if (uploadError) return { error: uploadError.message, resetToken: prevState.resetToken };

    const {
      data: { publicUrl },
    } = supabase.storage.from("portfolio").getPublicUrl(path);
    imageUrl = publicUrl;
  }

  const { error } = await supabase.from("portfolio_items").insert({
    profile_id: profile.id,
    title,
    description: description || null,
    project_url: projectUrl || null,
    tech: tech || null,
    image_url: imageUrl,
  });
  if (error) return { error: error.message, resetToken: prevState.resetToken };

  revalidatePath("/dashboard/portfolio");
  revalidatePath("/t/[tag_id]", "page");
  return { error: null, resetToken: Date.now() };
}

export async function deletePortfolioItem(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("portfolio_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/portfolio");
  revalidatePath("/t/[tag_id]", "page");
}
