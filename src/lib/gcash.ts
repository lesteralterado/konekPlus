import "server-only";

export type GcashAccount = { name: string; number: string } | null;

// Where customers send GCash payments (card orders and Pro renewals). Unset
// → pages say we'll message the details instead (see .env.local.example).
export function gcashAccount(): GcashAccount {
  const name = process.env.GCASH_ACCOUNT_NAME?.trim();
  const number = process.env.GCASH_ACCOUNT_NUMBER?.trim();
  return name && number ? { name, number } : null;
}
