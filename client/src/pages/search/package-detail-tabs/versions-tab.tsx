import type React from "react";
import { useContext, useMemo } from "react";
import {
  PageSection,
  Badge,
  Button,
  Flex,
  Label,
  Title,
  Spinner,
  Bullseye,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { PackageDetailContext } from "../package-detail-context-simple";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Package } from "../search-context";
import type {
  HubRequestParams,
  PulpPythonPackageContent,
} from "@app/api/models";
import { getPulpPaginatedResult, PULP_ENDPOINTS } from "@app/api/pulp";
import { transformPulpContentToPackage } from "@app/utils/pulp-transformers";

export const VersionsTab: React.FC = () => {
  const { packageData } = useContext(PackageDetailContext);
  const navigate = useNavigate();

  // Fetch all versions of this package from Pulp API
  const { data: allVersionsData, isLoading } = useQuery({
    queryKey: ["package-versions", packageData?.name],
    queryFn: async () => {
      if (!packageData) return [];

      const hubParams: HubRequestParams = {
        filters: [{ field: "name", operator: "=", value: packageData.name }],
        page: {
          pageNumber: 1,
          itemsPerPage: 100, // Fetch up to 100 versions
        },
      };

      const result = await getPulpPaginatedResult<PulpPythonPackageContent>(
        PULP_ENDPOINTS.PYTHON_CONTENT,
        hubParams,
      );

      // Transform to UI Package model
      return result.data.map((content) =>
        transformPulpContentToPackage(content, undefined, undefined, null),
      );
    },
    enabled: !!packageData,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Sort versions
  const packageVersions = useMemo(() => {
    if (!allVersionsData) return [];

    return [...allVersionsData].sort((a, b) => {
        // Sort versions in descending order (latest first)
        // Proper semantic versioning with pre-release handling
        const parseVersion = (version: string) => {
          // Split version into base version and pre-release parts
          const match = version.match(/^(\d+\.\d+\.\d+)(.*)$/);
          if (!match) return { base: [0, 0, 0], preRelease: null };

          const baseParts = match[1].split(".").map(Number);
          const preReleasePart = match[2];

          let preRelease = null;
          if (preReleasePart) {
            // Extract pre-release info (rc, alpha, beta, etc.)
            const preMatch = preReleasePart.match(/^(rc|alpha|beta)(\d+)?$/);
            if (preMatch) {
              preRelease = {
                type: preMatch[1],
                number: preMatch[2] ? parseInt(preMatch[2], 10) : 0,
              };
            }
          }

          return { base: baseParts, preRelease };
        };

        const versionA = parseVersion(a.version);
        const versionB = parseVersion(b.version);

        // First compare base versions
        for (let i = 0; i < 3; i++) {
          if (versionB.base[i] !== versionA.base[i]) {
            return versionB.base[i] - versionA.base[i];
          }
        }

        // Base versions are equal, now handle pre-release
        // Stable releases (no pre-release) come before pre-releases
        if (!versionA.preRelease && versionB.preRelease) return -1;
        if (versionA.preRelease && !versionB.preRelease) return 1;

        // Both are pre-releases, compare them
        if (versionA.preRelease && versionB.preRelease) {
          // Compare pre-release types (stable > rc > beta > alpha)
          const typeOrder = { rc: 3, beta: 2, alpha: 1 };
          const aTypeOrder =
            typeOrder[versionA.preRelease.type as keyof typeof typeOrder] || 0;
          const bTypeOrder =
            typeOrder[versionB.preRelease.type as keyof typeof typeOrder] || 0;

          if (bTypeOrder !== aTypeOrder) {
            return bTypeOrder - aTypeOrder;
          }

          // Same pre-release type, compare numbers
          return versionB.preRelease.number - versionA.preRelease.number;
        }

        // Both are stable releases, they're equal
        return 0;
      });

    return allVersions;
  }, [packageData]);

  if (!packageData) {
    return (
      <PageSection>
        <p>No package information available.</p>
      </PageSection>
    );
  }

  if (isLoading) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner aria-label="Loading versions" />
        </Bullseye>
      </PageSection>
    );
  }

  const formatDownloads = (downloads: number): string => {
    if (downloads >= 1000000) {
      return `${(downloads / 1000000).toFixed(1)}M`;
    }
    if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(0)}K`;
    }
    return downloads.toString();
  };

  const handleVersionClick = (version: string) => {
    window.scrollTo(0, 0);
    navigate(`/search/${packageData.name}/${version}`);
  };

  const getStabilityBadge = (version: string) => {
    if (version.includes("rc")) {
      return (
        <Label color="yellow" isCompact>
          Release Candidate
        </Label>
      );
    }
    if (version.includes("beta")) {
      return (
        <Label color="purple" isCompact>
          Beta
        </Label>
      );
    }
    if (version.includes("alpha")) {
      return (
        <Label color="red" isCompact>
          Alpha
        </Label>
      );
    }
    if (version.includes("dev")) {
      return (
        <Label color="grey" isCompact>
          Development
        </Label>
      );
    }
    return (
      <Label color="green" isCompact>
        Stable
      </Label>
    );
  };

  const getPythonVersionSupport = (packageVersion: any) => {
    // Extract from the package data, or use a sensible default based on version
    if (packageVersion.pythonVersion) {
      return packageVersion.pythonVersion;
    }

    // Fallback logic based on version patterns
    const version = packageVersion.version;
    if (version.startsWith("3.0")) return ">=3.11";
    if (version.startsWith("2.")) return ">=3.9";
    if (version.startsWith("1.4")) return ">=3.8";
    return ">=3.8"; // default
  };

  return (
    <PageSection>
      <Title headingLevel="h2" size="xl">
        Versions
      </Title>
      <p style={{ marginTop: "0.5rem" }}>
        All available versions of this package, including stable releases and
        pre-releases.
      </p>
      <Table
        aria-label="Versions table"
        variant="compact"
        style={{ marginTop: "1.5rem" }}
      >
        <Thead>
          <Tr>
            <Th>Version</Th>
            <Th>Release Type</Th>
            <Th>Python Support</Th>
            <Th>Release Date</Th>
            <Th>Downloads</Th>
          </Tr>
        </Thead>
        <Tbody>
          {packageVersions.map((version) => {
            const isCurrentVersion = version.version === packageData.version;
            return (
              <Tr key={version.version}>
                <Td dataLabel="Version">
                  <Flex
                    alignItems={{ default: "alignItemsCenter" }}
                    spaceItems={{ default: "spaceItemsSm" }}
                  >
                    <Button
                      variant="link"
                      isInline
                      onClick={() => handleVersionClick(version.version)}
                      style={{
                        fontWeight: isCurrentVersion ? "bold" : "normal",
                        color: isCurrentVersion
                          ? "var(--pf-v6-global--primary-color--100)"
                          : undefined,
                      }}
                    >
                      {version.version}
                    </Button>
                    {isCurrentVersion && (
                      <Badge variant="outline" color="blue">
                        This version
                      </Badge>
                    )}
                  </Flex>
                </Td>
                <Td dataLabel="Release Type">
                  {getStabilityBadge(version.version)}
                </Td>
                <Td dataLabel="Python Support" style={{ minWidth: "120px" }}>
                  <code
                    style={{
                      backgroundColor:
                        "var(--pf-v6-global--BackgroundColor--200)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "var(--pf-v6-global--FontSize--sm)",
                      fontFamily: "var(--pf-v6-global--FontFamily--monospace)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getPythonVersionSupport(version)}
                  </code>
                </Td>
                <Td dataLabel="Release Date">{version.updated}</Td>
                <Td dataLabel="Downloads">
                  {formatDownloads(version.downloads)}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </PageSection>
  );
};
