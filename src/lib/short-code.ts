import { randomInt } from "node:crypto";

// Visually-ambiguous characters (0/O, 1/I/l) are excluded so a code can be
// hand-typed as a fallback when the NFC tap or QR scan fails.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
export const SHORT_CODE_LENGTH = 7;

export function generateShortCode(length = SHORT_CODE_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}
