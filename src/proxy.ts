import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DEVICE_COOKIE_NAME,
  DEVICE_COOKIE_OPTIONS,
  randomDeviceId,
} from "@/lib/device-verification";

// Refreshes the Supabase session cookie on every request (access tokens are
// short-lived; without this, a Server Component's read-only cookie access
// would silently see a stale/expired session) and gates /dashboard and
// /admin behind login. The finer-grained "is this user actually the admin"
// check happens in src/app/admin/layout.tsx (requireAdmin()) — this is just
// the "must be logged in at all" gate, same as /dashboard. Renamed from
// `middleware.ts` in Next.js 16 — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
//
// Also enforces new-device verification (see
// supabase/migrations/0009_device_verification.sql): a logged-in user whose
// current browser isn't in trusted_devices gets sent to /verify-device
// before reaching /dashboard or /admin — even though Supabase's own session
// cookie is already fully valid by that point. signInWithPassword()
// completes a real session immediately; there's no "half-authenticated"
// state in Supabase to hook into, so this app-level check is what actually
// closes the gap for someone navigating straight to /dashboard after a
// password-only login. The PIN itself gets issued in login/actions.ts and
// t/[tag_id]/actions.ts.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const requiresLogin =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/admin");

  if (!user && requiresLogin) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    // Ensure every authenticated request has a device id cookie, on any
    // path — cheap (a cookie read, no DB call), so it's set as early as
    // possible rather than only once someone hits a protected route.
    //
    // NOT using the setAll-style "recreate response from request" dance
    // here on purpose: that dance exists because the Supabase adapter above
    // needs request.cookies to reflect its own writes *within this same
    // request* (its own getAll() gets re-read as part of the session
    // refresh). Nothing downstream re-reads request.cookies for our device
    // cookie in this same request, so a plain response.cookies.set() is
    // sufficient — the same approach already used for the one-off
    // yt_oauth_state cookie in src/app/api/connect/youtube/route.ts.
    let deviceId = request.cookies.get(DEVICE_COOKIE_NAME)?.value;
    const isNewDevice = !deviceId;
    if (!deviceId) {
      deviceId = randomDeviceId();
      response.cookies.set(DEVICE_COOKIE_NAME, deviceId, DEVICE_COOKIE_OPTIONS);
    }

    if (requiresLogin) {
      // A device id minted this same request can't possibly already be
      // trusted — skip the round trip. Fail closed on any RPC error: an
      // undefined/null `data` is treated as untrusted, never as trusted.
      const { data: trusted } = isNewDevice
        ? { data: false }
        : await supabase.rpc("is_device_trusted", { p_device_id: deviceId });

      if (!trusted) {
        const verifyUrl = new URL("/verify-device", request.url);
        verifyUrl.searchParams.set("next", request.nextUrl.pathname);
        const redirectResponse = NextResponse.redirect(verifyUrl);
        if (isNewDevice) {
          redirectResponse.cookies.set(
            DEVICE_COOKIE_NAME,
            deviceId,
            DEVICE_COOKIE_OPTIONS,
          );
        }
        return redirectResponse;
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
