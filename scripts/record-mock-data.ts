/**
 * Mock Data Recording Script
 *
 * Fetches live Pulp API responses and saves them as JSON fixtures
 * for use in demo/mock mode (MOCK=on).
 *
 * Usage: npx ts-node scripts/record-mock-data.ts
 *
 * Reads PULP_API_URL, PULP_USERNAME, PULP_PASSWORD from the root .env file.
 * Outputs JSON fixtures to client/src/app/api/mock/data/
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as https from "node:https";
import * as http from "node:http";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PULP_API_URL = process.env.PULP_API_URL;
const PULP_USERNAME = process.env.PULP_USERNAME;
const PULP_PASSWORD = process.env.PULP_PASSWORD;
const PULP_VERIFY_SSL = process.env.PULP_VERIFY_SSL;

if (!PULP_API_URL || !PULP_USERNAME || !PULP_PASSWORD) {
  console.error(
    "Missing required env vars: PULP_API_URL, PULP_USERNAME, PULP_PASSWORD",
  );
  console.error("Ensure these are set in the root .env file.");
  process.exit(1);
}

const OUTPUT_DIR = path.resolve(
  __dirname,
  "../client/src/app/api/mock/data",
);

// Max pages to fetch per distribution (100 items/page = up to 500 packages)
const MAX_PAGES_PER_DISTRIBUTION = 5;
const PAGE_SIZE = 100;

// Build base URL: PULP_API_URL already includes the domain path
// e.g., https://packages.redhat.com/api/pulp/calunga-ui-dev/
// The proxy strips /pulp and forwards to this URL, so API paths are relative:
// /api/v3/distributions/python/pypi/ → PULP_API_URL + api/v3/distributions/python/pypi/
function buildUrl(apiPath: string): string {
  // apiPath starts with /api/v3/...
  // PULP_API_URL ends with /
  const base = PULP_API_URL!.replace(/\/$/, "");
  // Strip leading slash from apiPath since base already has the path
  const cleanPath = apiPath.replace(/^\//, "");
  return `${base}/${cleanPath}`;
}

function buildAuth(): string {
  return Buffer.from(`${PULP_USERNAME}:${PULP_PASSWORD}`).toString("base64");
}

interface PulpPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Makes an HTTP(S) GET request with Basic Auth.
 */
function fetchJson<T>(url: string, params?: Record<string, string | number>): Promise<T> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        urlObj.searchParams.set(key, String(value));
      }
    }

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: "GET",
      headers: {
        Authorization: `Basic ${buildAuth()}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      rejectUnauthorized: PULP_VERIFY_SSL !== "false",
    };

    const client = urlObj.protocol === "https:" ? https : http;

    const req = client.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: string) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON from ${url}: ${e}`));
          }
        } else {
          reject(
            new Error(
              `HTTP ${res.statusCode} from ${urlObj.pathname}: ${data.substring(0, 200)}`,
            ),
          );
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

/**
 * Generates a synthetic pulp_href to strip internal URLs.
 * Preserves the path structure but uses a deterministic UUID-like hash.
 */
function sanitizeHref(href: string): string {
  if (!href) return href;
  // Extract the path portion after the domain-specific prefix
  // e.g., /api/pulp/calunga-ui-dev/api/v3/content/python/packages/uuid/
  // becomes /pulp/api/v3/content/python/packages/uuid/
  const match = href.match(/\/api\/v3\/.+/);
  if (match) {
    return `/pulp${match[0]}`;
  }
  return href;
}

/**
 * Sanitizes all pulp_href fields in an object recursively.
 */
function sanitizeHrefs<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeHrefs(item)) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (
      (key === "pulp_href" || key === "repository" || key === "repository_version" || key === "publication" || key === "package") &&
      typeof value === "string"
    ) {
      result[key] = sanitizeHref(value);
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeHrefs(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

/**
 * Fetches multiple pages of a Pulp paginated endpoint.
 * Returns a single PulpPaginatedResponse with all accumulated results,
 * next/previous set to null (mock mode handles pagination client-side).
 */
async function fetchPaginatedPages<T>(
  apiPath: string,
  extraParams: Record<string, string | number> = {},
  maxPages: number = MAX_PAGES_PER_DISTRIBUTION,
): Promise<PulpPaginatedResponse<T>> {
  const allResults: T[] = [];
  let totalCount = 0;
  let currentOffset = 0;

  for (let page = 0; page < maxPages; page++) {
    const params: Record<string, string | number> = {
      ...extraParams,
      limit: PAGE_SIZE,
      offset: currentOffset,
    };

    console.log(
      `  Fetching page ${page + 1}/${maxPages} (offset=${currentOffset})...`,
    );

    const url = buildUrl(apiPath);
    const response = await fetchJson<PulpPaginatedResponse<T>>(url, params);

    totalCount = response.count;
    allResults.push(...response.results);

    console.log(
      `  Got ${response.results.length} items (${allResults.length}/${totalCount} total)`,
    );

    // Stop if we've fetched all items or no more results
    if (!response.next || allResults.length >= totalCount) {
      break;
    }

    currentOffset += PAGE_SIZE;
  }

  return {
    count: totalCount,
    next: null,
    previous: null,
    results: allResults,
  };
}

function writeJsonFile(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  const stats = fs.statSync(filePath);
  const sizeKb = (stats.size / 1024).toFixed(1);
  console.log(`  Wrote ${filePath} (${sizeKb} KB)`);
}

/**
 * Sanitizes a distribution name to be safe as a filename.
 */
function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function main() {
  console.log("=== Mock Data Recording Script ===");
  console.log(`Pulp API: ${PULP_API_URL}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log();

  // 1. Fetch distributions
  console.log("Fetching distributions...");
  const distributionsResponse = await fetchPaginatedPages<Record<string, unknown>>(
    "api/v3/distributions/python/pypi/",
    {},
    1, // Distributions: just 1 page (up to 100 distributions)
  );

  // Sanitize hrefs
  const sanitizedDistributions = sanitizeHrefs(distributionsResponse);

  const distributionsFile = path.join(OUTPUT_DIR, "distributions.json");
  writeJsonFile(distributionsFile, sanitizedDistributions);
  console.log(
    `Recorded ${sanitizedDistributions.results.length} distributions`,
  );
  console.log();

  // 2. For each distribution, fetch packages
  for (const dist of distributionsResponse.results) {
    const distName = dist.name as string;
    const repoVersion = dist.repository_version as string | null;

    if (!repoVersion) {
      console.log(
        `Skipping distribution "${distName}" — no repository_version`,
      );
      continue;
    }

    console.log(`Fetching packages for distribution "${distName}"...`);
    console.log(`  repository_version: ${repoVersion}`);

    // The repository_version is a full URL; extract the path portion for the query param
    const repoVersionPath = sanitizeHref(repoVersion);

    const packagesResponse = await fetchPaginatedPages<Record<string, unknown>>(
      "api/v3/content/python/packages/",
      { repository_version: repoVersion },
      MAX_PAGES_PER_DISTRIBUTION,
    );

    // Sanitize hrefs in package data
    const sanitizedPackages = sanitizeHrefs(packagesResponse);

    const packagesFile = path.join(
      OUTPUT_DIR,
      `packages-${sanitizeName(distName)}.json`,
    );
    writeJsonFile(packagesFile, sanitizedPackages);
    console.log(
      `Recorded ${sanitizedPackages.results.length} of ${sanitizedPackages.count} packages for "${distName}"`,
    );
    console.log();
  }

  // 3. Summary
  console.log("=== Recording Complete ===");
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".json"));
  console.log(`Generated ${files.length} fixture files in ${OUTPUT_DIR}/`);
  for (const file of files) {
    const stats = fs.statSync(path.join(OUTPUT_DIR, file));
    console.log(`  ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  // 4. Verify fixture files contain expected fields
  console.log();
  console.log("Verifying fixture data...");
  const distData = JSON.parse(
    fs.readFileSync(path.join(OUTPUT_DIR, "distributions.json"), "utf-8"),
  );
  const distFields = ["pulp_href", "name", "base_path", "base_url", "repository_version"];
  const missingDistFields = distFields.filter(
    (f) => distData.results.length > 0 && !(f in distData.results[0]),
  );
  if (missingDistFields.length > 0) {
    console.warn(`  WARNING: Distribution data missing fields: ${missingDistFields.join(", ")}`);
  } else {
    console.log("  Distributions: OK");
  }

  const packageFiles = files.filter((f) => f.startsWith("packages-"));
  for (const pf of packageFiles) {
    const pkgData = JSON.parse(
      fs.readFileSync(path.join(OUTPUT_DIR, pf), "utf-8"),
    );
    if (pkgData.results.length === 0) {
      console.log(`  ${pf}: empty (0 packages)`);
      continue;
    }
    const expectedFields = [
      "name", "version", "summary", "description", "author", "license",
      "classifiers", "filename", "packagetype", "python_version",
      "requires_dist", "requires_python", "sha256", "size",
      "pulp_created", "pulp_last_updated",
    ];
    const missingPkgFields = expectedFields.filter(
      (f) => !(f in pkgData.results[0]),
    );
    if (missingPkgFields.length > 0) {
      console.warn(`  ${pf}: WARNING missing fields: ${missingPkgFields.join(", ")}`);
    } else {
      console.log(`  ${pf}: OK (${pkgData.results.length} packages)`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
