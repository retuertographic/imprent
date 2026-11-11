import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Copias de trabajo temporales de agentes
    ".claude/**",
    // App del Estudio DTF copiada tal cual del cliente (ver docs/research/seritene/README.md)
    "public/estudio-dtf/**",
  ]),
]);

export default eslintConfig;
