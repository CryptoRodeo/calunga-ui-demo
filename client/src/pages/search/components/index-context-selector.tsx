import type React from "react";
import { useState, useMemo } from "react";
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  type MenuToggleElement,
  MenuSearch,
  MenuSearchInput,
  Divider,
} from "@patternfly/react-core";

const indexOptions = [
  { value: "all", label: "All Indexes" },
  { value: "github", label: "GitHub" },
  { value: "artifactory", label: "Artifactory" },
  { value: "nexus", label: "Nexus" },
];

export const IndexContextSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<string>("all");
  const [searchValue, setSearchValue] = useState<string>("");

  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    const selectedValue = value as string;
    setSelectedIndex(selectedValue);
    setIsOpen(false);
    setSearchValue(""); // Clear search when closing
  };

  const onSearchChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string,
  ) => {
    setSearchValue(value);
  };

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchValue) {
      return indexOptions;
    }
    return indexOptions.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [searchValue]);

  // Get toggle label based on selection
  const getToggleLabel = () => {
    const option = indexOptions.find((opt) => opt.value === selectedIndex);
    return option?.label || "All Indexes";
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => {
        setIsOpen(isOpen);
        if (!isOpen) {
          setSearchValue(""); // Clear search when closing
        }
      }}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onToggle}
          isExpanded={isOpen}
          style={{
            width: "200px",
          }}
        >
          {getToggleLabel()}
        </MenuToggle>
      )}
      shouldFocusToggleOnSelect
      isScrollable
    >
      <MenuSearch>
        <MenuSearchInput>
          <input
            type="search"
            placeholder="Search"
            aria-label="Search input"
            value={searchValue}
            onChange={(e) =>
              onSearchChange(
                e as React.FormEvent<HTMLInputElement>,
                e.target.value,
              )
            }
          />
        </MenuSearchInput>
      </MenuSearch>
      <Divider />
      <DropdownList>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <DropdownItem
              key={option.value}
              value={option.value}
              isSelected={selectedIndex === option.value}
            >
              {option.label}
            </DropdownItem>
          ))
        ) : (
          <DropdownItem isDisabled>No results found</DropdownItem>
        )}
      </DropdownList>
    </Dropdown>
  );
};
