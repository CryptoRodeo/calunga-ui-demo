import type React from "react";
import { useContext, useEffect, useLayoutEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  PageSection,
  PageSectionVariants,
  Title,
  Button,
  Flex,
  FlexItem,
  Label,
  Tabs,
  Tab,
  TabContent,
  Grid,
  GridItem,
  Alert,
  Spinner,
} from "@patternfly/react-core";
import {
  ArrowLeftIcon,
  CopyIcon,
  ExclamationTriangleIcon,
} from "@patternfly/react-icons";
import {
  PackageDetailProvider,
  PackageDetailContext,
} from "./package-detail-context-simple";
import { OverviewTab } from "./package-detail-tabs/overview-tab";
import { VersionsTab } from "./package-detail-tabs/versions-tab";
import { FilesTab } from "./package-detail-tabs/files-tab";
import { SecurityTab } from "./package-detail-tabs/security-tab";
import type { Package } from "./search-context";
import type {
  HubRequestParams,
  PulpPythonPackageContent,
} from "@app/api/models";
import { getPulpPaginatedResult, PULP_ENDPOINTS } from "@app/api/pulp";
import { transformPulpContentToPackage } from "@app/utils/pulp-transformers";
import { MetadataSidebar } from "./components/metadata-sidebar";

const PackageDetailContent: React.FC = () => {
  const { packageData, isLoading, isError, tabControls } = useContext(PackageDetailContext);
  const navigate = useNavigate();
  const { packageName, version } = useParams<{
    packageName: string;
    version: string;
  }>();

  // Scroll to top when navigating to a package - use useLayoutEffect for immediate scroll
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [packageName, version]);

  // Fetch all versions to check if there's a newer stable version
  // IMPORTANT: All hooks must be called before any conditional returns
  const { data: allVersionsData } = useQuery({
    queryKey: ["package-versions", packageData?.name],
    queryFn: async () => {
      if (!packageData) return [];

      const hubParams: HubRequestParams = {
        filters: [{ field: "name", operator: "=", value: packageData.name }],
        page: {
          pageNumber: 1,
          itemsPerPage: 100,
        },
      };

      const result = await getPulpPaginatedResult<PulpPythonPackageContent>(
        PULP_ENDPOINTS.PYTHON_CONTENT,
        hubParams,
        { fields: "pulp_href,name,version,pulp_created,python_version" },
      );

      return result.data.map((content) =>
        transformPulpContentToPackage(content, undefined, undefined, null),
      );
    },
    enabled: !!packageData,
    staleTime: 1000 * 60 * 5,
  });

  // Check if there's a newer stable version available
  const hasNewerVersion = useMemo(() => {
    if (!allVersionsData || !packageData) return false;

    // Filter to only stable versions (no rc, alpha, beta)
    const stableVersions = allVersionsData
      .filter(
        (pkg) =>
          !pkg.version.includes("rc") &&
          !pkg.version.includes("alpha") &&
          !pkg.version.includes("beta"),
      )
      .sort((a, b) => {
        // Same sorting logic as versions-tab but only for stable versions
        const parseVersion = (version: string) => {
          const match = version.match(/^(\d+\.\d+\.\d+)(.*)$/);
          if (!match) return { base: [0, 0, 0], preRelease: null };

          const baseParts = match[1].split(".").map(Number);
          const preReleasePart = match[2];

          let preRelease = null;
          if (preReleasePart) {
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

        return 0;
      });

    // Current version is not the latest stable if it's not the first in the sorted stable versions array
    return (
      stableVersions.length > 0 &&
      stableVersions[0].version !== packageData.version
    );
  }, [allVersionsData, packageData]);

  const { activeKey, setActiveKey } = tabControls;

  const handleNavigateToSecurity = () => {
    setActiveKey("security");
  };

  const handleNavigateToAttestations = () => {
    setActiveKey("security");
    // Navigate to attestations section
    setTimeout(() => {
      const attestationsSection = document.querySelector(
        '[data-section="attestations"]',
      );
      if (attestationsSection) {
        attestationsSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleNavigateToSbom = () => {
    setActiveKey("security");
    // Navigate to SBOM section
    setTimeout(() => {
      const sbomSection = document.querySelector('[data-section="sbom"]');
      if (sbomSection) {
        sbomSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleNavigateToVulnerabilities = () => {
    setActiveKey("security");
    // Navigate to vulnerabilities section
    setTimeout(() => {
      const vulnerabilitiesSection = document.querySelector(
        '[data-section="vulnerabilities"]',
      );
      if (vulnerabilitiesSection) {
        vulnerabilitiesSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Conditional returns AFTER all hooks are called
  if (isLoading) {
    return (
      <PageSection>
        <Flex justifyContent={{ default: "justifyContentCenter" }} style={{ padding: "4rem 0" }}>
          <FlexItem>
            <Spinner size="xl" aria-label="Loading package details" />
          </FlexItem>
        </Flex>
      </PageSection>
    );
  }

  if (isError || !packageData) {
    return (
      <PageSection>
        <Alert variant="warning" title="Package not found">
          <p>The package you are looking for could not be found.</p>
          <Button
            variant="link"
            onClick={() => navigate("/search")}
            style={{ paddingLeft: 0 }}
          >
            Return to search
          </Button>
        </Alert>
      </PageSection>
    );
  }

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Button
          variant="link"
          icon={<ArrowLeftIcon />}
          onClick={() => navigate("/search")}
          style={{ paddingLeft: 0, marginBottom: "1rem" }}
        >
          Back to Packages
        </Button>
        <Flex
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          alignItems={{ default: "alignItemsCenter" }}
        >
          <FlexItem>
            <Flex
              direction={{ default: "column" }}
              spaceItems={{ default: "spaceItemsSm" }}
            >
              <FlexItem>
                <Flex
                  alignItems={{ default: "alignItemsCenter" }}
                  spaceItems={{ default: "spaceItemsSm" }}
                >
                  <FlexItem>
                    <Title headingLevel="h1" size="2xl">
                      {packageData.name}
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <Label color="blue" isCompact>
                      v{packageData.version}
                    </Label>
                  </FlexItem>
                  {hasNewerVersion && (
                    <FlexItem>
                      <Label
                        color="yellow"
                        isCompact
                        icon={
                          <ExclamationTriangleIcon
                            style={{ color: "#b77c00" }}
                          />
                        }
                      >
                        Newer version available
                      </Label>
                    </FlexItem>
                  )}
                </Flex>
              </FlexItem>
              <FlexItem>
                <p style={{ fontSize: "var(--pf-v6-global--FontSize--lg)" }}>
                  {packageData.description}
                </p>
              </FlexItem>
              {packageData.tags && Array.isArray(packageData.tags) && packageData.tags.length > 0 && (
                <FlexItem>
                  <Flex spaceItems={{ default: "spaceItemsSm" }}>
                    {packageData.tags.map((tag) => (
                      <FlexItem key={tag}>
                        <Label color="grey" isCompact>
                          #{tag}
                        </Label>
                      </FlexItem>
                    ))}
                  </Flex>
                </FlexItem>
              )}
            </Flex>
          </FlexItem>
          <FlexItem>
            <Button
              variant="secondary"
              icon={<CopyIcon />}
              onClick={() => {
                navigator.clipboard.writeText(
                  `pip install ${packageData.name}==${packageData.version}`,
                );
              }}
            >
              pip install {packageData.name}=={packageData.version}
            </Button>
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection>
        <Tabs
          activeKey={
            activeKey === "overview"
              ? 0
              : activeKey === "versions"
                ? 1
                : activeKey === "files"
                  ? 2
                  : 3
          }
          onSelect={(_, tabIndex) => {
            const keys: TabKey[] = [
              "overview",
              "versions",
              "files",
              "security",
            ];
            setActiveKey(keys[tabIndex as number]);
          }}
          aria-label="Package details tabs"
        >
          <Tab eventKey={0} title="Overview" />
          <Tab eventKey={1} title="Versions" />
          <Tab eventKey={2} title="Files" />
          <Tab eventKey={3} title="Security" />
        </Tabs>

        <div style={{ marginTop: "1rem" }}>
          {activeKey === "overview" && (
            <Grid hasGutter>
              <GridItem span={8} md={8} lg={9}>
                <OverviewTab />
              </GridItem>
              <GridItem span={4} md={4} lg={3}>
                <MetadataSidebar
                  packageData={packageData}
                  onNavigateToSecurity={handleNavigateToSecurity}
                  onNavigateToAttestations={handleNavigateToAttestations}
                  onNavigateToSbom={handleNavigateToSbom}
                  onNavigateToVulnerabilities={handleNavigateToVulnerabilities}
                />
              </GridItem>
            </Grid>
          )}
          {activeKey === "versions" && <VersionsTab />}
          {activeKey === "files" && <FilesTab />}
          {activeKey === "security" && <SecurityTab />}
        </div>
      </PageSection>
    </>
  );
};

export const PackageDetail: React.FC = () => {
  const { packageName, version } = useParams<{
    packageName: string;
    version: string;
  }>();

  // Aggressive scroll to top at the main component level
  useLayoutEffect(() => {
    const scrollToTop = () => {
      // Multiple immediate scroll attempts
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Force scroll on main containers
      const mainContent = document.querySelector("main");
      if (mainContent) mainContent.scrollTop = 0;

      const pageMain = document.querySelector(".pf-v6-c-page__main");
      if (pageMain) pageMain.scrollTop = 0;
    };

    scrollToTop();

    // Also try on next tick
    setTimeout(scrollToTop, 0);

    // And after a brief delay
    setTimeout(scrollToTop, 50);
  }, [packageName, version]);

  if (!packageName || !version) {
    return (
      <PageSection>
        <Alert variant="danger" title="Invalid package information">
          <p>Package name or version was not provided in the URL.</p>
        </Alert>
      </PageSection>
    );
  }

  return (
    <PackageDetailProvider packageName={packageName} version={version}>
      <PackageDetailContent />
    </PackageDetailProvider>
  );
};
