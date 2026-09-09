"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error: string | null; success: boolean };

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = String(formData.get("full_name") ?? "").trim();
  const jobTitle = String(formData.get("job_title") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const linkedin = String(formData.get("social_linkedin") ?? "").trim();
  const instagram = String(formData.get("social_instagram") ?? "").trim();
  const website = String(formData.get("social_website") ?? "").trim();

  if (!fullName) return { error: "Full name is required.", success: false };

  const socials: Record<string, string> = {};
  if (linkedin) socials.linkedin = linkedin;
  if (instagram) socials.instagram = instagram;
  if (website) socials.website = website;

  let avatarUrl: string | undefined;
  const avatarFile = formData.get("avatar");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, {
        upsert: true,
        contentType: avatarFile.type,
      });
    if (uploadError) return { error: uploadError.message, success: false };

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    avatarUrl = `${publicUrl}?v=${Date.now()}`;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      job_title: jobTitle || null,
      company: company || null,
      phone: phone || null,
      email: email || null,
      socials,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
  if (error) return { error: error.message, success: false };

  revalidatePath("/dashboard");
  revalidatePath("/t/[tag_id]", "page");
  return { error: null, success: true };
}

export type AddTagState = { error: string | null };

export async function addTagByCode(
  _prevState: AddTagState,
  formData: FormData,
): Promise<AddTagState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const code = String(formData.get("tag_id") ?? "").trim();
  if (!code) {
    return { error: "Enter the code printed on your card." };
  }

  const { data: claimed, error } = await supabase.rpc("claim_tag", {
    p_tag_id: code,
  });
  if (error) return { error: error.message };
  if (!claimed) {
    return {
      error: "That code doesn't match an unclaimed card. Double-check it and try again.",
    };
  }

  revalidatePath("/dashboard");
  return { error: null };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
