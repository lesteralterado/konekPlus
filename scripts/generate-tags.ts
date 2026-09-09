// Stage 6: batch-provision unclaimed tag rows and print the NDEF-ready URLs
// to hand off to whatever tool writes the physical NTAG213/215/216 cards.
// The admin dashboard's provisioning UI (src/app/admin/tags/actions.ts)
// shares the same core logic via src/lib/provision-tags.ts.
//
// Usage: npm run generate-tags -- --count=50

import { writeFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { provisionTags } from "../src/lib/provision-tags";
import { createAdminClient } from "../src/lib/supabase/admin";

loadEnv({ path: ".env.local" });

function parseCount(): number {
  const arg = process.argv.find((a) => a.startsWith("--count="));
  const count = arg ? Number(arg.slice("--count=".length)) : 20;
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error("--count must be a positive integer");
  }
  return count;
}

async function main() {
  const count = parseCount();
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  if (!process.env.SITE_URL) {
    console.warn(`SITE_URL not set — defaulting to ${siteUrl}`);
  }

  const supabase = createAdminClient();
  const codes = await provisionTags(supabase, count, "generate-tags CLI");

  const rows = codes.map((code) => `${code},${siteUrl}/t/${code}`);
  const csv = ["tag_id,url", ...rows].join("\n");
  const filename = `tag-batch-${Date.now()}.csv`;
  writeFileSync(filename, csv, "utf8");

  console.log(`Provisioned ${codes.length} tags -> ${filename}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
