/// <reference types="vitest/config" />

import fs from "fs";
import { createRequire } from "module";
import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import { viteStaticCopy } from "vite-plugin-static-copy";
import IstanbulPlugin from "vite-plugin-istanbul";

import {
  brandingStrings,
  CALUNGA_ENV,
  encodeEnv,
  SERVER_ENV_KEYS,
} from "@calunga-ui/common";

const require = createRequire(import.meta.url);
export const brandingAssetPath = () =>
  require
    .resolve("@calunga-ui/common/package.json")
    .replace(/(.)\/package.json$/, "$1") + "/dist/branding";

const brandingPath: string = brandingAssetPath();
const manifestPath = path.resolve(brandingPath, "manifest.json");

// https://vite.dev/config/
export default defineConfig({
  base: process.env.BASE_URL,
  plugins: [
    react(),
    {
      name: "ignore-process-env",
      transform(code) {
        return code.replace(/process\.env/g, "({})");
      },
    },
    viteStaticCopy({
      targets: [
        {
          src: manifestPath,
          dest: ".",
        },
        {
          src: brandingPath,
          dest: ".",
        },
      ],
    }),
    ...(process.env.NODE_ENV === "development"
      ? [
          ViteEjsPlugin({
            _env: encodeEnv(CALUNGA_ENV, SERVER_ENV_KEYS),
            branding: brandingStrings,
          }),
        ]
      : []),
    ...(process.env.NODE_ENV === "production"
      ? [
          {
            name: "copy-index",
            closeBundle: () => {
              const distDir = path.resolve(__dirname, "dist");
              const src = path.join(distDir, "index.html");
              const dest = path.join(distDir, "index.html.ejs");

              if (fs.existsSync(src)) {
                fs.renameSync(src, dest);
              }
            },
          },
        ]
      : []),
    ...(process.env.COVERAGE === "true"
      ? [
          IstanbulPlugin({
            include: "src/*",
            exclude: ["node_modules", "test/"],
            extension: [".js", ".jsx", ".ts", ".tsx"],
            requireEnv: false,
            checkProd: false,
            forceBuildInstrument: true,
          }),
        ]
      : []),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
    sourcemap: process.env.NODE_ENV === "development",
  },
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./src/app"),
    },
  },
  server: {
    proxy: {
      "/auth": {
        target: CALUNGA_ENV.OIDC_SERVER_URL || "http://localhost:8090",
        changeOrigin: true,
      },
      "/api": {
        target: CALUNGA_ENV.CALUNGA_API_URL || "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./test-setup.ts",
    browser: {
      instances: [{ browser: "chromium" }],
    },
    server: {
      deps: {
        inline: [
          "@patternfly/react-styles", // Ensures its CSS imports are ignored
          "@calunga-ui/common", // Required for vite.config.ts imports
        ],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/node_modules/**",
        "**/dist/**",
        "**/coverage/**",
        "**/*.d.ts",
        "**/test-setup.ts",
        "**/vite.config.ts",
        "**/config/**",
        "**/types/**",
      ],
    },
  },
});
