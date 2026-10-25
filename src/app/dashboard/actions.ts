"use server";

import { revalidatePath } from "next/cache";
import { refreshCard } from "@/lib/card-cache";
import { redirect } from "next/navigation";
import {
  buildFacebookUrl,
  buildInstagramUrl,
  buildLinkedInUrl,
  buildPinterestUrl,
  buildThreadsUrl,
  buildTikTokUrl,
  buildWebsiteUrl,
  buildWhatsAppUrl,
  buildXUrl,
} from "@/lib/socials";
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
  const tagline = String(formData.get("tagline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const ctaLabel = String(formData.get("cta_label") ?? "").trim();
  const ctaUrl = String(formData.get("cta_url") ?? "").trim();

  if (!fullName) return { error: "Full name is required.", success: false };
  if (!!ctaLabel !== !!ctaUrl) {
    return {
      error: "The custom button needs both a label and a URL — or leave both blank.",
      success: false,
    };
  }

  const linkLabels = formData.getAll("link_label").map((v) => String(v).trim());
  const linkUrls = formData.getAll("link_url").map((v) => String(v).trim());
  const links = linkLabels
    .map((label, i) => ({ label, url: buildWebsiteUrl(linkUrls[i] ?? "") }))
    .filter((l) => l.label && l.url);

  const { data: existing } = await supabase
    .from("profiles")
    .select("socials")
    .eq("user_id", user.id)
    .single();

  const socials: Record<string, string> = { ...(existing?.socials ?? {}) };
  const setOrDelete = (key: string, value: string) => {
    if (value) socials[key] = value;
    else delete socials[key];
  };
  setOrDelete(
    "linkedin",
    buildLinkedInUrl(String(formData.get("social_linkedin") ?? "")),
  );
  setOrDelete(
    "instagram",
    buildInstagramUrl(String(formData.get("social_instagram") ?? "")),
  );
  setOrDelete(
    "facebook",
    buildFacebookUrl(String(formData.get("social_facebook") ?? "")),
  );
  setOrDelete(
    "tiktok",
    buildTikTokUrl(String(formData.get("social_tiktok") ?? "")),
  );
  setOrDelete(
    "whatsapp",
    buildWhatsAppUrl(String(formData.get("social_whatsapp") ?? "")),
  );
  setOrDelete("x", buildXUrl(String(formData.get("social_x") ?? "")));
  setOrDelete(
    "threads",
    buildThreadsUrl(String(formData.get("social_threads") ?? "")),
  );
  setOrDelete(
    "pinterest",
    buildPinterestUrl(String(formData.get("social_pinterest") ?? "")),
  );

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

  // "Remove photo" in the edit form. Storage cleanup is best-effort: the
  // avatar's extension comes from whatever file was uploaded, so try the
  // usual ones; a miss just leaves an unreferenced object behind.
  const removeAvatar = !avatarUrl && formData.get("remove_avatar") === "1";
  if (removeAvatar) {
    await supabase.storage
      .from("avatars")
      .remove(["jpg", "jpeg", "png", "webp"].map((ext) => `${user.id}/avatar.${ext}`));
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      job_title: jobTitle || null,
      company: company || null,
      tagline: tagline || null,
      bio: bio || null,
      phone: phone || null,
      email: email || null,
      // Privacy switches (0022). An unchecked checkbox isn't sent at all, so
      // only apply them when the form says it contains them (*_present);
      // otherwise a form without the switches would hide contact info.
      ...(formData.get("show_phone_present")
        ? { show_phone: formData.get("show_phone") === "on" }
        : {}),
      ...(formData.get("show_email_present")
        ? { show_email: formData.get("show_email") === "on" }
        : {}),
      cta_label: ctaLabel || null,
      cta_url: ctaUrl || null,
      links,
      socials,
      ...(avatarUrl ? { avatar_url: avatarUrl } : removeAvatar ? { avatar_url: null } : {}),
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

  const pin = String(formData.get("pin") ?? "").trim();

  const { data: claimed, error } = await supabase.rpc("claim_tag", {
    p_tag_id: code,
    p_pin: pin || null,
  });
  if (error) return { error: error.message };
  if (!claimed) {
    return {
      error:
        "That code and PIN don't match an unclaimed card. Double-check them and try again.",
    };
  }

  refreshCard(code);
  revalidatePath("/dashboard");
  return { error: null };
}

export async function toggleTagEnabled(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tagId = String(formData.get("tag_id") ?? "");
  if (!tagId) return;
  const enabled = formData.get("enabled") === "true";

  await supabase.rpc("set_tag_enabled", { p_tag_id: tagId, p_enabled: enabled });

  // Switching a card off must hide its cached public page right away.
  refreshCard(tagId);
  revalidatePath("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function disconnectSocial(provider: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("profiles")
    .select("socials")
    .eq("user_id", user.id)
    .single();

  const socials = { ...(existing?.socials ?? {}) };
  delete socials[provider];

  await supabase
    .from("profiles")
    .update({ socials, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/t/[tag_id]", "page");
}
