// Minimal {placeholder} substitution for dictionary strings — avoids
// baking fixed English word order (prefix/suffix slots) into the
// Dictionary type, which breaks as soon as a translation needs to
// reorder a sentence.
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in vars ? String(vars[key]) : match,
  );
}
