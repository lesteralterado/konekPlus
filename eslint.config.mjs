import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Pages are drawn on a UTC server, so a bare toLocaleDateString() prints the
    // wrong hour or even the wrong day for Manila. Use the helpers, which set
    // the zone explicitly.
    rules: {
      "no-restricted-properties": [
        "error",
        {
          property: "toLocaleDateString",
          message: "Use formatDate / formatDateTime / formatShortDate from @/lib/format-date (Manila time).",
        },
        {
          property: "toLocaleTimeString",
          message: "Use formatDateTime from @/lib/format-date (Manila time).",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
