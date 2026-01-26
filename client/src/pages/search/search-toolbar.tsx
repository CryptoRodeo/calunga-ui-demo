import React, { useContext } from "react";
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Pagination,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  type MenuToggleElement,
  Flex,
  FlexItem,
} from "@patternfly/react-core";
import { SearchContext, type SortOption } from "./search-context";

export const SearchToolbar: React.FC = () => {
  const {
    sortBy,
    setSortBy,
    page,
    setPage,
    perPage,
    setPerPage,
    filteredItemCount,
  } = useContext(SearchContext);

  const [isSortOpen, setIsSortOpen] = React.useState(false);

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

  const currentSortLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label || "Relevance";

  const startItem = (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, filteredItemCount);

  return (
    <Toolbar>
      <ToolbarContent>
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
