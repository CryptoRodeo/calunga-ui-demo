import React from "react";

import { FilterType } from "@app/components/FilterToolbar";
import {
  type ITableControls,
  useTableControlProps,
  useTableControlState,
  useLocalTableControlDerivedState,
} from "@app/hooks/table-controls";
import { FILTER_TEXT_CATEGORY_KEY } from "@app/Constants";
import dummyData from "./dummy-data.json";

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
    "wheel" | "version" | "abi" | "platform" | "license" | "published" | "sourceIndex",
    "wheel" | "version" | "abi" | "platform" | "license" | "published" | "sourceIndex",
    "" | "platform" | "sourceIndex",
    string
  >;
  totalItemCount: number;
}

const contextDefaultValue = {} as IPythonWheelsContext;

export const PythonWheelsContext = React.createContext<IPythonWheelsContext>(
  contextDefaultValue
);

interface IPythonWheelsProvider {
  children: React.ReactNode;
}

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
    sortableColumns: ["wheel", "version", "abi", "platform", "license", "published", "sourceIndex"],
    getSortValues: (item) => ({
      wheel: item.wheel,
      version: item.version,
      abi: item.abi,
      platform: item.platform,
      license: item.license,
      published: item.published,
      sourceIndex: item.sourceIndex,
    }),
    isFilterEnabled: true,
    filterCategories: [
      {
        categoryKey: FILTER_TEXT_CATEGORY_KEY,
        title: "Name",
        placeholderText: "Filter by wheel name",
        type: FilterType.search,
        getItemValue: (item) => item.wheel,
      },
      {
        categoryKey: "platform",
        title: "Platform",
        type: FilterType.select,
        placeholderText: "Filter by platform",
        getItemValue: (item) => item.platform,
        selectOptions: [
          { value: "x86_64", label: "x86_64" },
          { value: "aarch64", label: "aarch64" },
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

  // Load dummy data from JSON file
  const mockWheels: PythonWheel[] = dummyData;

  // Process data with sorting, filtering, and pagination
  const derivedState = useLocalTableControlDerivedState({
    ...tableControlState,
    items: mockWheels,
  });

  const tableControls = useTableControlProps({
    ...tableControlState,
    ...derivedState,
    idProperty: "id",
    isLoading: false,
  });

  return (
    <PythonWheelsContext.Provider
      value={{
        totalItemCount: derivedState.totalItemCount,
        tableControls,
      }}
    >
      {children}
    </PythonWheelsContext.Provider>
  );
};
