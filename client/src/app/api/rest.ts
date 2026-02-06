import axios, { type AxiosRequestConfig } from "axios";

import { FORM_DATA_FILE_KEY } from "@app/Constants";
import type { AdvisoryDetails, ExtractResult, IngestResult } from "@app/client";
import { serializeRequestParamsForHub } from "@app/hooks/table-controls/getHubRequestParams";

import type {
  HubFilter,
  HubPaginatedResult,
  HubRequestParams,
  PyPIPackageMetadata,
  PulpDistribution,
  PulpPaginatedResponse,
} from "./models";

const API = "/api";

export const ORGANIZATIONS = `${API}/v2/organization`;
export const ADVISORIES = `${API}/v2/advisory`;
export const SBOMS = `${API}/v2/sbom`;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export const getHubPaginatedResult = <T>(
  url: string,
  params: HubRequestParams = {},
  extraQueryParams: { key: string; value: string }[] = [],
): Promise<HubPaginatedResult<T>> => {
  const requestParams = serializeRequestParamsForHub(params);
  for (const param of extraQueryParams) {
    requestParams.append(param.key, param.value);
  }

  return axios
    .get<PaginatedResponse<T>>(url, {
      params: requestParams,
    })
    .then(({ data }) => ({
      data: data.items,
      total: data.total,
      params,
    }));
};

const getContentTypeFromFile = (file: File) => {
  let contentType = "application/json";
  if (file.name.endsWith(".bz2")) {
    contentType = "application/json+bzip2";
  }
  return contentType;
};

export const uploadAdvisory = (
  formData: FormData,
  config?: AxiosRequestConfig,
) => {
  const file = formData.get(FORM_DATA_FILE_KEY) as File;
  return axios.post<AdvisoryDetails>(`${ADVISORIES}`, file, {
    ...config,
    headers: { "Content-Type": getContentTypeFromFile(file) },
  });
};

export const uploadSbom = (formData: FormData, config?: AxiosRequestConfig) => {
  const file = formData.get(FORM_DATA_FILE_KEY) as File;
  return axios.post<IngestResult>(`${SBOMS}`, file, {
    ...config,
    headers: { "Content-Type": getContentTypeFromFile(file) },
  });
};

export const uploadSbomForAnalysis = (
  formData: FormData,
  config?: AxiosRequestConfig,
) => {
  const file = formData.get(FORM_DATA_FILE_KEY) as File;
  return axios.post<ExtractResult>("/api/v2/ui/extract-sbom-purls", file, {
    ...config,
    headers: { "Content-Type": getContentTypeFromFile(file) },
  });
};

// Using our own definition of the endpoint rather than the `hey-api` auto generated
// We could replace this one once https://github.com/hey-api/openapi-ts/issues/1803 is fixed
export const downloadSbomLicense = (sbomId: string) => {
  return axios.get<Blob>(`${SBOMS}/${sbomId}/license-export`, {
    responseType: "arraybuffer",
    headers: { Accept: "text/plain", responseType: "blob" },
  });
};

// Pulp API Integration

const PULP_API = "/pulp/api/v3";

export const PULP_ENDPOINTS = {
  PYTHON_CONTENT: `${PULP_API}/content/python/packages/`,
  PYTHON_PROVENANCES: `${PULP_API}/content/python/provenance/`,
  PYTHON_DISTRIBUTIONS: `${PULP_API}/distributions/python/pypi/`,
  PYTHON_REPOSITORIES: `${PULP_API}/repositories/python/python/`,
} as const;

/**
 * Maps Hub filter operators to Pulp/Django field lookup operators.
 * Verified against pulpcore source code that all Django field lookups are supported.
 * See: pulpcore/app/viewsets/base.py (NAME_FILTER_OPTIONS, lines 34-52)
 */
const mapHubOperatorToPulpOperator = (operator: string): string => {
  const mapping: Record<string, string> = {
    "=": "",
    "!=": "__exclude",
    "~": "__icontains", // Case-insensitive contains (verified supported)
    "~~": "__contains", // Case-sensitive contains (verified supported for classifiers)
    ">": "__gt", // Greater than (verified supported)
    ">=": "__gte", // Greater than or equal (verified supported)
    "<": "__lt", // Less than (verified supported)
    "<=": "__lte", // Less than or equal (verified supported)
  };
  return mapping[operator] || "";
};

/**
 * Converts HubRequestParams to Pulp query parameters.
 * Key differences from Hub:
 * - Filters use Django field lookups (name__icontains)
 * - Sort uses 'ordering' param with '-' prefix for desc
 * - Pagination already uses limit/offset internally
 * - pulp_domain is added automatically by the server proxy
 */
export const serializeRequestParamsForPulp = (
  params: HubRequestParams,
  extraParams: Record<string, string | number> = {},
): Record<string, string | number> => {
  const pulpParams: Record<string, string | number> = { ...extraParams };

  // Pagination: Convert page-based to offset-based
  if (params.page) {
    const offset = (params.page.pageNumber - 1) * params.page.itemsPerPage;
    pulpParams.limit = params.page.itemsPerPage;
    pulpParams.offset = offset;
  }

  // Sorting: Convert to Pulp ordering format
  if (params.sort) {
    const direction = params.sort.direction === "desc" ? "-" : "";
    pulpParams.ordering = `${direction}${params.sort.field}`;
  }

  // Filters: Convert to Django field lookups
  if (params.filters) {
    params.filters.forEach((filter: HubFilter) => {
      const operator = mapHubOperatorToPulpOperator(filter.operator || "=");
      const fieldName = `${filter.field}${operator}`;

      if (typeof filter.value === "object" && "list" in filter.value) {
        // Multi-value filter: join with comma
        pulpParams[fieldName] = filter.value.list.join(",");
      } else {
        pulpParams[fieldName] = filter.value as string | number;
      }
    });
  }

  return pulpParams;
};

/**
 * Fetches paginated data from Pulp API and adapts to HubPaginatedResult format.
 * Converts HubRequestParams to Pulp's Django-style query parameters.
 *
 * IMPORTANT: This function fetches ALL pages recursively when a high limit is requested.
 * If params.page.itemsPerPage is large (e.g., 10000), it will follow the "next" URL
 * until all pages are fetched, ensuring complete results even when the server has
 * a maximum page size limit.
 */
export const getPulpPaginatedResult = <T>(
  url: string,
  params: HubRequestParams = {},
  extraParams: Record<string, string | number> = {},
): Promise<HubPaginatedResult<T>> => {
  const pulpParams = serializeRequestParamsForPulp(params, extraParams);

  // Helper function to recursively fetch all pages
  const fetchAllPages = async (
    currentUrl: string,
    currentParams: Record<string, string | number>,
    accumulatedResults: T[] = [],
  ): Promise<{ results: T[]; count: number }> => {
    const { data } = await axios.get<PulpPaginatedResponse<T>>(currentUrl, {
      params: currentParams,
    });

    const allResults = [...accumulatedResults, ...data.results];

    // If there's a next page and we haven't reached the requested limit, fetch it
    if (data.next && allResults.length < (pulpParams.limit as number)) {
      // For the next request, use the next URL without params (they're embedded in the URL)
      return fetchAllPages(data.next, {}, allResults);
    }

    return {
      results: allResults,
      count: data.count,
    };
  };

  return fetchAllPages(url, pulpParams).then(({ results, count }) => ({
    data: results,
    total: count,
    params,
  }));
};

/**
 * Fetches unique package names for a distribution.
 *
 * Strategy:
 * 1. Try Pulp's PyPI Simple API via the /pypi proxy — fast, database-level DISTINCT.
 * 2. If unavailable (no PyPI publication), fall back to the content API:
 *    fetch all content items in parallel with fields=name, then deduplicate.
 */
export const getSimplePackageNames = async (
  basePath: string,
  extraParams: Record<string, string | number> = {},
): Promise<string[]> => {
  try {
    const response = await axios.get(`/pypi/${basePath}/simple/`, {
      headers: { Accept: "application/vnd.pypi.simple.v1+json" },
      maxRedirects: 0,
    });

    // PEP 691 JSON response: { projects: [{ name: "pkg1" }, ...] }
    if (response.data?.projects) {
      return response.data.projects.map((p: { name: string }) => p.name);
    }

    // Fallback: parse HTML response (PEP 503)
    const html = typeof response.data === "string" ? response.data : "";
    const regex = /<a[^>]*>([^<]+)<\/a>/g;
    return Array.from(html.matchAll(regex), (m) => m[1].trim());
  } catch {
    // Simple API not available — fall back to content API
    return getUniqueNamesViaContentApi(extraParams);
  }
};

/**
 * Fallback: fetch content items in parallel and extract unique package names.
 * Used when the Simple API is not available (no PyPI publication for the distribution).
 */
async function getUniqueNamesViaContentApi(
  extraParams: Record<string, string | number>,
): Promise<string[]> {
  const limit = 100;

  // First request to get total count
  const first = await getPulpPaginatedResult<{ name: string }>(
    PULP_ENDPOINTS.PYTHON_CONTENT,
    { filters: [] },
    { ...extraParams, limit, offset: 0, fields: "name", ordering: "name" },
  );

  const allItems = [...first.data];

  if (allItems.length < first.total) {
    const totalPages = Math.ceil(first.total / limit);
    const offsets = Array.from(
      { length: totalPages - 1 },
      (_, i) => (i + 1) * limit,
    );

    const pages = await Promise.all(
      offsets.map((offset) =>
        getPulpPaginatedResult<{ name: string }>(
          PULP_ENDPOINTS.PYTHON_CONTENT,
          { filters: [] },
          {
            ...extraParams,
            limit,
            offset,
            fields: "name",
            ordering: "name",
          },
        ),
      ),
    );

    for (const page of pages) {
      allItems.push(...page.data);
    }
  }

  const names = new Set(allItems.map((item) => item.name));
  return Array.from(names).sort();
}

/**
 * Fetches distribution for a given content href.
 * Used to map content to its source index.
 */
export const getDistributionForContent = async (
  contentHref: string,
): Promise<PulpDistribution | null> => {
  try {
    const params: Record<string, string> = { with_content: contentHref };

    const response = await axios.get<PulpPaginatedResponse<PulpDistribution>>(
      PULP_ENDPOINTS.PYTHON_DISTRIBUTIONS,
      { params },
    );
    return response.data.results[0] || null;
  } catch (error) {
    console.error("Failed to fetch distribution:", error);
    return null;
  }
};

/**
 * Fetches all available distributions for filter options.
 * The server proxy automatically adds pulp_domain parameter.
 */
export const getAllDistributions = async (): Promise<PulpDistribution[]> => {
  try {
    const params: Record<string, string | number> = { limit: 100 };

    console.log("Fetching distributions with params:", params);
    console.log("Request URL:", PULP_ENDPOINTS.PYTHON_DISTRIBUTIONS);

    const response = await axios.get<PulpPaginatedResponse<PulpDistribution>>(
      PULP_ENDPOINTS.PYTHON_DISTRIBUTIONS,
      { params },
    );

    console.log("Distributions response:", response.data);
    return response.data.results || [];
  } catch (error) {
    console.error("Failed to fetch distributions:", error);
    if (axios.isAxiosError(error)) {
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);
    }
    return [];
  }
};

/**
 * Fetches a distribution by its base_path.
 * Used to map index selection to a specific distribution.
 * The server proxy automatically adds pulp_domain parameter.
 */
export const getDistributionByBasePath = async (
  basePath: string,
): Promise<PulpDistribution | null> => {
  try {
    const params: Record<string, string> = { base_path: basePath };

    const response = await axios.get<PulpPaginatedResponse<PulpDistribution>>(
      PULP_ENDPOINTS.PYTHON_DISTRIBUTIONS,
      { params },
    );
    return response.data.results[0] || null;
  } catch (error) {
    console.error("Failed to fetch distribution by base_path:", error);
    return null;
  }
};

/**
 * Fetches package metadata via the PyPI JSON Metadata API.
 * Returns full package info + all versions in a single request.
 *
 * Endpoint: GET /pypi/{basePath}/pypi/{packageName}/json/
 * Or with version: GET /pypi/{basePath}/pypi/{packageName}/{version}/json/
 */
export const getPackageMetadata = async (
  basePath: string,
  packageName: string,
  version?: string,
): Promise<PyPIPackageMetadata> => {
  const versionSegment = version ? `/${version}` : "";
  const url = `/pypi/${basePath}/pypi/${packageName}${versionSegment}/json/`;

  const response = await axios.get<PyPIPackageMetadata>(url);
  return response.data;
};
