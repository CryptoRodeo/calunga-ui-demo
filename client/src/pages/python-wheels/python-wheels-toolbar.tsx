import React from "react";

import { Toolbar, ToolbarContent, ToolbarItem } from "@patternfly/react-core";

import { FilterToolbar } from "@app/components/FilterToolbar";
import { SimplePagination } from "@app/components/SimplePagination";

import { PythonWheelsContext } from "./python-wheels-context";

export const PythonWheelsToolbar: React.FC = () => {
  const { tableControls } = React.useContext(PythonWheelsContext);

  const {
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
    },
  } = tableControls;

  return (
    <Toolbar {...toolbarProps} aria-label="python-wheels-toolbar">
      <ToolbarContent>
        <FilterToolbar {...filterToolbarProps} />
        <ToolbarItem {...paginationToolbarItemProps}>
          <SimplePagination
            idPrefix="python-wheels-table"
            isTop
            paginationProps={paginationProps}
          />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};
