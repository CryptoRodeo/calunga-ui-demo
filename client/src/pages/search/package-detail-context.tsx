import type React from "react";
import { createContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTabControls } from "../../app/hooks/tab-controls";
import type { Package } from "./search-context";
import type {
  HubRequestParams,
  PulpPythonPackageContent,
  PulpPackageProvenance,
} from "@app/api/models";
import {
  getPulpPaginatedResult,
  PULP_ENDPOINTS,
  getDistributionForContent,
} from "@app/api/pulp";
import { transformPulpContentToPackage } from "@app/utils/pulp-transformers";

export type TabKey = "overview" | "versions" | "files" | "security";

interface IPackageDetailContext {
  packageData: Package | null;
  tabControls: ReturnType<typeof useTabControls<TabKey>>;
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
  // Fetch package data from Pulp API with aggregated versions and provenances
  const {
    data: packageData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["package", packageName, version],
    queryFn: async () => {
      // Step 1: Fetch all versions of the package
      const allVersionsResult =
        await getPulpPaginatedResult<PulpPythonPackageContent>(
          PULP_ENDPOINTS.PYTHON_CONTENT,
          {
            filters: [{ field: "name", operator: "=", value: packageName }],
            sort: { field: "pulp_created", direction: "desc" },
            page: { pageNumber: 1, itemsPerPage: 100 },
          } as HubRequestParams,
        );

      const allVersions = allVersionsResult.data;
      const targetVersion = allVersions.find((v) => v.version === version);

      if (!targetVersion) {
        throw new Error(
          `Version ${version} not found for package ${packageName}`,
        );
      }

      // Step 2: Fetch provenances for the target version
      const provenancesResult =
        await getPulpPaginatedResult<PulpPackageProvenance>(
          PULP_ENDPOINTS.PYTHON_PROVENANCES,
          {
            filters: [
              {
                field: "package",
                operator: "=",
                value: targetVersion.pulp_href,
              },
            ],
          } as HubRequestParams,
        );

      // Step 3: Fetch distribution
      const distribution = await getDistributionForContent(
        targetVersion.pulp_href,
      );

      // Step 4: Transform to Package model
      return transformPulpContentToPackage(
        targetVersion,
        allVersions,
        provenancesResult.data,
        distribution,
      );
    },
  });

  // Tab controls with URL persistence
  const tabControls = useTabControls({
    tabKeys: ["overview", "versions", "files", "security"],
    persistTo: "urlParams",
  });

  // Handle loading and error states
  if (isLoading) {
    return (
      <PackageDetailContext.Provider
        value={{
          packageData: null,
          tabControls,
        }}
      >
        {children}
      </PackageDetailContext.Provider>
    );
  }

  if (error) {
    console.error("Failed to fetch package details:", error);
    return (
      <PackageDetailContext.Provider
        value={{
          packageData: null,
          tabControls,
        }}
      >
        {children}
      </PackageDetailContext.Provider>
    );
  }

  return (
    <PackageDetailContext.Provider
      value={{
        packageData: packageData || null,
        tabControls,
      }}
    >
      {children}
    </PackageDetailContext.Provider>
  );
};
