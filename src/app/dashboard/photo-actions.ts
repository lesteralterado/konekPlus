"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { storeMyPhoto } from "@/lib/customer-photo";
import { PHOTO_FREEBIE } from "@/lib/photo-freebie";
import { rateLimit, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

// A card owner sending their own photo with their card (lifecycle and consent
// model in 0026/0029). It lands in the admin review queue; nothing is public
// or promised until an admin approves it.

export type MyPhotoResult = { error: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/admin/photos");
  revalidatePath("/admin");
}

export async function submitMyPhoto(formData: FormData): Promise<MyPhotoResult> {
  // The offer is switched off until the freebie is decided (photo-freebie.ts).
  if (!PHOTO_FREEBIE.offerToCustomers) return { error: "Sharing a photo isn't open right now." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (formData.get("consent_record") !== "1" || formData.get("consent_age") !== "1") {
    return { error: "Please tick the two required boxes first." };
  }
  const file = formData.get("photo");
  if (!(file instanceof File)) return { error: "Choose a photo first." };
  if (!(await rateLimit("customerPhoto"))) return { error: RATE_LIMITED_MESSAGE };

  const stored = await storeMyPhoto(supabase, user.id, file, {
    social: formData.get("consent_social") === "1",
    website: formData.get("consent_website") === "1",
  });
  if ("error" in stored) return { error: stored.error };

  refresh();
  return { error: null };
}

// The owner takes their own photo back. The database marks it withdrawn and
// takes any website testimonial down first; then both files are deleted, and
// only then are the paths cleared, so a failure part-way is finished by an
// admin ("Delete leftover file") instead of leaving a file that looks gone.
export async function withdrawMyPhoto(photoId: string): Promise<MyPhotoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!UUID.test(photoId)) return { error: "That photo wasn't recognised." };

  const { data: rows, error } = await supabase.rpc("withdraw_customer_photo", {
    p_id: photoId,
    p_clear: false,
  });
  if (error) return { error: "We couldn't remove your photo. Please try again." };
  const row = rows?.[0];
  if (!row) return { error: "We couldn't find that photo." };

  const unfinished = {
    error: "Your photo is hidden, but we couldn't finish deleting the file. We'll finish it for you.",
  };
  if (row.website_photo_path) {
    const { error: publicError } = await supabase.storage
      .from("testimonial-photos")
      .remove([row.website_photo_path]);
    if (publicError) {
      refresh();
      return unfinished;
    }
  }
  if (row.photo_path) {
    const { error: removeError } = await supabase.storage
      .from("customer-photos")
      .remove([row.photo_path]);
    if (removeError) {
      refresh();
      return unfinished;
    }
  }

  await supabase.rpc("withdraw_customer_photo", { p_id: photoId, p_clear: true });

  refresh();
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  return { error: null };
}
