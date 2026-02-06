import type React from "react";
import {
  createContext,
  useState,
  useCallback,
  useMemo,
  useDeferredValue,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type {
  HubRequestParams,
  PulpPythonPackageContent,
} from "@app/api/models";
import { getPulpPaginatedResult, PULP_ENDPOINTS } from "@app/api/rest";
import { transformPulpContentToPackage } from "@app/utils/pulp-transformers";
import { deduplicateByLatestVersion } from "@app/utils/version-compare";

export interface SBOMSummary {
  totalComponents: number;
  directDependencies: number;
  licensesFound: string[];
  criticalDependencies?: string[];
  hasVulnerabilities?: boolean;
}

export interface SBOM {
  format: string;
  url: string;
  generatedAt: string;
  // NEW FIELDS
  version?: string;
  componentCount?: number;
  serialNumber?: string;
  toolName?: string;
  toolVersion?: string;
  summary?: SBOMSummary;
}

export interface Attestation {
  type: string;
  verifier: string;
  timestamp: string;
  status: "verified" | "unverified" | "failed";
  // NEW FIELDS
  slsaLevel?: number;
  certificateUrl?: string;
  signatureUrl?: string;
  digestSha256?: string;
  issuer?: string;
  subject?: string;
  validUntil?: string;
  buildPlatform?: string;
  metadata?: Record<string, unknown>;
}

export interface PackageVersion {
  version: string;
  releaseDate: string;
  downloads: number;
  sbom?: SBOM;
  attestations?: Attestation[];
}

export interface Dependent {
  name: string;
  version: string;
  downloads: number;
}

export interface SecurityAdvisory {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  affectedVersions: string[];
  publishedAt: string;
}

export interface Package {
  id: string;
  name: string;
  version: string;
  description: string;
  downloads: number;
  updated: string;
  author: string;
  license: string;

  // Optional fields for detail page
  fullDescription?: string;
  tags?: string[];
  wheelName?: string;
  pythonVersion?: string;
  abi?: string;
  architecture?: string;
  index?: string; // NEW: Package index (github, artifactory, nexus)
  versions?: PackageVersion[];
  dependents?: Dependent[];
  securityAdvisories?: SecurityAdvisory[];

  // NEW FIELDS for attestations and trust
  currentVersionAttestations?: Attestation[];
  currentVersionSbom?: SBOM;
  trustScore?: number;
  slsaLevel?: number;
}

export type SortOption = "relevance" | "date" | "downloads";

// Filter types
export interface FilterValues {
  index: string[];
  classification: string[];
  license: string[];
}

interface ISearchContext {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  page: number;
  setPage: (page: number) => void;
  perPage: number;
  setPerPage: (perPage: number) => void;
  currentPageItems: Package[];
  totalItemCount: number;
  filteredItemCount: number;
  // NEW: Filter state
  filters: FilterValues;
  setFilter: (category: keyof FilterValues, values: string[]) => void;
  clearAllFilters: () => void;
  deleteFilter: (category: keyof FilterValues, value: string) => void;
  // Loading state
  isLoading: boolean;
  isPending: boolean;
}

const contextDefaultValue = {} as ISearchContext;

export const SearchContext = createContext<ISearchContext>(contextDefaultValue);

/**
 * Applies client-side sorting to packages after deduplication.
 * Server-side sorting happens before deduplication, so we need to re-sort.
 *
 * Sorting strategies:
 * - date: Sort by updated field (descending, newest first)
 * - downloads: Sort by downloads field (descending, most downloads first)
 * - relevance: Score by search query match in name + updated date (best match first)
 */
const applySorting = (
  packages: Package[],
  sortBy: SortOption,
  searchQuery: string,
): Package[] => {
  const sorted = [...packages];

  switch (sortBy) {
    case "date":
      // Sort by updated date (newest first)
      sorted.sort((a, b) => {
        const dateA = new Date(a.updated).getTime();
        const dateB = new Date(b.updated).getTime();
        return dateB - dateA; // Descending
      });
      break;

    case "downloads":
      // Sort by downloads (most first), fallback to date
      sorted.sort((a, b) => {
        if (a.downloads !== b.downloads) {
          return b.downloads - a.downloads; // Descending
        }
        // Fallback to date if downloads are equal
        const dateA = new Date(a.updated).getTime();
        const dateB = new Date(b.updated).getTime();
        return dateB - dateA;
      });
      break;

    case "relevance":
    default:
      // Score by search query match + recency
      // If no search query, sort by name alphabetically
      if (!searchQuery) {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        const lowerQuery = searchQuery.toLowerCase();

        // Calculate relevance score for each package
        const scored = sorted.map((pkg) => {
          let score = 0;
          const lowerName = pkg.name.toLowerCase();

          // Exact match: highest score
          if (lowerName === lowerQuery) {
            score += 1000;
          }
          // Starts with query: high score
          else if (lowerName.startsWith(lowerQuery)) {
            score += 500;
          }
          // Contains query: medium score
          else if (lowerName.includes(lowerQuery)) {
            score += 100;
          }

          // Boost score for shorter names (more precise match)
          score += Math.max(0, 50 - lowerName.length);

          // Small boost for newer packages (recency)
          const ageInDays = (Date.now() - new Date(pkg.updated).getTime()) / (1000 * 60 * 60 * 24);
          score += Math.max(0, 10 - ageInDays / 365); // Newer = slightly higher score

          return { pkg, score };
        });

        // Sort by score (highest first), then by name
        scored.sort((a, b) => {
          if (a.score !== b.score) {
            return b.score - a.score; // Descending score
          }
          return a.pkg.name.localeCompare(b.pkg.name); // Alphabetical for ties
        });

        return scored.map((item) => item.pkg);
      }
      break;
  }

  return sorted;
};

interface ISearchProvider {
  children: React.ReactNode;
  selectedIndex: string;
  availableDistributions: {
    name: string;
    base_path: string;
    base_url: string;
    repository_version: string | null;
  }[];
}

export const SearchProvider: React.FunctionComponent<ISearchProvider> = ({
  children,
  selectedIndex,
  availableDistributions,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const [searchQuery, setSearchQueryState] = useState(
    searchParams.get("q") || "",
  );
  const [sortBy, setSortByState] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "relevance",
  );
  const [page, setPageState] = useState(
    parseInt(searchParams.get("page") || "1", 10),
  );
  const [perPage, setPerPageState] = useState(
    parseInt(searchParams.get("perPage") || "10", 10),
  );

  // Initialize filter state from URL params
  const [filters, setFiltersState] = useState<FilterValues>(() => {
    const indexParam = searchParams.get("index");
    const classificationParam = searchParams.get("classification");
    const licenseParam = searchParams.get("license");

    return {
      index: indexParam ? indexParam.split(",") : [],
      classification: classificationParam ? classificationParam.split(",") : [],
      license: licenseParam ? licenseParam.split(",") : [],
    };
  });

  // Update URL params when state changes
  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);
      setPageState(1); // Reset to page 1 when search changes
      const newParams = new URLSearchParams(searchParams);
      if (query) {
        newParams.set("q", query);
      } else {
        newParams.delete("q");
      }
      newParams.set("page", "1");
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const setSortBy = useCallback(
    (sort: SortOption) => {
      setSortByState(sort);
      const newParams = new URLSearchParams(searchParams);
      newParams.set("sort", sort);
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const setPage = useCallback(
    (newPage: number) => {
      setPageState(newPage);
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", newPage.toString());
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const setPerPage = useCallback(
    (newPerPage: number) => {
      setPerPageState(newPerPage);
      setPageState(1); // Reset to page 1 when perPage changes
      const newParams = new URLSearchParams(searchParams);
      newParams.set("perPage", newPerPage.toString());
      newParams.set("page", "1");
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  // Filter management functions
  const setFilter = useCallback(
    (category: keyof FilterValues, values: string[]) => {
      setFiltersState((prev) => ({ ...prev, [category]: values }));
      setPageState(1); // Reset to page 1 when filters change
      const newParams = new URLSearchParams(searchParams);

      // Map category to URL param name
      const paramMap: Record<keyof FilterValues, string> = {
        index: "index",
        classification: "classification",
        license: "license",
      };

      const paramName = paramMap[category];
      if (values.length > 0) {
        newParams.set(paramName, values.join(","));
      } else {
        newParams.delete(paramName);
      }
      newParams.set("page", "1");
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const deleteFilter = useCallback(
    (category: keyof FilterValues, value: string) => {
      setFiltersState((prev) => ({
        ...prev,
        [category]: prev[category].filter((v) => v !== value),
      }));
      setPageState(1);
      const newParams = new URLSearchParams(searchParams);

      const paramMap: Record<keyof FilterValues, string> = {
        index: "index",
        classification: "classification",
        license: "license",
      };

      const paramName = paramMap[category];
      const updatedValues = filters[category].filter((v) => v !== value);

      if (updatedValues.length > 0) {
        newParams.set(paramName, updatedValues.join(","));
      } else {
        newParams.delete(paramName);
      }
      newParams.set("page", "1");
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams, filters],
  );

  const clearAllFilters = useCallback(() => {
    setFiltersState({
      index: [],
      classification: [],
      license: [],
    });
    setPageState(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("index");
    newParams.delete("classification");
    newParams.delete("arch");
    newParams.set("page", "1");
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Build Pulp filter parameters for server-side filtering
  // IMPORTANT: Per PULP_DATA_MAPPING_PLAN.md lines 10-19, server-side filtering
  // is LIMITED to specific fields. The fields name (substring), classifiers,
  // and license are NOT supported for server-side filtering and require
  // client-side filtering instead.
  const buildPulpFilters = useCallback(
    (
      searchQuery: string,
      filters: FilterValues,
    ): HubRequestParams["filters"] => {
      const hubFilters: HubRequestParams["filters"] = [];

      // Search query → NO server-side filter
      // Verified: pulp_python/app/viewsets.py line 340 shows name only supports exact/in
      // Client-side filtering required (see PULP_DATA_MAPPING_PLAN.md lines 127-130)

      // Classification filter → NO server-side filter
      // Verified: pulp_python/app/viewsets.py lines 339-348 do NOT include classifiers
      // Client-side filtering required (see PULP_DATA_MAPPING_PLAN.md lines 119-125)

      // License filter → NO server-side filter
      // Verified: license field NOT in PythonPackageContentFilter.Meta.fields
      // Client-side filtering required (see PULP_DATA_MAPPING_PLAN.md lines 124-127)

      // NO server-side filters available for UI requirements
      return hubFilters;
    },
    [],
  );

  // Map sort option to Pulp sort parameters
  const mapSortToPulp = useCallback(
    (sortOption: SortOption): HubRequestParams["sort"] => {
      switch (sortOption) {
        case "date":
          return { field: "pulp_created", direction: "desc" };
        case "downloads":
          // Not available in Pulp - fallback to date
          return { field: "pulp_created", direction: "desc" };
        default:
          // Relevance requires client-side scoring
          // For server-side, sort by name
          return { field: "name", direction: "asc" };
      }
    },
    [],
  );

  // Debounce search query to prevent excessive API calls
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredFilters = useDeferredValue(filters);

  // Determine if filtering is pending (deferred values don't match current)
  const isPending =
    deferredSearchQuery !== searchQuery ||
    JSON.stringify(deferredFilters) !== JSON.stringify(filters);

  // Fetch the selected distribution to get repository_version for filtering
  const selectedDistribution = availableDistributions.find(
    (dist) => dist.name === selectedIndex,
  );

  // Fetch ALL packages from Pulp API using pagination
  // Per PULP_DATA_MAPPING_PLAN.md lines 542-680: client-side filtering required
  // because name substring, classifiers, and license are NOT supported server-side
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["packages", selectedIndex, sortBy],
    queryFn: async () => {
      const allPackages: PulpPythonPackageContent[] = [];
      let currentOffset = 0;
      const limit = 100; // Pulp default page size
      let hasMore = true;

      // Filter by repository_version to get packages ONLY from the selected distribution
      const extraParams: Record<string, string | number> = {};
      if (selectedDistribution?.repository_version) {
        extraParams.repository_version = selectedDistribution.repository_version;
      }

      // Fetch all pages to ensure ALL packages are rendered
      while (hasMore) {
        const hubParams: HubRequestParams = {
          filters: [], // NO server-side filters (not supported for required fields)
          sort: mapSortToPulp(sortBy),
          page: {
            pageNumber: Math.floor(currentOffset / limit) + 1,
            itemsPerPage: limit,
          },
        };

        const result = await getPulpPaginatedResult<PulpPythonPackageContent>(
          PULP_ENDPOINTS.PYTHON_CONTENT,
          hubParams,
          extraParams,
        );

        allPackages.push(...result.data);
        currentOffset += result.data.length;

        // Check if there are more pages
        hasMore = result.data.length === limit && currentOffset < result.total;
      }

      return allPackages; // Return ALL raw Pulp content
    },
    enabled: !!selectedIndex, // Only run when we have a selected index
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes to reduce refetches
  });

  // Memoize deduplication and transformation
  const transformedPackages = useMemo(() => {
    if (!rawData) return [];

    // Deduplicate BEFORE transformation to reduce work
    const deduplicatedContent = deduplicateByLatestVersion(rawData);

    // Transform to UI Package model
    return deduplicatedContent.map((content) =>
      transformPulpContentToPackage(content, undefined, undefined, null),
    );
  }, [rawData]);

  // CLIENT-SIDE filtering (separate memo for better performance)
  // Per PULP_DATA_MAPPING_PLAN.md: name substring, classifiers, license
  // are NOT supported server-side and require client-side filtering
  const filteredPackages = useMemo(() => {
    let packages = transformedPackages;

    // Search filter (name or description)
    if (deferredSearchQuery) {
      const lowerQuery = deferredSearchQuery.toLowerCase();
      packages = packages.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(lowerQuery) ||
          pkg.description?.toLowerCase().includes(lowerQuery),
      );
    }

    // Classification filter
    if (deferredFilters.classification.length > 0) {
      packages = packages.filter((pkg) =>
        deferredFilters.classification.some((classifier) =>
          pkg.tags?.some((tag) =>
            tag.toLowerCase().includes(classifier.toLowerCase()),
          ),
        ),
      );
    }

    // License filter
    if (deferredFilters.license.length > 0) {
      packages = packages.filter((pkg) =>
        deferredFilters.license.some((license) =>
          pkg.license?.toLowerCase().includes(license.toLowerCase()),
        ),
      );
    }

    // Apply client-side sorting after filtering
    // Per PULP_DATA_MAPPING_PLAN.md lines 133-138:
    // - "date" uses server-side sorting (already applied via queryKey)
    // - "relevance" and "downloads" require client-side sorting
    packages = applySorting(packages, sortBy, deferredSearchQuery);

    return packages;
  }, [transformedPackages, deferredSearchQuery, deferredFilters, sortBy]);

  // CLIENT-SIDE pagination
  const { currentPageItems, totalItemCount, filteredItemCount } = useMemo(() => {
    const total = filteredPackages.length;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const pageItems = filteredPackages.slice(startIndex, endIndex);

    return {
      currentPageItems: pageItems,
      totalItemCount: total,
      filteredItemCount: total,
    };
  }, [filteredPackages, page, perPage]);

  // Handle loading and error states
  if (isLoading) {
    // Return context with empty data during loading
    return (
      <SearchContext.Provider
        value={{
          searchQuery,
          setSearchQuery,
          sortBy,
          setSortBy,
          page,
          setPage,
          perPage,
          setPerPage,
          currentPageItems: [],
          totalItemCount: 0,
          filteredItemCount: 0,
          filters,
          setFilter,
          clearAllFilters,
          deleteFilter,
          isLoading: true,
          isPending: false,
        }}
      >
        {children}
      </SearchContext.Provider>
    );
  }

  if (error) {
    console.error("Failed to fetch packages:", error);
    // Return context with empty data on error
    return (
      <SearchContext.Provider
        value={{
          searchQuery,
          setSearchQuery,
          sortBy,
          setSortBy,
          page,
          setPage,
          perPage,
          setPerPage,
          currentPageItems: [],
          totalItemCount: 0,
          filteredItemCount: 0,
          filters,
          setFilter,
          clearAllFilters,
          deleteFilter,
          isLoading: false,
          isPending: false,
        }}
      >
        {children}
      </SearchContext.Provider>
    );
  }

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        page,
        setPage,
        perPage,
        setPerPage,
        currentPageItems,
        totalItemCount,
        filteredItemCount,
        filters,
        setFilter,
        clearAllFilters,
        deleteFilter,
        isLoading: false,
        isPending,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
