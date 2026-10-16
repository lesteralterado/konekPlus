import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/device-verification";
import { createClient } from "@/lib/supabase/server";

// Landing point for every link Supabase emails (password reset, signup
// confirmation). The email templates in supabase/email-templates/ point
// here with ?token_hash=…&type=…&next=…. Verifying the token signs the
// user in, then `next` (open-redirect-guarded) decides where they go.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;
  const next = safeNextPath(params.get("next"));

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(new URL("/login?error=link_expired", request.url));
}
