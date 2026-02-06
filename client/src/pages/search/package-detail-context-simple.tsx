import type React from "react";
import { createContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Package } from "./search-context";
import type {
  HubRequestParams,
  PulpPythonPackageContent,
} from "@app/api/models";
import {
  getPulpPaginatedResult,
  getPackageMetadata,
  PULP_ENDPOINTS,
} from "@app/api/pulp";
import {
  transformPulpContentToPackage,
  transformPyPIMetadataToPackage,
} from "@app/utils/pulp-transformers";

export type TabKey = "overview" | "versions" | "files" | "security";

interface IPackageDetailContext {
  packageData: Package | null;
  allVersions: Package[];
  isLoading: boolean;
  isError: boolean;
  tabControls: {
    activeKey: TabKey;
    setActiveKey: (key: TabKey) => void;
  };
}

const contextDefaultValue = {} as IPackageDetailContext;

export const PackageDetailContext =
  createContext<IPackageDetailContext>(contextDefaultValue);

interface IPackageDetailProvider {
  packageName: string;
  version: string;
  children: React.ReactNode;
}

export const PackageDetailProvider: React.FunctionComponent<
  IPackageDetailProvider
> = ({ packageName, version, children }) => {
  // Decode URL parameters in case they're encoded
  const decodedPackageName = decodeURIComponent(packageName);
  const decodedVersion = decodeURIComponent(version);

  // Get distribution basePath from URL query params
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const basePath = searchParams.get("dist");

  // Strategy: Use PyPI JSON Metadata API when basePath is available (single request),
  // otherwise fall back to the content API (two requests for package + versions).
  const usePyPIApi = !!basePath;

  // --- PyPI JSON Metadata API query (single request for package + all versions) ---
  const {
    data: pypiData,
    isLoading: pypiLoading,
    isError: pypiError,
  } = useQuery({
    queryKey: ["package-pypi", basePath, decodedPackageName, decodedVersion],
    queryFn: async () => {
      const metadata = await getPackageMetadata(
        basePath!,
        decodedPackageName,
        decodedVersion,
      );
      return transformPyPIMetadataToPackage(metadata);
    },
    enabled: usePyPIApi,
    staleTime: 1000 * 60 * 5,
  });

  // --- Content API fallback query (when no basePath available) ---
  const {
    data: contentData,
    isLoading: contentLoading,
    isError: contentError,
  } = useQuery({
    queryKey: ["package", decodedPackageName, decodedVersion],
    queryFn: async () => {
      const hubParams: HubRequestParams = {
        filters: [
          { field: "name", operator: "=", value: decodedPackageName },
          { field: "version", operator: "=", value: decodedVersion },
        ],
        page: {
          pageNumber: 1,
          itemsPerPage: 1,
        },
      };

      const result = await getPulpPaginatedResult<PulpPythonPackageContent>(
        PULP_ENDPOINTS.PYTHON_CONTENT,
        hubParams,
        { exclude_fields: "requires_dist" },
      );

      if (result.data.length === 0) {
        return null;
      }

      return transformPulpContentToPackage(
        result.data[0],
        undefined,
        undefined,
        null,
      );
    },
    enabled: !usePyPIApi,
    staleTime: 1000 * 60 * 5,
  });

  // Derive state from whichever query is active
  const packageData = usePyPIApi ? pypiData || null : contentData || null;
  const isLoading = usePyPIApi ? pypiLoading : contentLoading;
  const isError = usePyPIApi ? pypiError : contentError;

  // All versions: available from PyPI API response, empty for content API fallback
  // (package-detail.tsx will fetch versions separately when allVersions is empty)
  const allVersions: Package[] =
    usePyPIApi && pypiData?.versions
      ? pypiData.versions.map((v) => ({
          id: `${pypiData.name}:${v.version}`,
          name: pypiData.name,
          version: v.version,
          description: "",
          downloads: v.downloads,
          updated: v.releaseDate,
          author: pypiData.author,
          license: pypiData.license,
        }))
      : [];

  // Get initial tab from URL params
  const getInitialTab = (): TabKey => {
    const activeTab = searchParams.get("activeTab") as TabKey;
    return activeTab &&
      ["overview", "versions", "files", "security"].includes(activeTab)
      ? activeTab
      : "overview";
  };

  const [activeKey, setActiveKey] = useState<TabKey>(getInitialTab);

  // Update URL when tab changes
  const setActiveKeyWithUrl = (key: TabKey) => {
    setActiveKey(key);
    const url = new URL(window.location.href);
    url.searchParams.set("activeTab", key);
    window.history.replaceState({}, "", url.toString());
  };

  // Listen for URL changes
  useEffect(() => {
    const handlePopState = () => {
      setActiveKey(getInitialTab());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <PackageDetailContext.Provider
      value={{
        packageData,
        allVersions,
        isLoading,
        isError,
        tabControls: {
          activeKey,
          setActiveKey: setActiveKeyWithUrl,
        },
      }}
    >
      {children}
    </PackageDetailContext.Provider>
  );
};
