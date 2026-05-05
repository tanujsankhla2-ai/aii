import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript")];

export default [
  ...eslintConfig,
  {
    files: ["components/scene3d/**/*.{ts,tsx}"],
    rules: {
      // R3F uses JSX props mapped to Three.js (`position`, `intensity`, …).
      "react/no-unknown-property": "off",
    },
  },
];
