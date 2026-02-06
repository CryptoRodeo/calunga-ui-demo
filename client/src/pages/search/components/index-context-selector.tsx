import type React from "react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  type MenuToggleElement,
  MenuSearch,
  MenuSearchInput,
  TextInput,
  Divider,
  Tooltip,
  Flex,
  FlexItem,
  Spinner,
} from "@patternfly/react-core";
import { QuestionCircleIcon } from "@patternfly/react-icons";
import { getAllDistributions } from "@app/api/pulp";

interface IndexContextSelectorProps {
  selectedIndex?: string;
  onIndexChange?: (index: string) => void;
  availableDistributions?: { name: string; base_path: string }[];
  isLoading?: boolean;
}

export const IndexContextSelector: React.FC<IndexContextSelectorProps> = ({
  selectedIndex: controlledSelectedIndex,
  onIndexChange,
  availableDistributions = [],
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<string>("");

  // Use first distribution as default if not controlled
  const defaultIndex =
    availableDistributions.length > 0 ? availableDistributions[0].name : "";
  const selectedIndex =
    onIndexChange !== undefined
      ? controlledSelectedIndex || defaultIndex
      : internalSelectedIndex || defaultIndex;

  const [searchValue, setSearchValue] = useState<string>("");

  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    const selectedValue = value as string;
    if (onIndexChange) {
      onIndexChange(selectedValue);
    } else {
      setInternalSelectedIndex(selectedValue);
    }
    setIsOpen(false);
    setSearchValue(""); // Clear search when closing
  };

  const onSearchChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string,
  ) => {
    setSearchValue(value);
  };

  // Map distributions to dropdown options
  const indexOptions = useMemo(() => {
    return availableDistributions.map((dist) => ({
      value: dist.name,
      label: dist.name,
      basePath: dist.base_path,
    }));
  }, [availableDistributions]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchValue) {
      return indexOptions;
    }
    return indexOptions.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [searchValue, indexOptions]);

  // Get toggle label based on selection
  const getToggleLabel = () => {
    if (isLoading) {
      return "Loading...";
    }
    if (indexOptions.length === 0) {
      return "No distributions available";
    }
    const option = indexOptions.find((opt) => opt.value === selectedIndex);
    return option?.label || indexOptions[0]?.label || "Select index";
  };

  return (
    <Flex
      alignItems={{ default: "alignItemsCenter" }}
      spaceItems={{ default: "spaceItemsSm" }}
    >
      <FlexItem>
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
            <MenuSearchInput
              style={{
                paddingTop: "4px",
                paddingBottom: "0",
                marginBottom: "0",
              }}
            >
              <TextInput
                type="search"
                placeholder="Search"
                aria-label="Search input"
                value={searchValue}
                onChange={(e, value) => onSearchChange(e, value)}
              />
            </MenuSearchInput>
          </MenuSearch>
          <Divider style={{ margin: "0" }} />
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
      </FlexItem>
      <FlexItem>
        <Tooltip content="Select the package source index to search. Different indexes contain packages from different ecosystems and repositories.">
          <QuestionCircleIcon
            style={{
              color: "#6A6E73",
              cursor: "help",
            }}
          />
        </Tooltip>
      </FlexItem>
    </Flex>
  );
};
