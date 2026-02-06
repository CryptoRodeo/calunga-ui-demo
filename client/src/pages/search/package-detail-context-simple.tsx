import type React from "react";
import { createContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Package } from "./search-context";
import type {
  HubRequestParams,
  PulpPythonPackageContent,
} from "@app/api/models";
import { getPulpPaginatedResult, PULP_ENDPOINTS } from "@app/api/pulp";
import { transformPulpContentToPackage } from "@app/utils/pulp-transformers";

export type TabKey = "overview" | "versions" | "files" | "security";

interface IPackageDetailContext {
  packageData: Package | null;
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

  // Fetch package data from Pulp API
  const { data: packageData, isLoading, isError } = useQuery({
    queryKey: ["package", decodedPackageName, decodedVersion],
    queryFn: async () => {
      console.log("Fetching package:", decodedPackageName, decodedVersion);
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

      console.log("Package fetch result:", result);

      if (result.data.length === 0) {
        console.warn("No package found for:", decodedPackageName, decodedVersion);
        return null;
      }

      // Transform to UI Package model
      const transformed = transformPulpContentToPackage(result.data[0], undefined, undefined, null);
      console.log("Transformed package:", transformed);
      return transformed;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Get initial tab from URL params
  const location = useLocation();
  const getInitialTab = (): TabKey => {
    const params = new URLSearchParams(location.search);
    const activeTab = params.get("activeTab") as TabKey;
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
        packageData: packageData || null,
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
