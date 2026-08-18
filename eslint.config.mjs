import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier";

export default defineConfig([
  ...nextVitals,
  prettier,
  {
    rules: {
      // The existing Pages Router code intentionally fetches and restores local
      // state from effects. Keep the pre-upgrade lint behavior until those flows
      // are migrated independently.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "e2e/**",
    "data/**",
    "book/**",
    "venv/**",
  ]),
]);
