import { solvro } from "@solvro/config/eslint";

export default solvro(
  {
    ignores: [
      ".next",
      ".turbo",
      ".vscode-test",
      "apps/*/.next",
      "apps/*/out",
      "apps/web/src/components/ui",
      "node_modules",
      "out",
      "packages/*/dist",
    ],
  },
  {
    files: ["apps/web/src/app/**/*.{ts,tsx}"],
    rules: {
      "import/no-default-export": "off",
    },
  },
  {
    files: ["apps/web/*.config.{js,mjs,ts}"],
    rules: {
      "import/no-default-export": "off",
    },
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "import/named": "off",
      "unicorn/filename-case": "off",
      "unicorn/no-array-sort": "off",
      "unicorn/prevent-abbreviations": "off",
    },
  },
);
