import type React from "react";
import { createContext, useMemo } from "react";
import { useTabControls } from "@app/hooks/tab-controls";
import type { Package } from "./search-context";
import dummyData from "./dummy-data.json";

export type TabKey = "overview" | "versions" | "dependents" | "security";

interface IPackageDetailContext {
  packageData: Package | null;
  tabControls: ReturnType<typeof useTabControls<TabKey>>;
}

const contextDefaultValue = {} as IPackageDetailContext;

export const PackageDetailContext =
  createContext<IPackageDetailContext>(contextDefaultValue);

interface IPackageDetailProvider {
  packageId: string;
  children: React.ReactNode;
}

export const PackageDetailProvider: React.FunctionComponent<
  IPackageDetailProvider
> = ({ packageId, children }) => {
  // Load package data from dummy data
  const packageData = useMemo(() => {
    const packages: Package[] = dummyData;
    return packages.find((pkg) => pkg.id === packageId) || null;
  }, [packageId]);

  // Tab controls with URL persistence
  const tabControls = useTabControls({
    tabKeys: ["overview", "versions", "dependents", "security"],
    persistTo: "urlParams",
  });

  return (
    <PackageDetailContext.Provider
      value={{
        packageData,
        tabControls,
      }}
    >
      {children}
    </PackageDetailContext.Provider>
  );
};
