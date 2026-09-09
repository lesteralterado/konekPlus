import type { SupabaseClient } from "@supabase/supabase-js";
import { generateShortCode } from "@/lib/short-code";
import type { Database } from "@/lib/types";

const UNIQUE_VIOLATION = "23505";
const MAX_ATTEMPTS_PER_TAG = 5;

// Shared by scripts/generate-tags.ts (CLI) and the admin provisioning UI —
// generates `count` unique short codes, inserts them as unclaimed rows via
// the given service-role client, and records one tag_batches row so both
// callers get provisioning history for free. Returns the new codes.
export async function provisionTags(
  supabase: SupabaseClient<Database>,
  count: number,
  note?: string,
): Promise<string[]> {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    let inserted = false;
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_TAG && !inserted; attempt++) {
      const code = generateShortCode();
      const { error } = await supabase.from("tags").insert({ tag_id: code });

      if (!error) {
        codes.push(code);
        inserted = true;
      } else if (error.code !== UNIQUE_VIOLATION) {
        throw new Error(`Failed to insert tag: ${error.message}`);
      }
    }
    if (!inserted) {
      throw new Error(
        `Exhausted ${MAX_ATTEMPTS_PER_TAG} collision retries generating tag ${i + 1}/${count}.`,
      );
    }
  }

  const { error: batchError } = await supabase
    .from("tag_batches")
    .insert({ count: codes.length, note: note ?? null });
  if (batchError) {
    throw new Error(`Tags were created but failed to record batch history: ${batchError.message}`);
  }

  return codes;
}
