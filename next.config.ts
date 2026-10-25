import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

// Security headers for every response (see docs/SECURITY.md).
// The Content-Security-Policy starts in Report-Only mode: browsers log what
// it *would* block without blocking anything, so it can be tightened and
// switched to enforcing once the console is clean in production.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co https://i.ytimg.com https://yt3.ggpht.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  // Nobody can frame the site (clickjacking, e.g. a fake "activate card" overlay).
  { key: "X-Frame-Options", value: "DENY" },
  // Uploaded files can't be reinterpreted as scripts/HTML by the browser.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites see only our domain, never full card/profile URLs.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Default Server Action body limit is 1MB — too small for a phone camera
  // photo uploaded as the profile avatar (updateProfile in
  // src/app/dashboard/actions.ts), which was crashing with a generic
  // server error once the file exceeded that.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Browser-side router cache: a page visited in the last 30s re-opens
    // instantly instead of asking the server again. Server Actions that call
    // revalidatePath() still clear it, so your own edits show at once; other
    // people's changes can appear up to 30s late.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      {
        protocol: "https" as const,
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
