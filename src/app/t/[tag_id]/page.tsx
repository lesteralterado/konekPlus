import { createClient } from "@/lib/supabase/server";
import { ClaimForm } from "./claim-form";
import { PublicProfile } from "./public-profile";

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

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag_id: string }>;
}) {
  const { tag_id } = await params;
  const supabase = await createClient();

  const { data: claimed } = await supabase.rpc("tag_status", {
    p_tag_id: tag_id,
  });

  if (claimed === null || claimed === undefined) {
    return <InvalidCard />;
  }

  if (!claimed) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <ClaimForm tagId={tag_id} />
      </main>
    );
  }

  const { data: profileId } = await supabase.rpc("get_tag_profile", {
    p_tag_id: tag_id,
  });
  if (!profileId) {
    // Lost a race with someone else's claim between the two reads above.
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

  return <PublicProfile profile={profile} tagId={tag_id} isOwner={isOwner} />;
}
