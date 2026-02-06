import type React from "react";
import {
  createContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
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
  serverTotal: number;
  // NEW: Filter state
  filters: FilterValues;
  setFilter: (category: keyof FilterValues, values: string[]) => void;
  clearAllFilters: () => void;
  deleteFilter: (category: keyof FilterValues, value: string) => void;
  // Loading state
  isLoading: boolean;
  isPending: boolean;
  isFetchingMore: boolean;
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

  // Progressive loading: fetch one page at a time from Pulp API.
  // The dataset grows as the user paginates forward.
  // Client-side filtering/sorting works on the accumulated dataset.
  const PULP_PAGE_SIZE = 100; // Pulp default page size

  // Track accumulated raw packages and how many Pulp pages have been fetched
  const [accumulatedPackages, setAccumulatedPackages] = useState<
    PulpPythonPackageContent[]
  >([]);
  const [pulpServerTotal, setPulpServerTotal] = useState(0);
  const [pulpPagesFetched, setPulpPagesFetched] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Reset accumulated data when distribution changes
  const prevSelectedIndex = useRef(selectedIndex);
  useEffect(() => {
    if (prevSelectedIndex.current !== selectedIndex) {
      setAccumulatedPackages([]);
      setPulpServerTotal(0);
      setPulpPagesFetched(0);
      prevSelectedIndex.current = selectedIndex;
    }
  }, [selectedIndex]);

  // Filter by repository_version to get packages ONLY from the selected distribution
  const extraParams = useMemo(() => {
    const params: Record<string, string | number> = {};
    if (selectedDistribution?.repository_version) {
      params.repository_version = selectedDistribution.repository_version;
    }
    return params;
  }, [selectedDistribution?.repository_version]);

  // Fetch the first page immediately to show initial results fast
  const {
    isLoading,
    error,
  } = useQuery({
    queryKey: ["packages", selectedIndex, "initial"],
    queryFn: async () => {
      const hubParams: HubRequestParams = {
        filters: [],
        page: { pageNumber: 1, itemsPerPage: PULP_PAGE_SIZE },
      };

      const result = await getPulpPaginatedResult<PulpPythonPackageContent>(
        PULP_ENDPOINTS.PYTHON_CONTENT,
        hubParams,
        extraParams,
      );

      setAccumulatedPackages(result.data);
      setPulpServerTotal(result.total);
      setPulpPagesFetched(1);

      return { packages: result.data, serverTotal: result.total };
    },
    enabled: !!selectedIndex,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch the next Pulp page on demand (called when user paginates beyond loaded data)
  const fetchNextPulpPage = useCallback(async () => {
    if (isFetchingMore) return;

    const nextOffset = pulpPagesFetched * PULP_PAGE_SIZE;
    if (nextOffset >= pulpServerTotal) return; // All pages already fetched

    setIsFetchingMore(true);
    try {
      const hubParams: HubRequestParams = {
        filters: [],
        page: {
          pageNumber: pulpPagesFetched + 1,
          itemsPerPage: PULP_PAGE_SIZE,
        },
      };

      const result = await getPulpPaginatedResult<PulpPythonPackageContent>(
        PULP_ENDPOINTS.PYTHON_CONTENT,
        hubParams,
        extraParams,
      );

      setAccumulatedPackages((prev) => [...prev, ...result.data]);
      setPulpServerTotal(result.total);
      setPulpPagesFetched((prev) => prev + 1);
    } finally {
      setIsFetchingMore(false);
    }
  }, [isFetchingMore, pulpPagesFetched, pulpServerTotal, extraParams]);

  // Memoize deduplication and transformation on accumulated data
  const transformedPackages = useMemo(() => {
    if (accumulatedPackages.length === 0) return [];

    // Deduplicate BEFORE transformation to reduce work
    const deduplicatedContent = deduplicateByLatestVersion(accumulatedPackages);

    // Transform to UI Package model
    return deduplicatedContent.map((content) =>
      transformPulpContentToPackage(content, undefined, undefined, null),
    );
  }, [accumulatedPackages]);

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
    // All sorting is done client-side since we deduplicate and filter locally
    packages = applySorting(packages, sortBy, deferredSearchQuery);

    return packages;
  }, [transformedPackages, deferredSearchQuery, deferredFilters, sortBy]);

  // SERVER total from Pulp API (total content items including all versions)
  const serverTotal = pulpServerTotal;

  // Whether more Pulp pages are available to fetch
  const hasMorePulpPages = pulpPagesFetched * PULP_PAGE_SIZE < pulpServerTotal;

  // CLIENT-SIDE pagination with progressive loading trigger
  const { currentPageItems, totalItemCount, filteredItemCount } = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const pageItems = filteredPackages.slice(startIndex, endIndex);

    return {
      currentPageItems: pageItems,
      totalItemCount: transformedPackages.length, // unique packages post-dedup, pre-filter
      filteredItemCount: filteredPackages.length, // packages post-filter
    };
  }, [filteredPackages, transformedPackages.length, page, perPage]);

  // Trigger fetching more data when user paginates near the end of loaded data
  useEffect(() => {
    if (!hasMorePulpPages || isFetchingMore || isLoading) return;

    // Check if the user is viewing items near the end of what we've loaded
    const endIndex = page * perPage;
    const loadedFilteredCount = filteredPackages.length;

    // Fetch more if we're within 2 pages of the end of loaded data
    if (endIndex + perPage * 2 >= loadedFilteredCount && hasMorePulpPages) {
      fetchNextPulpPage();
    }
  }, [page, perPage, filteredPackages.length, hasMorePulpPages, isFetchingMore, isLoading, fetchNextPulpPage]);

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
          serverTotal: 0,
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
          serverTotal: 0,
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
        currentPageItems,
        totalItemCount,
        filteredItemCount,
        serverTotal,
        filters,
        setFilter,
        clearAllFilters,
        deleteFilter,
        isLoading: false,
        isPending,
        isFetchingMore,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
