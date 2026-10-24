import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildVCard } from "@/lib/vcard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tag_id: string }> },
) {
  const { tag_id } = await params;
  const supabase = await createClient();

  // Same per-card public view as the profile page (0022): only for cards
  // that are switched on, and email/phone already blanked if the owner hid them.
  const { data } = await supabase.rpc("get_public_profile", { p_tag_id: tag_id });
  const profile = data?.[0];
  if (!profile) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
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
