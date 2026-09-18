import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ClaimForm } from "./claim-form";
import { ProfileTemplateView } from "./templates";

export const dynamic = "force-dynamic";

function InvalidCard() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-800">
        This card isn&apos;t recognized
      </h1>
      <p className="max-w-sm text-slate-500">
        The code on this card doesn&apos;t match any Konek+ card. If you just
        got this card, contact support — if this kept happening on a card
        that used to work, try tapping it again.
      </p>
    </main>
  );
}

function CardUnavailable() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-800">
        This card isn&apos;t available right now
      </h1>
      <p className="max-w-sm text-slate-500">
        Its owner has turned this card off. If you think that&apos;s a
        mistake, reach out to whoever gave it to you.
      </p>
    </main>
  );
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag_id: string }>;
}) {
  const { tag_id } = await params;
  const supabase = await createClient();

  const { data: status } = await supabase.rpc("tag_status", {
    p_tag_id: tag_id,
  });

  switch (status) {
    case null:
    case undefined:
      return <InvalidCard />;
    case "unclaimed":
      return (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
          <ClaimForm tagId={tag_id} />
        </main>
      );
    case "disabled":
      return <CardUnavailable />;
  }

  const { data: profileId } = await supabase.rpc("get_tag_profile", {
    p_tag_id: tag_id,
  });
  if (!profileId) {
    // Lost a race between the two reads above — someone else claimed it,
    // or the owner disabled it, in between.
    return <InvalidCard />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) {
    return <InvalidCard />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.user_id;

  // Only count real visitors tapping the card, not the owner previewing
  // their own — scheduled via after() so it never delays the response.
  if (!isOwner) {
    after(() => supabase.rpc("record_tag_view", { p_tag_id: tag_id }));
  }

  return (
    <ProfileTemplateView profile={profile} tagId={tag_id} isOwner={isOwner} />
  );
}
