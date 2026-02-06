import React from "react";
import { useQuery } from "@tanstack/react-query";

import { FilterType } from "@app/components/FilterToolbar";
import {
  type ITableControls,
  useTableControlProps,
  useTableControlState,
} from "@app/hooks/table-controls";
import { getHubRequestParams } from "@app/hooks/table-controls/getHubRequestParams";
import { FILTER_TEXT_CATEGORY_KEY } from "@app/Constants";
import type { PulpPythonPackageContent } from "@app/api/models";
import { getPulpPaginatedResult, PULP_ENDPOINTS } from "@app/api/rest";
import { formatDate } from "@app/utils/utils";

export interface PythonWheel {
  id: string;
  wheel: string;
  version: string;
  abi: string;
  platform: string;
  license: string;
  published: string;
  sourceIndex: string;
  description?: string;
}

interface IPythonWheelsContext {
  tableControls: ITableControls<
    PythonWheel,
    | "wheel"
    | "version"
    | "abi"
    | "platform"
    | "license"
    | "published"
    | "sourceIndex",
    | "wheel"
    | "version"
    | "abi"
    | "platform"
    | "license"
    | "published"
    | "sourceIndex",
    "" | "platform" | "sourceIndex",
    string
  >;
  totalItemCount: number;
}

const contextDefaultValue = {} as IPythonWheelsContext;

export const PythonWheelsContext =
  React.createContext<IPythonWheelsContext>(contextDefaultValue);

interface IPythonWheelsProvider {
  children: React.ReactNode;
}

/**
 * Extracts ABI tag from wheel filename.
 * Format: {name}-{version}-{pyver}-{abi}-{platform}.whl
 */
const extractAbiFromFilename = (filename: string): string => {
  const parts = filename.replace(".whl", "").split("-");
  return parts.length >= 4 ? parts[3] : "none";
};

/**
 * Extracts platform tag from wheel filename.
 */
const extractPlatformFromFilename = (filename: string): string => {
  const parts = filename.replace(".whl", "").split("-");
  return parts.length >= 5 ? parts[4] : "any";
};

export const PythonWheelsProvider: React.FunctionComponent<
  IPythonWheelsProvider
> = ({ children }) => {
  const tableControlState = useTableControlState({
    tableName: "python-wheels",
    persistTo: "urlParams",
    columnNames: {
      wheel: "Wheel",
      version: "Version",
      abi: "ABI",
      platform: "Platform",
      license: "License",
      published: "Published",
      sourceIndex: "Source Index",
    },
    isPaginationEnabled: true,
    isSortEnabled: true,
    sortableColumns: [
      "wheel",
      "version",
      "abi",
      "platform",
      "license",
      "published",
      "sourceIndex",
    ],
    getSortValues: (item) => ({
      wheel: item.wheel,
      version: item.version,
      abi: item.abi,
      platform: item.platform,
      license: item.license,
      published: item.published,
      sourceIndex: item.sourceIndex,
    }),
    hubSortFieldKeys: {
      wheel: "name",
      version: "version",
      abi: "filename",
      platform: "platform",
      license: "license",
      published: "pulp_created",
      sourceIndex: "name", // Default to name if no distribution
    },
    isFilterEnabled: true,
    filterCategories: [
      {
        categoryKey: FILTER_TEXT_CATEGORY_KEY,
        title: "Name",
        placeholderText: "Filter by wheel name",
        type: FilterType.search,
        serverFilterField: "name",
        getItemValue: (item) => item.wheel,
      },
      {
        categoryKey: "platform",
        title: "Platform",
        type: FilterType.select,
        placeholderText: "Filter by platform",
        serverFilterField: "platform",
        getItemValue: (item) => item.platform,
        selectOptions: [
          { value: "x86_64", label: "x86_64" },
          { value: "aarch64", label: "aarch64" },
          { value: "any", label: "Any" },
        ],
      },
      {
        categoryKey: "sourceIndex",
        title: "Source Index",
        type: FilterType.select,
        placeholderText: "Filter by source index",
        getItemValue: (item) => item.sourceIndex,
        selectOptions: [
          { value: "TDL", label: "TDL" },
          { value: "AIPCC", label: "AIPCC" },
        ],
      },
    ],
    isExpansionEnabled: true,
    expandableVariant: "single",
  });

  // Get Hub request params from table state
  const hubParams = getHubRequestParams(tableControlState);

  // Add packagetype filter for wheels only
  const wheelsParams = {
    ...hubParams,
    filters: [
      ...(hubParams.filters || []),
      { field: "packagetype", operator: "=" as const, value: "bdist_wheel" },
    ],
  };

  // Fetch wheels from Pulp API
  const { data, isLoading, error } = useQuery({
    queryKey: ["python-wheels", wheelsParams],
    queryFn: async () => {
      const result = await getPulpPaginatedResult<PulpPythonPackageContent>(
        PULP_ENDPOINTS.PYTHON_CONTENT,
        wheelsParams,
      );

      // Transform to PythonWheel model
      const wheels: PythonWheel[] = result.data.map((content) => ({
        id: content.pulp_href,
        wheel: content.name,
        version: content.version,
        abi: extractAbiFromFilename(content.filename),
        platform:
          content.platform || extractPlatformFromFilename(content.filename),
        license: content.license || "Unknown",
        published: formatDate(content.pulp_created) || "Unknown",
        sourceIndex: "TDL", // TODO: Fetch from distribution
        description: content.summary,
      }));

      return {
        data: wheels,
        total: result.total,
      };
    },
  });

  const tableControls = useTableControlProps({
    ...tableControlState,
    currentPageItems: data?.data || [],
    totalItemCount: data?.total || 0,
    idProperty: "id",
    isLoading,
  });

  if (error) {
    console.error("Failed to fetch Python wheels:", error);
  }

  return (
    <PythonWheelsContext.Provider
      value={{
        totalItemCount: data?.total || 0,
        tableControls,
      }}
    >
      {children}
    </PythonWheelsContext.Provider>
  );
};
