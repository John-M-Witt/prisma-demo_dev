import js from "@eslint/js";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // base recommended rules
  js.configs.recommended,

  // global rules and settings that apply broadly
  {
    files: ["**/*.{js,cjs,mjs,ts,cts,mts}"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        setImmediate: "readonly",
        clearImmediate: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly"
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    rules: {
      "no-console": "off",
      "eqeqeq": ["error", "always", { "null": "ignore" }],
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    }
  },

  // Node override for script files (if you want sourceType script for those)
  {
    files: [
      "**/src/scripts/**/*.js",
      "**/scripts/**/*.js",
      "**/src/scripts/run-comments.js"
    ],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "script"
      }
    },
  }
]);

// NOTE: To ignore folders use a top-level .eslintignore file (recommended)
// or run ESLint with --ignore-path if you need custom ignore locations.
