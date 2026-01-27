import React, { useContext } from "react";
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarFilter,
  ToolbarToggleGroup,
  ToolbarGroup,
  Pagination,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  type MenuToggleElement,
  Flex,
  FlexItem,
  Badge,
} from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons";
import {
  SearchContext,
  type SortOption,
  type FilterValues,
} from "./search-context";

export const SearchToolbar: React.FC = () => {
  const {
    sortBy,
    setSortBy,
    page,
    setPage,
    perPage,
    setPerPage,
    filteredItemCount,
    filters,
    setFilter,
    clearAllFilters,
    deleteFilter,
  } = useContext(SearchContext);

  const [isSortOpen, setIsSortOpen] = React.useState(false);
  const [isPythonFilterOpen, setIsPythonFilterOpen] = React.useState(false);
  const [isArchFilterOpen, setIsArchFilterOpen] = React.useState(false);

  const onSortSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    setSortBy(value as SortOption);
    setIsSortOpen(false);
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "relevance", label: "Relevance" },
    { value: "date", label: "Date Updated" },
    { value: "downloads", label: "Downloads" },
  ];

  // Filter options
  const pythonVersionOptions = [
    { value: "3.7", label: "Python 3.7" },
    { value: "3.8", label: "Python 3.8" },
    { value: "3.9", label: "Python 3.9" },
    { value: "3.10", label: "Python 3.10" },
    { value: "3.11", label: "Python 3.11" },
    { value: "3.12", label: "Python 3.12" },
  ];

  const architectureOptions = [
    { value: "x86_64", label: "x86_64" },
    { value: "aarch64", label: "ARM64 (aarch64)" },
    { value: "any", label: "Any" },
    { value: "universal", label: "Universal" },
  ];

  const currentSortLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label || "Relevance";

  const startItem = (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, filteredItemCount);

  // Filter handlers
  const onFilterSelect = (
    category: keyof FilterValues,
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    const valueStr = value as string;
    const currentFilters = filters[category];

    if (currentFilters.includes(valueStr)) {
      setFilter(
        category,
        currentFilters.filter((v) => v !== valueStr),
      );
    } else {
      setFilter(category, [...currentFilters, valueStr]);
    }
  };

  const onDeleteFilterChip = (
    category: keyof FilterValues,
    chip: string | string[],
  ) => {
    if (typeof chip === "string") {
      deleteFilter(category, chip);
    }
  };

  const onDeleteFilterGroup = (category: keyof FilterValues) => {
    setFilter(category, []);
  };

  return (
    <Toolbar
      id="package-search-toolbar"
      clearAllFilters={clearAllFilters}
      collapseListedFiltersBreakpoint="xl"
      clearFiltersButtonText="Clear all filters"
    >
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarGroup variant="filter-group">
            {/* Python Version Filter */}
            <ToolbarFilter
              labels={filters.pythonVersion}
              deleteLabel={(_category, chip) =>
                onDeleteFilterChip("pythonVersion", chip)
              }
              deleteLabelGroup={() => onDeleteFilterGroup("pythonVersion")}
              categoryName="Python Version"
            >
              <Select
                role="menu"
                isOpen={isPythonFilterOpen}
                selected={filters.pythonVersion}
                onSelect={(event, value) =>
                  onFilterSelect("pythonVersion", event, value)
                }
                onOpenChange={(isOpen) => setIsPythonFilterOpen(isOpen)}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsPythonFilterOpen(!isPythonFilterOpen)}
                    isExpanded={isPythonFilterOpen}
                    style={{ width: "200px" }}
                  >
                    Filter by Python version
                    {filters.pythonVersion.length > 0 && (
                      <Badge isRead>{filters.pythonVersion.length}</Badge>
                    )}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  {pythonVersionOptions.map((option) => (
                    <SelectOption
                      key={option.value}
                      value={option.value}
                      hasCheckbox
                      isSelected={filters.pythonVersion.includes(option.value)}
                    >
                      {option.label}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarFilter>

            {/* Architecture Filter */}
            <ToolbarFilter
              labels={filters.architecture}
              deleteLabel={(_category, chip) =>
                onDeleteFilterChip("architecture", chip)
              }
              deleteLabelGroup={() => onDeleteFilterGroup("architecture")}
              categoryName="Architecture"
            >
              <Select
                role="menu"
                isOpen={isArchFilterOpen}
                selected={filters.architecture}
                onSelect={(event, value) =>
                  onFilterSelect("architecture", event, value)
                }
                onOpenChange={(isOpen) => setIsArchFilterOpen(isOpen)}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsArchFilterOpen(!isArchFilterOpen)}
                    isExpanded={isArchFilterOpen}
                    style={{ width: "200px" }}
                  >
                    Filter by architecture
                    {filters.architecture.length > 0 && (
                      <Badge isRead>{filters.architecture.length}</Badge>
                    )}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  {architectureOptions.map((option) => (
                    <SelectOption
                      key={option.value}
                      value={option.value}
                      hasCheckbox
                      isSelected={filters.architecture.includes(option.value)}
                    >
                      {option.label}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarFilter>
          </ToolbarGroup>
        </ToolbarToggleGroup>

        <ToolbarItem variant="separator" />

        <ToolbarItem>
          <Flex alignItems={{ default: "alignItemsCenter" }}>
            <FlexItem>
              <span>Sort by:</span>
            </FlexItem>
            <FlexItem>
              <Select
                isOpen={isSortOpen}
                selected={sortBy}
                onSelect={onSortSelect}
                onOpenChange={(isOpen) => setIsSortOpen(isOpen)}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    isExpanded={isSortOpen}
                  >
                    {currentSortLabel}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  {sortOptions.map((option) => (
                    <SelectOption key={option.value} value={option.value}>
                      {option.label}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </FlexItem>
          </Flex>
        </ToolbarItem>

        <ToolbarItem variant="separator" />

        <ToolbarItem>
          {filteredItemCount > 0 ? (
            <span>
              Showing {startItem}-{endItem} of {filteredItemCount}
            </span>
          ) : (
            <span>No results</span>
          )}
        </ToolbarItem>

        <ToolbarItem variant="pagination" align={{ default: "alignEnd" }}>
          <Pagination
            itemCount={filteredItemCount}
            perPage={perPage}
            page={page}
            onSetPage={(_event, newPage) => setPage(newPage)}
            onPerPageSelect={(_event, newPerPage) => setPerPage(newPerPage)}
            perPageOptions={[
              { title: "10", value: 10 },
              { title: "20", value: 20 },
              { title: "50", value: 50 },
            ]}
            isCompact
          />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};
