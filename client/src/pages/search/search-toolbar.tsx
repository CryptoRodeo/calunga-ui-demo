import React, { useContext } from "react";
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarFilter,
  Pagination,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  type MenuToggleElement,
  Flex,
  FlexItem,
  Badge,
  SearchInput,
} from "@patternfly/react-core";
import {
  SearchContext,
  type SortOption,
  type FilterValues,
} from "./search-context";
import "./search-toolbar.css";

interface SearchToolbarProps {
  searchQuery: string;
  onSearchChange: (
    _event: React.FormEvent<HTMLInputElement>,
    value: string,
  ) => void;
  onSearchClear: () => void;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchClear,
}) => {
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
  const [isClassificationFilterOpen, setIsClassificationFilterOpen] =
    React.useState(false);
  const [isLicenseFilterOpen, setIsLicenseFilterOpen] = React.useState(false);

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

  // Filter options based on PyPI classifiers and common categories
  const classificationOptions = [
    { value: "web-development", label: "Web Development" },
    { value: "data-science", label: "Data Science & Analytics" },
    { value: "machine-learning", label: "Machine Learning & AI" },
    { value: "cloud-services", label: "Cloud Services" },
    { value: "database", label: "Database & Storage" },
    { value: "security", label: "Security & Cryptography" },
    { value: "networking", label: "Networking & HTTP" },
    { value: "testing", label: "Testing & Quality Assurance" },
    { value: "devops", label: "DevOps & Automation" },
    { value: "scientific", label: "Scientific Computing" },
    { value: "gui", label: "GUI & Desktop Applications" },
    { value: "utilities", label: "System Utilities" },
    { value: "packaging", label: "Packaging & Distribution" },
    { value: "documentation", label: "Documentation Tools" },
    { value: "logging", label: "Logging & Monitoring" },
  ];

  const licenseOptions = [
    { value: "MIT", label: "MIT License" },
    { value: "Apache-2.0", label: "Apache 2.0" },
    { value: "BSD-3-Clause", label: "BSD 3-Clause" },
    { value: "GPL-3.0", label: "GPL v3" },
    { value: "PSF", label: "Python Software Foundation" },
    { value: "HPND", label: "Historical Permission Notice and Disclaimer" },
    { value: "ISC", label: "ISC License" },
  ];

  const currentSortLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label || "Relevance";

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
        <ToolbarItem style={{ flex: 1, minWidth: 0 }}>
          <SearchInput
            placeholder="Search for packages..."
            value={searchQuery}
            onChange={onSearchChange}
            onClear={onSearchClear}
            aria-label="Search packages"
            style={{ width: "100%" }}
          />
        </ToolbarItem>

        {/* Classification Filter */}
        <ToolbarItem>
          <ToolbarFilter
            labels={filters.classification}
            deleteLabel={(_category, chip) =>
              onDeleteFilterChip("classification", chip)
            }
            deleteLabelGroup={() => onDeleteFilterGroup("classification")}
            categoryName="Classification"
          >
            <Select
              role="menu"
              isOpen={isClassificationFilterOpen}
              selected={filters.classification}
              onSelect={(event, value) =>
                onFilterSelect("classification", event, value)
              }
              onOpenChange={(isOpen) => setIsClassificationFilterOpen(isOpen)}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() =>
                    setIsClassificationFilterOpen(!isClassificationFilterOpen)
                  }
                  isExpanded={isClassificationFilterOpen}
                  style={{ minWidth: "150px" }}
                >
                  Classification
                  {filters.classification.length > 0 && (
                    <Badge isRead style={{ marginLeft: "8px" }}>
                      {filters.classification.length}
                    </Badge>
                  )}
                </MenuToggle>
              )}
            >
              <SelectList style={{ maxHeight: "230px", overflowY: "auto" }}>
                {classificationOptions.map((option) => (
                  <SelectOption
                    key={option.value}
                    value={option.value}
                    hasCheckbox
                    isSelected={filters.classification.includes(option.value)}
                  >
                    {option.label}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </ToolbarFilter>
        </ToolbarItem>

        {/* License Filter */}
        <ToolbarItem>
          <ToolbarFilter
            labels={filters.license}
            deleteLabel={(_category, chip) =>
              onDeleteFilterChip("license", chip)
            }
            deleteLabelGroup={() => onDeleteFilterGroup("license")}
            categoryName="License"
          >
            <Select
              role="menu"
              isOpen={isLicenseFilterOpen}
              selected={filters.license}
              onSelect={(event, value) =>
                onFilterSelect("license", event, value)
              }
              onOpenChange={(isOpen) => setIsLicenseFilterOpen(isOpen)}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsLicenseFilterOpen(!isLicenseFilterOpen)}
                  isExpanded={isLicenseFilterOpen}
                  style={{ minWidth: "135px" }}
                >
                  License
                  {filters.license.length > 0 && (
                    <Badge isRead style={{ marginLeft: "8px" }}>
                      {filters.license.length}
                    </Badge>
                  )}
                </MenuToggle>
              )}
            >
              <SelectList style={{ maxHeight: "230px", overflowY: "auto" }}>
                {licenseOptions.map((option) => (
                  <SelectOption
                    key={option.value}
                    value={option.value}
                    hasCheckbox
                    isSelected={filters.license.includes(option.value)}
                  >
                    {option.label}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </ToolbarFilter>
        </ToolbarItem>

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
