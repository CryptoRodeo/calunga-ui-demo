import type React from "react";
import {
  createContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useDeferredValue,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DistributionStats,
  PulpPythonPackageContent,
} from "@app/api/models";
import {
  getPulpPaginatedResult,
  getSimplePackageNames,
  getDistributionStats,
  PULP_ENDPOINTS,
} from "@app/api/pulp";
import { transformPulpContentToPackage } from "@app/utils/pulp-transformers";

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
  serverTotal: number;
  // NEW: Filter state
  filters: FilterValues;
  setFilter: (category: keyof FilterValues, values: string[]) => void;
  clearAllFilters: () => void;
  deleteFilter: (category: keyof FilterValues, value: string) => void;
  // Distribution stats (from PyPI Root API, available before names finish loading)
  distributionStats: DistributionStats | null;
  // Loading state
  isLoading: boolean;
  isPending: boolean;
  isFetchingMore: boolean;
}

const contextDefaultValue = {} as ISearchContext;

export const SearchContext = createContext<ISearchContext>(contextDefaultValue);

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
  const queryClient = useQueryClient();
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
    parseInt(searchParams.get("perPage") || "20", 10),
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

  // Filter by repository_version to get packages ONLY from the selected distribution
  const extraParams = useMemo(() => {
    const params: Record<string, string | number> = {};
    if (selectedDistribution?.repository_version) {
      params.repository_version = selectedDistribution.repository_version;
    }
    return params;
  }, [selectedDistribution?.repository_version]);

  // ── Distribution stats: fast pre-computed counts from PyPI Root API ──
  // Runs in parallel with Query 1. Provides instant inventory numbers
  // before the full names list finishes loading.
  const { data: distributionStats = null } = useQuery({
    queryKey: ["distributionStats", selectedDistribution?.base_path],
    queryFn: () =>
      getDistributionStats(selectedDistribution?.base_path ?? ""),
    enabled: !!selectedDistribution,
    staleTime: 1000 * 60 * 30,
  });

  // ── QUERY 1: Fetch unique package names from Pulp's Simple API ──
  // Uses database-level DISTINCT — returns just names, no content item duplication.
  // This is a single lightweight request regardless of how many content items exist.
  const {
    data: packageNames,
    isLoading: isLoadingNames,
    error: namesError,
  } = useQuery({
    queryKey: ["packageNames", selectedIndex, extraParams],
    queryFn: () =>
      getSimplePackageNames(selectedDistribution?.base_path ?? "", extraParams),
    enabled: !!selectedDistribution,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  // Client-side name search and sorting on the full name list.
  // Name search has full coverage since we have ALL names loaded.
  const filteredAndSortedNames = useMemo(() => {
    if (!packageNames) return [];
    let names = [...packageNames];

    // Search filter on name
    if (deferredSearchQuery) {
      const lower = deferredSearchQuery.toLowerCase();
      names = names.filter((n) => n.toLowerCase().includes(lower));
    }

    // Sort names
    if (sortBy === "relevance" && deferredSearchQuery) {
      const lowerQuery = deferredSearchQuery.toLowerCase();
      names.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const aScore =
          aLower === lowerQuery
            ? 1000
            : aLower.startsWith(lowerQuery)
              ? 500
              : 100;
        const bScore =
          bLower === lowerQuery
            ? 1000
            : bLower.startsWith(lowerQuery)
              ? 500
              : 100;
        if (aScore !== bScore) return bScore - aScore;
        return a.localeCompare(b);
      });
    } else {
      names.sort((a, b) => a.localeCompare(b));
    }

    return names;
  }, [packageNames, deferredSearchQuery, sortBy]);

  // Client-side pagination on the sorted/filtered name list
  const totalItemCount = packageNames?.length ?? 0;
  const filteredItemCount = filteredAndSortedNames.length;
  const serverTotal = totalItemCount;
  const startIndex = (page - 1) * perPage;
  const currentPageNames = useMemo(
    () => filteredAndSortedNames.slice(startIndex, startIndex + perPage),
    [filteredAndSortedNames, startIndex, perPage],
  );

  // ── QUERY 2: Fetch metadata for the current page's packages ──
  // Uses a single batch request with name__in=pkg1,pkg2,...,pkgN instead of
  // N parallel requests. Results are ordered by -pulp_created so the first
  // occurrence of each name is the latest version. Client-side deduplication
  // keeps only the latest content item per package name.
  const { data: currentPageItems = [], isLoading: isLoadingDetails } = useQuery(
    {
      queryKey: [
        "packageDetails",
        selectedDistribution?.base_path,
        currentPageNames,
      ],
      queryFn: async () => {
        const result =
          await getPulpPaginatedResult<PulpPythonPackageContent>(
            PULP_ENDPOINTS.PYTHON_CONTENT,
            { filters: [] },
            {
              ...extraParams,
              name__in: currentPageNames.join(","),
              ordering: "-pulp_created",
              limit: 2000,
              fields:
                "pulp_href,name,version,summary,author,maintainer,license,license_expression,pulp_created,filename,python_version,classifiers",
            },
          );

        // Deduplicate: keep only the first (latest) content item per name
        const seen = new Set<string>();
        const deduplicated: PulpPythonPackageContent[] = [];
        for (const item of result.data) {
          if (!seen.has(item.name)) {
            seen.add(item.name);
            deduplicated.push(item);
          }
        }

        return deduplicated.map((content) =>
          transformPulpContentToPackage(content, undefined, undefined, null),
        );
      },
      enabled: currentPageNames.length > 0 && !!selectedDistribution,
      staleTime: 1000 * 60 * 5,
    },
  );

  // Re-sort current page items when sortBy is "date" or "downloads".
  // For "relevance" and alphabetical (default), the name-based order from
  // Query 1 is preserved. Cross-page ordering remains alphabetical by name
  // since global date/downloads sorting would require fetching all metadata.
  const sortedPageItems = useMemo(() => {
    if (currentPageItems.length === 0) return currentPageItems;

    if (sortBy === "date") {
      return [...currentPageItems].sort(
        (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime(),
      );
    }

    if (sortBy === "downloads") {
      return [...currentPageItems].sort((a, b) => b.downloads - a.downloads);
    }

    // "relevance" or default: preserve Query 1 name-based order
    return currentPageItems;
  }, [currentPageItems, sortBy]);

  // ── Prefetch adjacent page metadata for instant pagination ──
  // When the current page's data has loaded, prefetch the next page's metadata
  // so clicking "Next Page" renders results instantly from cache.
  const nextPageNames = useMemo(
    () =>
      filteredAndSortedNames.slice(
        startIndex + perPage,
        startIndex + 2 * perPage,
      ),
    [filteredAndSortedNames, startIndex, perPage],
  );

  useEffect(() => {
    if (
      nextPageNames.length === 0 ||
      !selectedDistribution ||
      currentPageItems.length === 0
    ) {
      return;
    }

    queryClient.prefetchQuery({
      queryKey: [
        "packageDetails",
        selectedDistribution.base_path,
        nextPageNames,
      ],
      queryFn: async () => {
        const result =
          await getPulpPaginatedResult<PulpPythonPackageContent>(
            PULP_ENDPOINTS.PYTHON_CONTENT,
            { filters: [] },
            {
              ...extraParams,
              name__in: nextPageNames.join(","),
              ordering: "-pulp_created",
              limit: 2000,
              fields:
                "pulp_href,name,version,summary,author,maintainer,license,license_expression,pulp_created,filename,python_version,classifiers",
            },
          );

        const seen = new Set<string>();
        const deduplicated: PulpPythonPackageContent[] = [];
        for (const item of result.data) {
          if (!seen.has(item.name)) {
            seen.add(item.name);
            deduplicated.push(item);
          }
        }

        return deduplicated.map((content) =>
          transformPulpContentToPackage(content, undefined, undefined, null),
        );
      },
      staleTime: 1000 * 60 * 5,
    });
  }, [
    nextPageNames,
    selectedDistribution,
    currentPageItems,
    extraParams,
    queryClient,
  ]);

  // Loading = true until both queries have completed at least once.
  // This prevents a "No Packages Found" flash between Query 1 (names) and
  // Query 2 (details) completing on initial load.
  const isLoading =
    isLoadingNames ||
    (isLoadingDetails &&
      currentPageItems.length === 0 &&
      filteredItemCount > 0);
  const error = namesError;

  // Handle loading and error states
  if (isLoading) {
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
          serverTotal: 0,
          distributionStats,
          filters,
          setFilter,
          clearAllFilters,
          deleteFilter,
          isLoading: true,
          isPending: false,
          isFetchingMore: false,
        }}
      >
        {children}
      </SearchContext.Provider>
    );
  }

  if (error) {
    console.error("Failed to fetch packages:", error);
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
          serverTotal: 0,
          distributionStats,
          filters,
          setFilter,
          clearAllFilters,
          deleteFilter,
          isLoading: false,
          isPending: false,
          isFetchingMore: false,
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
        currentPageItems: sortedPageItems,
        totalItemCount,
        filteredItemCount,
        serverTotal,
        distributionStats,
        filters,
        setFilter,
        clearAllFilters,
        deleteFilter,
        isLoading,
        isPending: isPending || isLoadingDetails,
        isFetchingMore: isLoadingDetails,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
