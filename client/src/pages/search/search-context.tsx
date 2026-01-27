import type React from "react";
import { createContext, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import dummyData from "./dummy-data.json";

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
  pythonVersion: string[];
  architecture: string[];
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
}

const contextDefaultValue = {} as ISearchContext;

export const SearchContext = createContext<ISearchContext>(contextDefaultValue);

interface ISearchProvider {
  children: React.ReactNode;
}

export const SearchProvider: React.FunctionComponent<ISearchProvider> = ({
  children,
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
    const pythonParam = searchParams.get("python");
    const archParam = searchParams.get("arch");

    return {
      index: indexParam ? indexParam.split(",") : [],
      pythonVersion: pythonParam ? pythonParam.split(",") : [],
      architecture: archParam ? archParam.split(",") : [],
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
        pythonVersion: "python",
        architecture: "arch",
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
        pythonVersion: "python",
        architecture: "arch",
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
      pythonVersion: [],
      architecture: [],
    });
    setPageState(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("index");
    newParams.delete("python");
    newParams.delete("arch");
    newParams.set("page", "1");
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Load mock data
  const packages: Package[] = dummyData;

  // Filter packages based on search query and filters
  const filteredPackages = useMemo(() => {
    let filtered = packages;

    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(query) ||
          pkg.description.toLowerCase().includes(query) ||
          pkg.author.toLowerCase().includes(query),
      );
    }

    // Apply index filter
    if (filters.index.length > 0) {
      filtered = filtered.filter((pkg) =>
        pkg.index ? filters.index.includes(pkg.index) : false,
      );
    }

    // Apply python version filter
    if (filters.pythonVersion.length > 0) {
      filtered = filtered.filter((pkg) => {
        if (!pkg.pythonVersion) return false;
        // Check if package supports any of the selected Python versions
        return filters.pythonVersion.some((version) => {
          // Parse version requirement (e.g., ">=3.8" supports 3.8, 3.9, etc.)
          const versionMatch = pkg.pythonVersion?.match(/>=?(\d+\.\d+)/);
          if (versionMatch) {
            const minVersion = parseFloat(versionMatch[1]);
            const filterVersion = parseFloat(version);
            return filterVersion >= minVersion;
          }
          return pkg.pythonVersion?.includes(version);
        });
      });
    }

    // Apply architecture filter
    if (filters.architecture.length > 0) {
      filtered = filtered.filter((pkg) =>
        pkg.architecture
          ? filters.architecture.includes(pkg.architecture)
          : false,
      );
    }

    return filtered;
  }, [searchQuery, filters, packages]);

  // Sort packages based on sortBy
  const sortedPackages = useMemo(() => {
    const sorted = [...filteredPackages];
    switch (sortBy) {
      case "date":
        // Sort by most recently updated
        // For demo purposes, using a simple heuristic based on the "updated" text
        sorted.sort((a, b) => {
          const getUpdateValue = (updated: string) => {
            if (updated.includes("day")) {
              const days = parseInt(updated, 10);
              return days || 1;
            }
            if (updated.includes("week")) {
              const weeks = parseInt(updated, 10);
              return (weeks || 1) * 7;
            }
            if (updated.includes("month")) {
              const months = parseInt(updated, 10);
              return (months || 1) * 30;
            }
            return 999;
          };
          return getUpdateValue(a.updated) - getUpdateValue(b.updated);
        });
        break;
      case "downloads":
        sorted.sort((a, b) => b.downloads - a.downloads);
        break;
      default:
        // If there's a search query, sort by name match first, then by downloads
        if (searchQuery) {
          sorted.sort((a, b) => {
            const aNameMatch = a.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
            const bNameMatch = b.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
            if (aNameMatch && !bNameMatch) return -1;
            if (!aNameMatch && bNameMatch) return 1;
            return b.downloads - a.downloads;
          });
        } else {
          // No search query, sort by downloads
          sorted.sort((a, b) => b.downloads - a.downloads);
        }
        break;
    }
    return sorted;
  }, [filteredPackages, sortBy, searchQuery]);

  // Paginate packages
  const currentPageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedPackages.slice(start, start + perPage);
  }, [sortedPackages, page, perPage]);

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
        totalItemCount: packages.length,
        filteredItemCount: sortedPackages.length,
        filters,
        setFilter,
        clearAllFilters,
        deleteFilter,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
