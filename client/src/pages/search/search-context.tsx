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

  // Load mock data
  const packages: Package[] = dummyData;

  // Filter packages based on search query
  const filteredPackages = useMemo(() => {
    if (!searchQuery) {
      return packages;
    }
    const query = searchQuery.toLowerCase();
    return packages.filter(
      (pkg) =>
        pkg.name.toLowerCase().includes(query) ||
        pkg.description.toLowerCase().includes(query) ||
        pkg.author.toLowerCase().includes(query),
    );
  }, [searchQuery, packages]);

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
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
