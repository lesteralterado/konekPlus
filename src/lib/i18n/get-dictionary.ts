import "server-only";
import { getLocale, type Locale } from "./locale";
import { en } from "./dictionaries/en";
import { fil } from "./dictionaries/fil";
import type { Dictionary } from "./dictionaries/types";

const dictionaries: Record<Locale, Dictionary> = { en, fil };

export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  return dictionaries[locale ?? (await getLocale())];
}
