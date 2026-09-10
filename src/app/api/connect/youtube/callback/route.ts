import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type TokenResponse = { access_token?: string };
type ChannelListResponse = {
  items?: { id: string; snippet?: { customUrl?: string } }[];
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const fail = (reason: string) => {
    const url = new URL("/dashboard", request.url);
    url.searchParams.set("social_error", reason);
    const response = NextResponse.redirect(url);
    response.cookies.delete("yt_oauth_state");
    return response;
  };

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("yt_oauth_state")?.value;
  if (!code || !state || !storedState || state !== storedState) {
    return fail("youtube_state_mismatch");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail("youtube_not_configured");

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${siteUrl}/api/connect/youtube/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return fail("youtube_token_exchange_failed");
  const tokenData = (await tokenRes.json()) as TokenResponse;
  if (!tokenData.access_token) return fail("youtube_token_exchange_failed");

  const channelRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
  );
  if (!channelRes.ok) return fail("youtube_channel_lookup_failed");
  const channelData = (await channelRes.json()) as ChannelListResponse;
  const channel = channelData.items?.[0];
  if (!channel) return fail("youtube_no_channel");

  const handle = channel.snippet?.customUrl;
  const channelUrl = handle
    ? `https://www.youtube.com/${handle.startsWith("@") ? handle : `@${handle}`}`
    : `https://www.youtube.com/channel/${channel.id}`;

  const { data: existing } = await supabase
    .from("profiles")
    .select("socials")
    .eq("user_id", user.id)
    .single();

  await supabase
    .from("profiles")
    .update({
      socials: { ...(existing?.socials ?? {}), youtube: channelUrl },
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  const url = new URL("/dashboard", request.url);
  url.searchParams.set("social_connected", "youtube");
  const response = NextResponse.redirect(url);
  response.cookies.delete("yt_oauth_state");
  return response;
}
