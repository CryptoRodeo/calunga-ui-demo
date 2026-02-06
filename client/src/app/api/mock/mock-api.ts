import type {
  HubPaginatedResult,
  HubRequestParams,
  PulpDistribution,
  PulpPaginatedResponse,
  PulpPythonPackageContent,
} from "../models";
import { PULP_ENDPOINTS, serializeRequestParamsForPulp } from "../rest";

// Cached fixture data (loaded lazily on first use)
let distributionsCache: PulpPaginatedResponse<PulpDistribution> | null = null;
const packagesCache: Record<
  string,
  PulpPaginatedResponse<PulpPythonPackageContent>
> = {};

/** Small simulated network delay (ms) */
const MOCK_DELAY_MS = 100;

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

async function loadDistributions(): Promise<
  PulpPaginatedResponse<PulpDistribution>
> {
  if (!distributionsCache) {
    const module = await import("./data/distributions.json");
    distributionsCache =
      module.default as PulpPaginatedResponse<PulpDistribution>;
  }
  return distributionsCache;
}

async function loadPackages(
  distributionName: string,
): Promise<PulpPaginatedResponse<PulpPythonPackageContent> | null> {
  if (packagesCache[distributionName]) {
    return packagesCache[distributionName];
  }

  try {
    // Dynamic import keyed by distribution name
    // Only "calunga-dev" has recorded fixtures currently
    const module = await import(`./data/packages-${distributionName}.json`);
    const data =
      module.default as PulpPaginatedResponse<PulpPythonPackageContent>;
    packagesCache[distributionName] = data;
    return data;
  } catch {
    // No fixture file for this distribution
    return null;
  }
}

/**
 * Resolve which distribution's package fixture to use based on
 * the repository_version extra parameter.
 */
async function resolveDistributionNameForRepoVersion(
  repoVersion: string,
): Promise<string | null> {
  const distData = await loadDistributions();
  const match = distData.results.find(
    (d) => d.repository_version === repoVersion,
  );
  return match ? match.name : null;
}

/**
 * Apply a single filter predicate to a field value.
 * Supports the same operators as mapHubOperatorToPulpOperator in rest.ts.
 */
function matchesFilter(
  fieldValue: string | number | undefined | null,
  filterKey: string,
  filterValue: string | number,
): boolean {
  const strFieldValue = String(fieldValue ?? "");
  const strFilterValue = String(filterValue);

  if (filterKey.endsWith("__icontains")) {
    return strFieldValue.toLowerCase().includes(strFilterValue.toLowerCase());
  }
  if (filterKey.endsWith("__contains")) {
    return strFieldValue.includes(strFilterValue);
  }
  if (filterKey.endsWith("__exclude")) {
    return strFieldValue !== strFilterValue;
  }
  if (filterKey.endsWith("__gt")) {
    return strFieldValue > strFilterValue;
  }
  if (filterKey.endsWith("__gte")) {
    return strFieldValue >= strFilterValue;
  }
  if (filterKey.endsWith("__lt")) {
    return strFieldValue < strFilterValue;
  }
  if (filterKey.endsWith("__lte")) {
    return strFieldValue <= strFilterValue;
  }
  if (filterKey.endsWith("__in")) {
    const values = strFilterValue.split(",");
    return values.includes(strFieldValue);
  }
  // Plain field name = exact match
  return strFieldValue === strFilterValue;
}

/**
 * Extract the base field name from a filter key (strip Django lookup suffix).
 */
function baseFieldName(filterKey: string): string {
  const suffixes = [
    "__icontains",
    "__contains",
    "__exclude",
    "__gte",
    "__gt",
    "__lte",
    "__lt",
    "__in",
  ];
  for (const suffix of suffixes) {
    if (filterKey.endsWith(suffix)) {
      return filterKey.slice(0, -suffix.length);
    }
  }
  return filterKey;
}

/**
 * Get the value of a field from a package content object by field name.
 */
function getFieldValue(
  pkg: PulpPythonPackageContent,
  field: string,
): string | number | undefined {
  return (pkg as unknown as Record<string, unknown>)[field] as
    | string
    | number
    | undefined;
}

/**
 * Mock implementation of getAllDistributions.
 * Matches real signature: () => Promise<PulpDistribution[]>
 */
export const getAllDistributions = async (): Promise<PulpDistribution[]> => {
  await delay(MOCK_DELAY_MS);
  const data = await loadDistributions();
  return data.results || [];
};

/**
 * Mock implementation of getPulpPaginatedResult.
 * Matches real signature exactly.
 *
 * Reads from the appropriate fixture based on the url and extraParams,
 * applies filtering, sorting, and pagination client-side.
 */
export const getPulpPaginatedResult = async <T>(
  url: string,
  params: HubRequestParams = {},
  extraParams: Record<string, string | number> = {},
): Promise<HubPaginatedResult<T>> => {
  await delay(MOCK_DELAY_MS);

  // Route to correct fixture based on URL
  if (url === PULP_ENDPOINTS.PYTHON_DISTRIBUTIONS) {
    return handleDistributionsPaginated<T>(params, extraParams);
  }

  if (url === PULP_ENDPOINTS.PYTHON_CONTENT) {
    return handlePackagesPaginated<T>(params, extraParams);
  }

  // Fallback: empty result
  return { data: [], total: 0, params };
};

async function handleDistributionsPaginated<T>(
  params: HubRequestParams,
  extraParams: Record<string, string | number>,
): Promise<HubPaginatedResult<T>> {
  const distData = await loadDistributions();
  let results = [...distData.results];

  // Apply filters from extraParams and serialized params
  const pulpParams = serializeRequestParamsForPulp(params, extraParams);
  results = applyFiltersToDistributions(results, pulpParams);

  // Pagination
  const limit =
    typeof pulpParams.limit === "number" ? pulpParams.limit : results.length;
  const offset = typeof pulpParams.offset === "number" ? pulpParams.offset : 0;
  const paged = results.slice(offset, offset + limit);

  return {
    data: paged as unknown as T[],
    total: results.length,
    params,
  };
}

function applyFiltersToDistributions(
  distributions: PulpDistribution[],
  pulpParams: Record<string, string | number>,
): PulpDistribution[] {
  // Check for base_path exact filter (used by getDistributionByBasePath)
  if (pulpParams.base_path) {
    distributions = distributions.filter(
      (d) => d.base_path === String(pulpParams.base_path),
    );
  }
  // Check for with_content filter (used by getDistributionForContent)
  if (pulpParams.with_content) {
    const contentHref = String(pulpParams.with_content);
    distributions = distributions.filter(
      (d) =>
        d.repository_version &&
        contentHref.startsWith(
          d.repository_version.replace(/\/versions\/\d+\/$/, "/"),
        ),
    );
  }
  return distributions;
}

async function handlePackagesPaginated<T>(
  params: HubRequestParams,
  extraParams: Record<string, string | number>,
): Promise<HubPaginatedResult<T>> {
  // Determine which distribution's packages to load
  let distName: string | null = null;

  if (extraParams.repository_version) {
    distName = await resolveDistributionNameForRepoVersion(
      String(extraParams.repository_version),
    );
  }

  // Default to "calunga-dev" if no distribution resolved (only fixture available)
  if (!distName) {
    distName = "calunga-dev";
  }

  const pkgData = await loadPackages(distName);
  if (!pkgData) {
    return { data: [], total: 0, params };
  }

  let results = [...pkgData.results];

  // Serialize params to get the flat filter keys
  const pulpParams = serializeRequestParamsForPulp(params, extraParams);

  // Apply filters (skip pagination/ordering/repository_version keys)
  const skipKeys = new Set([
    "limit",
    "offset",
    "ordering",
    "repository_version",
  ]);

  for (const [key, value] of Object.entries(pulpParams)) {
    if (skipKeys.has(key)) continue;

    const field = baseFieldName(key);
    results = results.filter((pkg) =>
      matchesFilter(
        getFieldValue(pkg as PulpPythonPackageContent, field),
        key,
        value,
      ),
    );
  }

  // Sorting
  if (pulpParams.ordering) {
    const orderStr = String(pulpParams.ordering);
    const descending = orderStr.startsWith("-");
    const sortField = descending ? orderStr.slice(1) : orderStr;

    results.sort((a, b) => {
      const aVal = getFieldValue(a as PulpPythonPackageContent, sortField);
      const bVal = getFieldValue(b as PulpPythonPackageContent, sortField);
      const aStr = String(aVal ?? "");
      const bStr = String(bVal ?? "");
      const cmp = aStr.localeCompare(bStr);
      return descending ? -cmp : cmp;
    });
  }

  const total = results.length;

  // Pagination
  const limit =
    typeof pulpParams.limit === "number" ? pulpParams.limit : results.length;
  const offset = typeof pulpParams.offset === "number" ? pulpParams.offset : 0;
  const paged = results.slice(offset, offset + limit);

  return {
    data: paged as unknown as T[],
    total,
    params,
  };
}

/**
 * Mock implementation of getSimplePackageNames.
 * Extracts unique package names from the fixture data.
 */
export const getSimplePackageNames = async (
  basePath: string,
  _extraParams: Record<string, string | number> = {},
): Promise<string[]> => {
  await delay(MOCK_DELAY_MS);
  const distData = await loadDistributions();
  const dist = distData.results.find((d) => d.base_path === basePath);
  const distName = dist?.name || "calunga-dev";
  const pkgData = await loadPackages(distName);
  if (!pkgData) return [];

  const names = new Set<string>(pkgData.results.map((r) => r.name));
  return Array.from(names).sort();
};

/**
 * Mock implementation of getDistributionForContent.
 * Matches real signature: (contentHref: string) => Promise<PulpDistribution | null>
 */
export const getDistributionForContent = async (
  contentHref: string,
): Promise<PulpDistribution | null> => {
  await delay(MOCK_DELAY_MS);
  const distData = await loadDistributions();

  // Find distribution whose repository matches the content href prefix
  const match = distData.results.find(
    (d) =>
      d.repository_version &&
      contentHref.startsWith(
        d.repository_version.replace(/\/versions\/\d+\/$/, "/"),
      ),
  );

  return match || null;
};

/**
 * Mock implementation of getDistributionByBasePath.
 * Matches real signature: (basePath: string) => Promise<PulpDistribution | null>
 */
export const getDistributionByBasePath = async (
  basePath: string,
): Promise<PulpDistribution | null> => {
  await delay(MOCK_DELAY_MS);
  const distData = await loadDistributions();
  const match = distData.results.find((d) => d.base_path === basePath);
  return match || null;
};
