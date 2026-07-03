import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // The React-Compiler-era react-hooks rules (eslint-plugin-react-hooks v6,
    // bundled by eslint-config-next 16) error on valid NON-Compiler patterns:
    // hydration-safe localStorage init, reset-on-nav, the portal save bar's refs.
    // RolDe isn't using the React Compiler, so these two are off — re-enable them
    // if we adopt it. `react-hooks/static-components` stays ON (a real
    // anti-pattern; its instances are fixed — PatientsTable's SortHead is lifted out).
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
  {
    // The URDS PDF Kit renders with @react-pdf/renderer, whose <Image> is a
    // PDF primitive, not a DOM <img> — eslint-config-next maps the name for
    // next/image, so jsx-a11y/alt-text false-positives here. PDFs carry no
    // DOM accessibility tree; the rule stays ON everywhere else.
    files: ["src/components/ui/pdf/**"],
    rules: {
      "jsx-a11y/alt-text": "off",
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
