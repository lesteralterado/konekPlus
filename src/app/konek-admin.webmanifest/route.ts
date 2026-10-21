import { appIconUrl } from "@/lib/constants";

// "Add to Home Screen" manifest for the admin app. Lives outside /admin on
// purpose: browsers fetch manifests without cookies, and src/proxy.ts sends
// every /admin* request without a session to /login.
export function GET() {
  return Response.json(
    {
      name: "Konek+ Admin",
      short_name: "Konek+ Admin",
      start_url: "/admin",
      scope: "/admin",
      display: "standalone",
      background_color: "#f8fafc",
      theme_color: "#f8fafc",
      icons: [
        { src: appIconUrl(192), sizes: "192x192", type: "image/png", purpose: "any" },
        { src: appIconUrl(512), sizes: "512x512", type: "image/png", purpose: "any" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
