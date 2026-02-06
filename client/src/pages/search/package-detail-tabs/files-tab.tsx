import type React from "react";
import { useContext, useState, useMemo } from "react";
import {
  PageSection,
  Title,
  Label,
  Flex,
  FlexItem,
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarFilter,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  type MenuToggleElement,
  Badge,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { DownloadIcon } from "@patternfly/react-icons";
import { PackageDetailContext } from "../package-detail-context-simple";

interface FileData {
  filename: string;
  size: number;
  type: string;
  uploadDate: string;
  pythonVersion: string;
  abi: string;
  platform: string;
}

export const FilesTab: React.FC = () => {
  const { packageData } = useContext(PackageDetailContext);

  // Filter states
  const [filenameFilter, setFilenameFilter] = useState("");
  const [abiFilters, setAbiFilters] = useState<string[]>([]);
  const [platformFilters, setPlatformFilters] = useState<string[]>([]);

  // Dropdown states
  const [isAbiOpen, setIsAbiOpen] = useState(false);
  const [isPlatformOpen, setIsPlatformOpen] = useState(false);

  if (!packageData) {
    return (
      <PageSection>
        <Title headingLevel="h3" size="lg">
          No files available
        </Title>
        <p>No files found for this package version.</p>
      </PageSection>
    );
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes} B`;
  };

  const getPlatformLabel = (platform: string) => {
    if (platform.includes("win_amd64") || platform.includes("win_arm64")) {
      if (platform.includes("arm64")) return "Windows ARM64";
      return "Windows x86-64";
    }
    if (platform.includes("win32")) return "Windows x86";
    if (platform.includes("macosx")) {
      if (platform.includes("arm64")) return "macOS ARM64";
      if (platform.includes("x86_64")) return "macOS x86-64";
      return "macOS";
    }
    if (platform.includes("manylinux") || platform.includes("linux")) {
      if (platform.includes("aarch64")) return "Linux ARM64";
      return "Linux x86-64";
    }
    if (platform.includes("musllinux")) {
      if (platform.includes("aarch64")) return "musllinux ARM64";
      return "musllinux x86-64";
    }
    return "Any";
  };

  const getPythonVersionFromTag = (tag: string) => {
    if (tag === "cp314") return "3.14";
    if (tag === "cp313") return "3.13";
    if (tag === "cp312") return "3.12";
    if (tag === "cp311") return "3.11";
    if (tag === "cp310") return "3.10";
    if (tag === "cp39") return "3.9";
    return "Any";
  };

  const extractWheelTags = (filename: string) => {
    if (!filename.endsWith(".whl")) {
      return { pythonTag: "Source", abiTag: "Source", platformTag: "Source" };
    }

    // Remove .whl extension and split by -
    const parts = filename.slice(0, -4).split("-");
    if (parts.length >= 5) {
      return {
        pythonTag: parts[2],
        abiTag: parts[3],
        platformTag: parts.slice(4).join("-"),
      };
    }

    return { pythonTag: "Any", abiTag: "Any", platformTag: "Any" };
  };

  // Mock file data based on the package - in a real app this would come from the API
  const generateMockFiles = (): FileData[] => {
    const files: FileData[] = [];

    // Source distribution
    files.push({
      filename: `${packageData.name}-${packageData.version}.tar.gz`,
      size: Math.floor(Math.random() * 5000000) + 2000000, // 2-7 MB
      type: "Source Distribution",
      uploadDate: packageData.updated,
      pythonVersion: "Source",
      abi: "Source",
      platform: "Source",
    });

    // Python 3.12 manylinux wheels for x86_64 and aarch64 architectures
    const wheelConfigs = [
      // Python 3.12 - version-specific ABI
      {
        python: "cp312",
        abi: "cp312",
        platforms: [
          "manylinux_2_24_x86_64.manylinux_2_28_x86_64", // x86_64 architecture
          "manylinux_2_24_aarch64.manylinux_2_28_aarch64", // aarch64 architecture
        ],
      },
      // Python 3.12 - stable ABI3 (compatible with Python 3.12+)
      {
        python: "cp312",
        abi: "abi3",
        platforms: [
          "manylinux_2_24_x86_64.manylinux_2_28_x86_64", // x86_64 architecture
          "manylinux_2_24_aarch64.manylinux_2_28_aarch64", // aarch64 architecture
        ],
      },
    ];

    wheelConfigs.forEach((config) => {
      config.platforms.forEach((platform) => {
        files.push({
          filename: `${packageData.name}-${packageData.version}-${config.python}-${config.abi}-${platform}.whl`,
          size: Math.floor(Math.random() * 5000000) + 9000000, // 9-14 MB
          type: "Built Distribution",
          uploadDate: packageData.updated,
          pythonVersion: getPythonVersionFromTag(config.python),
          abi: config.abi,
          platform: platform,
        });
      });
    });

    return files;
  };

  const allFiles = useMemo(() => generateMockFiles(), [packageData]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const abis = new Set<string>();
    const platforms = new Set<string>();

    allFiles.forEach((file) => {
      if (file.type === "Built Distribution") {
        const tags = extractWheelTags(file.filename);
        abis.add(tags.abiTag);
        platforms.add(file.platform);
      }
    });

    return {
      abis: Array.from(abis).sort(),
      platforms: Array.from(platforms).sort(),
    };
  }, [allFiles]);

  // Apply filters
  const filteredFiles = useMemo(() => {
    return allFiles.filter((file) => {
      // Filename filter
      if (
        filenameFilter &&
        !file.filename.toLowerCase().includes(filenameFilter.toLowerCase())
      ) {
        return false;
      }

      // Skip other filters for source files
      if (file.type === "Source Distribution") {
        return true;
      }

      const tags = extractWheelTags(file.filename);

      // ABI filter
      if (abiFilters.length > 0 && !abiFilters.includes(tags.abiTag)) {
        return false;
      }

      // Platform filter
      if (
        platformFilters.length > 0 &&
        !platformFilters.includes(file.platform)
      ) {
        return false;
      }

      return true;
    });
  }, [allFiles, filenameFilter, abiFilters, platformFilters]);

  // Filter handlers
  const onFilterSelect = (
    category: "abi" | "platform",
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    const valueStr = value as string;
    const currentFilters = category === "abi" ? abiFilters : platformFilters;
    const setFilter = category === "abi" ? setAbiFilters : setPlatformFilters;

    if (currentFilters.includes(valueStr)) {
      setFilter(currentFilters.filter((v) => v !== valueStr));
    } else {
      setFilter([...currentFilters, valueStr]);
    }
  };

  const onDeleteFilterChip = (
    category: "abi" | "platform",
    chip: string | string[],
  ) => {
    if (typeof chip === "string") {
      const setFilter = category === "abi" ? setAbiFilters : setPlatformFilters;
      const currentFilters = category === "abi" ? abiFilters : platformFilters;
      setFilter(currentFilters.filter((v) => v !== chip));
    }
  };

  const onDeleteFilterGroup = (category: "abi" | "platform") => {
    const setFilter = category === "abi" ? setAbiFilters : setPlatformFilters;
    setFilter([]);
  };

  const clearAllFilters = () => {
    setFilenameFilter("");
    setAbiFilters([]);
    setPlatformFilters([]);
  };

  return (
    <PageSection>
      <Title headingLevel="h2" size="xl">
        Files
      </Title>
      <p style={{ marginTop: "0.5rem" }}>
        Download files for this package version, including source distributions
        and compiled manylinux wheels for x86_64
      </p>

      {/* Filters */}
      <Toolbar
        id="files-toolbar"
        style={{ marginTop: "1.5rem" }}
        clearAllFilters={clearAllFilters}
        collapseListedFiltersBreakpoint="xl"
        clearFiltersButtonText="Clear all filters"
      >
        <ToolbarContent>
          <ToolbarItem style={{ flex: 1, minWidth: 0 }}>
            <SearchInput
              placeholder="Filter files by name"
              value={filenameFilter}
              onChange={(_event, value) => setFilenameFilter(value)}
              onClear={() => setFilenameFilter("")}
              aria-label="Filter files by name"
              style={{ width: "100%" }}
            />
          </ToolbarItem>

          {/* ABI Filter */}
          <ToolbarItem>
            <ToolbarFilter
              labels={abiFilters}
              deleteLabel={(_category, chip) => onDeleteFilterChip("abi", chip)}
              deleteLabelGroup={() => onDeleteFilterGroup("abi")}
              categoryName="ABI"
            >
              <Select
                role="menu"
                isOpen={isAbiOpen}
                selected={abiFilters}
                onSelect={(event, value) => onFilterSelect("abi", event, value)}
                onOpenChange={(isOpen) => setIsAbiOpen(isOpen)}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsAbiOpen(!isAbiOpen)}
                    isExpanded={isAbiOpen}
                    style={{ minWidth: "90px" }}
                  >
                    ABI
                    {abiFilters.length > 0 && (
                      <Badge isRead style={{ marginLeft: "8px" }}>
                        {abiFilters.length}
                      </Badge>
                    )}
                  </MenuToggle>
                )}
              >
                <SelectList style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {filterOptions.abis.map((abi) => (
                    <SelectOption
                      key={abi}
                      value={abi}
                      hasCheckbox
                      isSelected={abiFilters.includes(abi)}
                    >
                      {abi}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarFilter>
          </ToolbarItem>

          {/* Platform Filter */}
          <ToolbarItem>
            <ToolbarFilter
              labels={platformFilters}
              deleteLabel={(_category, chip) =>
                onDeleteFilterChip("platform", chip)
              }
              deleteLabelGroup={() => onDeleteFilterGroup("platform")}
              categoryName="Platform"
            >
              <Select
                role="menu"
                isOpen={isPlatformOpen}
                selected={platformFilters}
                onSelect={(event, value) =>
                  onFilterSelect("platform", event, value)
                }
                onOpenChange={(isOpen) => setIsPlatformOpen(isOpen)}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsPlatformOpen(!isPlatformOpen)}
                    isExpanded={isPlatformOpen}
                    style={{ minWidth: "120px" }}
                  >
                    Platform
                    {platformFilters.length > 0 && (
                      <Badge isRead style={{ marginLeft: "8px" }}>
                        {platformFilters.length}
                      </Badge>
                    )}
                  </MenuToggle>
                )}
              >
                <SelectList style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {filterOptions.platforms.map((platform) => (
                    <SelectOption
                      key={platform}
                      value={platform}
                      hasCheckbox
                      isSelected={platformFilters.includes(platform)}
                    >
                      {platform}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarFilter>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      <Table aria-label="Package files table" variant="compact">
        <Thead>
          <Tr>
            <Th width={45}>File</Th>
            <Th width={10}>Type</Th>
            <Th width={10}>Size</Th>
            <Th width={12}>ABI</Th>
            <Th width={18}>Platform</Th>
            <Th width={5}>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredFiles.map((file, index) => {
            const tags = extractWheelTags(file.filename);
            return (
              <Tr key={index}>
                <Td dataLabel="File">
                  <div>
                    <div
                      style={{
                        fontFamily:
                          "var(--pf-v6-global--FontFamily--monospace)",
                        fontSize: "var(--pf-v6-global--FontSize--sm)",
                      }}
                    >
                      {file.filename}
                    </div>
                    <div style={{ marginTop: "0.25rem" }}>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>
                        Uploaded {file.uploadDate}
                      </span>
                    </div>
                  </div>
                </Td>
                <Td dataLabel="Type">
                  <Label
                    color={
                      file.type === "Source Distribution" ? "blue" : "green"
                    }
                    isCompact
                  >
                    {file.type === "Source Distribution" ? "Source" : "Wheel"}
                  </Label>
                </Td>
                <Td dataLabel="Size">
                  <span
                    style={{
                      fontFamily: "var(--pf-v6-global--FontFamily--monospace)",
                      fontSize: "var(--pf-v6-global--FontSize--sm)",
                    }}
                  >
                    {formatFileSize(file.size)}
                  </span>
                </Td>
                <Td dataLabel="ABI">
                  <Label color="cyan" isCompact>
                    {tags.abiTag}
                  </Label>
                </Td>
                <Td dataLabel="Platform">
                  <Label color="grey" isCompact>
                    {getPlatformLabel(file.platform)}
                  </Label>
                </Td>
                <Td dataLabel="Actions">
                  <Button
                    variant="plain"
                    size="sm"
                    aria-label={`Download ${file.filename}`}
                  >
                    <DownloadIcon />
                  </Button>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </PageSection>
  );
};
