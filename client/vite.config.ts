/// <reference types="vitest/config" />

// IMPORTANT: Load environment variables BEFORE importing @calunga-ui/common
// because that package reads process.env during module initialization
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
console.log("[DOTENV] Loading .env from:", envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error("[DOTENV] Error loading .env:", result.error);
} else {
  console.log("[DOTENV] Loaded environment variables:", Object.keys(result.parsed || {}).length);
}

import fs from "fs";
import { createRequire } from "module";

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

// Log environment for debugging (use process.env directly since dotenv loads after module imports)
console.log("[VITE CONFIG] PULP_API_URL:", process.env.PULP_API_URL);
console.log("[VITE CONFIG] PULP_USERNAME:", process.env.PULP_USERNAME ? "***SET***" : "NOT SET");
console.log("[VITE CONFIG] PULP_VERIFY_SSL:", process.env.PULP_VERIFY_SSL);

/**
 * Creates a Vite dev server proxy config for Pulp-style services
 * with shared Basic Auth, logging, and optional content-type headers.
 */
function createPulpProxy(
  label: string,
  target: string,
  options: { setContentHeaders?: boolean } = {},
) {
  return {
    target,
    changeOrigin: true,
    secure: process.env.PULP_VERIFY_SSL !== "false",
    rewrite: (reqPath: string) => {
      const rewritten = reqPath.replace(
        new RegExp(`^/${label.toLowerCase()}`),
        "",
      );
      console.log(`[${label} PROXY] Rewriting: ${reqPath} -> ${rewritten}`);
      return rewritten;
    },
    configure: (proxy: import("http-proxy").Server) => {
      proxy.on("error", (err) => {
        console.error(`[${label} PROXY ERROR]`, err);
      });

      proxy.on("proxyReq", (proxyReq) => {
        console.log(
          `[${label} PROXY] Request to: ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
        );

        if (process.env.PULP_USERNAME && process.env.PULP_PASSWORD) {
          const credentials = Buffer.from(
            `${process.env.PULP_USERNAME}:${process.env.PULP_PASSWORD}`,
          ).toString("base64");
          proxyReq.setHeader("Authorization", `Basic ${credentials}`);
        }

        if (options.setContentHeaders) {
          proxyReq.setHeader("Accept", "application/json");
          proxyReq.setHeader("Content-Type", "application/json");
        }
      });

      proxy.on("proxyRes", (proxyRes) => {
        console.log(`[${label} PROXY] Response: ${proxyRes.statusCode}`);
      });
    },
  };
}

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
      // Only enable /auth proxy if OIDC server is configured
      ...(process.env.OIDC_SERVER_URL && {
        "/auth": {
          target: process.env.OIDC_SERVER_URL,
          changeOrigin: true,
        },
      }),
      // Only enable /api proxy if backend API URL is configured
      ...(process.env.CALUNGA_API_URL && {
        "/api": {
          target: process.env.CALUNGA_API_URL,
          changeOrigin: true,
        },
      }),
      "/pulp": createPulpProxy(
        "PULP",
        process.env.PULP_API_URL || "http://localhost:24817",
        { setContentHeaders: true },
      ),
      "/pypi": createPulpProxy(
        "PYPI",
        process.env.PYPI_API_URL ||
          (process.env.PULP_API_URL || "http://localhost:24817").replace(
            "/pulp/",
            "/pypi/",
          ),
      ),
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
