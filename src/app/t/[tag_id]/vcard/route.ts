import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildVCard } from "@/lib/vcard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tag_id: string }> },
) {
  const { tag_id } = await params;
  const supabase = await createClient();

  const { data: profileId } = await supabase.rpc("get_tag_profile", {
    p_tag_id: tag_id,
  });
  if (!profileId) {
    return NextResponse.json(
      { error: "Card not found or not yet claimed." },
      { status: 404 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const vcard = buildVCard(profile);
  const filename = `${(profile.full_name || "contact").replace(/[^a-z0-9]+/gi, "-")}.vcf`;

  return new NextResponse(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
