import type React from "react";
import { useContext, useState, useMemo } from "react";
import {
  PageSection,
  Alert,
  Title,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
  Card,
  CardBody,
  Flex,
  FlexItem,
  Button,
  Badge,
  Divider,
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
  Modal,
  ModalVariant,
  ModalHeader,
  ModalBody,
} from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import {
  ExternalLinkAltIcon,
  DownloadIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@patternfly/react-icons";
import { PackageDetailContext } from "../package-detail-context-simple";
import { SLSABadge } from "../components/slsa-badge";
import { AttestationStatusBadge } from "../components/attestation-status-badge";

export const SecurityTab: React.FC = () => {
  const { packageData } = useContext(PackageDetailContext);
  const [expandedSections, setExpandedSections] = useState({
    attestations: true,
    sbom: true,
    advisories: true,
    vulnerabilities: true,
  });

  // Modal state for SBOM components
  const [isSbomComponentsModalOpen, setIsSbomComponentsModalOpen] =
    useState(false);

  // Component modal filter states
  const [componentNameFilter, setComponentNameFilter] = useState("");
  const [componentTypeFilters, setComponentTypeFilters] = useState<string[]>(
    [],
  );
  const [componentLicenseFilters, setComponentLicenseFilters] = useState<
    string[]
  >([]);

  // Component dropdown states
  const [isComponentTypeFilterOpen, setIsComponentTypeFilterOpen] =
    useState(false);
  const [isComponentLicenseFilterOpen, setIsComponentLicenseFilterOpen] =
    useState(false);

  // Vulnerabilities filter states
  const [cveIdFilter, setCveIdFilter] = useState("");
  const [severityFilters, setSeverityFilters] = useState<string[]>([]);
  const [fixableFilter, setFixableFilter] = useState<string>("");

  // Dropdown states for vulnerability filters
  const [isSeverityFilterOpen, setIsSeverityFilterOpen] = useState(false);
  const [isFixableFilterOpen, setIsFixableFilterOpen] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  // Severity options for filtering
  const severityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "important", label: "Important" },
    { value: "critical", label: "Critical" },
  ];

  // Fixable options for filtering
  const fixableOptions = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  // Filter handlers for vulnerabilities
  const onVulnFilterSelect = (
    category: "severity" | "fixable",
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    const valueStr = value as string;

    if (category === "severity") {
      if (severityFilters.includes(valueStr)) {
        setSeverityFilters(severityFilters.filter((v) => v !== valueStr));
      } else {
        setSeverityFilters([...severityFilters, valueStr]);
      }
    } else if (category === "fixable") {
      // For fixable, it's a single select (not multi-select)
      setFixableFilter(fixableFilter === valueStr ? "" : valueStr);
    }
  };

  const onDeleteVulnFilterChip = (
    category: "severity" | "fixable",
    chip: string | string[],
  ) => {
    if (typeof chip === "string") {
      if (category === "severity") {
        setSeverityFilters(severityFilters.filter((v) => v !== chip));
      } else if (category === "fixable") {
        setFixableFilter("");
      }
    }
  };

  const onDeleteVulnFilterGroup = (category: "severity" | "fixable") => {
    if (category === "severity") {
      setSeverityFilters([]);
    } else if (category === "fixable") {
      setFixableFilter("");
    }
  };

  const clearAllVulnFilters = () => {
    setCveIdFilter("");
    setSeverityFilters([]);
    setFixableFilter("");
  };

  const clearAllComponentFilters = () => {
    setComponentNameFilter("");
    setComponentTypeFilters([]);
    setComponentLicenseFilters([]);
  };

  if (!packageData) {
    return (
      <PageSection>
        <Title headingLevel="h2" size="xl">
          Security
        </Title>
        <p style={{ marginTop: "0.5rem" }}>
          Security information for this package, including trust verification,
          attestations, and vulnerability reports when available.
        </p>
        <Alert
          variant="info"
          isInline
          title="No security information available"
          style={{ marginTop: "1.5rem" }}
        >
          <p>No security information is available for this package.</p>
        </Alert>
      </PageSection>
    );
  }

  const {
    currentVersionAttestations,
    currentVersionSbom,
    slsaLevel,
    securityAdvisories,
  } = packageData;

  // Get unique component types and licenses for dropdown options
  const componentTypeOptions = useMemo(() => {
    if (!currentVersionSbom?.components) return [];
    const types = [
      ...new Set(currentVersionSbom.components.map((comp) => comp.type)),
    ].sort();
    return types.map((type) => ({ value: type, label: type }));
  }, [currentVersionSbom?.components]);

  const componentLicenseOptions = useMemo(() => {
    if (!currentVersionSbom?.components) return [];
    const licenses = [
      ...new Set(
        currentVersionSbom.components.flatMap((comp) => comp.licenses || []),
      ),
    ].sort();
    return licenses.map((license) => ({ value: license, label: license }));
  }, [currentVersionSbom?.components]);

  // Filter components for modal
  const filteredComponents = useMemo(() => {
    if (!currentVersionSbom?.components) return [];

    return currentVersionSbom.components.filter((component) => {
      // Component name filter
      if (
        componentNameFilter &&
        !component.name
          .toLowerCase()
          .includes(componentNameFilter.toLowerCase())
      ) {
        return false;
      }

      // Component type filter
      if (
        componentTypeFilters.length > 0 &&
        !componentTypeFilters.includes(component.type)
      ) {
        return false;
      }

      // Component license filter
      if (
        componentLicenseFilters.length > 0 &&
        !component.licenses?.some((license) =>
          componentLicenseFilters.includes(license),
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    currentVersionSbom?.components,
    componentNameFilter,
    componentTypeFilters,
    componentLicenseFilters,
  ]);

  // Filter vulnerabilities based on current filter settings
  const filteredVulnerabilities = useMemo(() => {
    if (!currentVersionSbom?.summary?.vulnerabilities) return [];

    return currentVersionSbom.summary.vulnerabilities.filter((vuln) => {
      // CVE ID filter
      if (
        cveIdFilter &&
        !vuln.id.toLowerCase().includes(cveIdFilter.toLowerCase())
      ) {
        return false;
      }

      // Severity filter
      if (
        severityFilters.length > 0 &&
        !severityFilters.includes(vuln.severity.toLowerCase())
      ) {
        return false;
      }

      // Fixable filter
      if (fixableFilter) {
        const isFixable = vuln.fixedVersion && vuln.fixedVersion.trim() !== "";
        if (fixableFilter === "yes" && !isFixable) {
          return false;
        }
        if (fixableFilter === "no" && isFixable) {
          return false;
        }
      }

      return true;
    });
  }, [
    currentVersionSbom?.summary?.vulnerabilities,
    cveIdFilter,
    severityFilters,
    fixableFilter,
  ]);

  const getSeverityVariant = (
    severity: string,
  ): "danger" | "warning" | "info" | "default" => {
    switch (severity) {
      case "critical":
        return "danger";
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  const verifiedCount =
    currentVersionAttestations?.filter((att) => att.status === "verified")
      .length ?? 0;
  const totalCount = currentVersionAttestations?.length ?? 0;
  const allVerified = totalCount > 0 && verifiedCount === totalCount;

  const hasSecurityInfo =
    currentVersionAttestations ||
    currentVersionSbom ||
    slsaLevel ||
    securityAdvisories?.length;

  return (
    <PageSection>
      <Title headingLevel="h2" size="xl">
        Security
      </Title>
      <p style={{ marginTop: "0.5rem" }}>
        Security information for this package, including trust verification,
        attestations, and vulnerability reports when available.
      </p>

      {/* Attestations Details */}
      {currentVersionAttestations &&
        Array.isArray(currentVersionAttestations) &&
        currentVersionAttestations.length > 0 && (
          <Card style={{ marginTop: "1rem" }} data-section="attestations">
            <CardBody>
              <Button
                variant="plain"
                onClick={() => toggleSection("attestations")}
                style={{
                  padding: 0,
                  width: "100%",
                  justifyContent: "flex-start",
                  marginBottom: expandedSections.attestations ? "1rem" : "0",
                }}
              >
                <Flex
                  alignItems={{ default: "alignItemsCenter" }}
                  spaceItems={{ default: "spaceItemsSm" }}
                >
                  <FlexItem>
                    {expandedSections.attestations ? (
                      <ChevronDownIcon />
                    ) : (
                      <ChevronRightIcon />
                    )}
                  </FlexItem>
                  <FlexItem>
                    <Title headingLevel="h3" size="lg">
                      Attestation Details
                    </Title>
                  </FlexItem>
                </Flex>
              </Button>
              {expandedSections.attestations &&
                currentVersionAttestations.map((attestation, index) => (
                  <div key={`${attestation.type}-${index}`}>
                    {index > 0 && <Divider style={{ margin: "1.5rem 0" }} />}
                    <div style={{ marginBottom: "0.75rem" }}>
                      <Title
                        headingLevel="h4"
                        size="md"
                        style={{ marginBottom: "0.5rem" }}
                      >
                        {attestation.type.charAt(0).toUpperCase() +
                          attestation.type.slice(1)}{" "}
                        Attestation
                      </Title>
                      <Flex spaceItems={{ default: "spaceItemsSm" }}>
                        <FlexItem>
                          <AttestationStatusBadge
                            attestation={attestation}
                            showVerifier={true}
                          />
                        </FlexItem>
                        <FlexItem>
                          <SLSABadge level={attestation.slsaLevel || 3} />
                        </FlexItem>
                      </Flex>
                    </div>

                    <DescriptionList isCompact isHorizontal>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Verified</DescriptionListTerm>
                        <DescriptionListDescription>
                          {new Date(attestation.timestamp).toLocaleString()}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      {attestation.buildPlatform && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Platform</DescriptionListTerm>
                          <DescriptionListDescription>
                            {attestation.buildPlatform}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                      {attestation.subject && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Subject</DescriptionListTerm>
                          <DescriptionListDescription>
                            {attestation.subject}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                      {attestation.certificateUrl && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Certificate</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Button
                              variant="link"
                              isInline
                              isSmall
                              icon={<ExternalLinkAltIcon />}
                              component="a"
                              href={attestation.certificateUrl}
                              target="_blank"
                              style={{ padding: 0 }}
                            >
                              View
                            </Button>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                      {attestation.signatureUrl && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Signature</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Button
                              variant="link"
                              isInline
                              isSmall
                              icon={<ExternalLinkAltIcon />}
                              component="a"
                              href={attestation.signatureUrl}
                              target="_blank"
                              style={{ padding: 0 }}
                            >
                              View
                            </Button>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                    </DescriptionList>
                  </div>
                ))}
            </CardBody>
          </Card>
        )}

      {/* SBOM Details */}
      {currentVersionSbom && (
        <Card style={{ marginTop: "1rem" }} data-section="sbom">
          <CardBody>
            <Flex
              justifyContent={{ default: "justifyContentSpaceBetween" }}
              alignItems={{ default: "alignItemsCenter" }}
            >
              <FlexItem>
                <Button
                  variant="plain"
                  onClick={() => toggleSection("sbom")}
                  style={{
                    padding: 0,
                    justifyContent: "flex-start",
                  }}
                >
                  <Flex
                    alignItems={{ default: "alignItemsCenter" }}
                    spaceItems={{ default: "spaceItemsSm" }}
                  >
                    <FlexItem>
                      {expandedSections.sbom ? (
                        <ChevronDownIcon />
                      ) : (
                        <ChevronRightIcon />
                      )}
                    </FlexItem>
                    <FlexItem>
                      <Title headingLevel="h3" size="lg">
                        Software Bill of Materials (SBOM)
                      </Title>
                    </FlexItem>
                  </Flex>
                </Button>
              </FlexItem>
              {expandedSections.sbom && (
                <FlexItem>
                  <Flex spaceItems={{ default: "spaceItemsSm" }}>
                    <FlexItem>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<DownloadIcon />}
                        component="a"
                        href={currentVersionSbom.url}
                        download
                      >
                        Download
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <Button
                        variant="link"
                        size="sm"
                        icon={<ExternalLinkAltIcon />}
                        component="a"
                        href={currentVersionSbom.url}
                        target="_blank"
                      >
                        View Raw
                      </Button>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              )}
            </Flex>

            {expandedSections.sbom && (
              <>
                <DescriptionList isHorizontal style={{ marginTop: "1rem" }}>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Format</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Badge isRead variant="outline">
                        {currentVersionSbom.format}{" "}
                        {currentVersionSbom.version &&
                          `v${currentVersionSbom.version}`}
                      </Badge>
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  <DescriptionListGroup>
                    <DescriptionListTerm>Serial Number</DescriptionListTerm>
                    <DescriptionListDescription>
                      {currentVersionSbom.serialNumber ||
                        `${currentVersionSbom.format}Ref-DOCUMENT`}
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  <DescriptionListGroup>
                    <DescriptionListTerm>Generated At</DescriptionListTerm>
                    <DescriptionListDescription>
                      {currentVersionSbom.timestamp
                        ? new Date(
                            currentVersionSbom.timestamp,
                          ).toLocaleString()
                        : "Not available"}
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  <DescriptionListGroup>
                    <DescriptionListTerm>Generation Tool</DescriptionListTerm>
                    <DescriptionListDescription>
                      {currentVersionSbom.toolName || "konflux-sbom-generator"}{" "}
                      {currentVersionSbom.toolVersion || "v0.2.4"}
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  <DescriptionListGroup>
                    <DescriptionListTerm>Total Components</DescriptionListTerm>
                    <DescriptionListDescription>
                      {currentVersionSbom.components &&
                      currentVersionSbom.components.length > 0 ? (
                        <Button
                          variant="link"
                          isInline
                          onClick={() => setIsSbomComponentsModalOpen(true)}
                          style={{ padding: 0, fontSize: "inherit" }}
                        >
                          {currentVersionSbom.components.length} (view
                          components)
                        </Button>
                      ) : (
                        currentVersionSbom.summary?.totalComponents || 0
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  <DescriptionListGroup>
                    <DescriptionListTerm>
                      Direct Dependencies
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                      {currentVersionSbom.summary?.directDependencies ?? 0}
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  <DescriptionListGroup>
                    <DescriptionListTerm>Licenses Found</DescriptionListTerm>
                    <DescriptionListDescription>
                      {currentVersionSbom.summary?.licensesFound &&
                      currentVersionSbom.summary.licensesFound.length > 0 ? (
                        <Flex spaceItems={{ default: "spaceItemsSm" }}>
                          {currentVersionSbom.summary.licensesFound.map(
                            (license) => (
                              <FlexItem key={license}>
                                <Badge isRead variant="outline">
                                  {license}
                                </Badge>
                              </FlexItem>
                            ),
                          )}
                        </Flex>
                      ) : (
                        <Badge isRead variant="outline">
                          MIT
                        </Badge>
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>

                  <DescriptionListGroup>
                    <DescriptionListTerm>Vulnerabilities</DescriptionListTerm>
                    <DescriptionListDescription>
                      {currentVersionSbom.summary?.hasVulnerabilities ? (
                        <Badge
                          variant="filled"
                          style={{ backgroundColor: "#c9190b", color: "white" }}
                        >
                          {currentVersionSbom.summary.vulnerabilities?.length ||
                            "Found"}
                        </Badge>
                      ) : (
                        <Badge color="blue">None</Badge>
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>

                {currentVersionSbom.summary?.hasVulnerabilities && (
                  <Alert
                    variant="warning"
                    isInline
                    title="Vulnerabilities detected"
                    style={{ marginTop: "1rem" }}
                  >
                    This SBOM contains components with known vulnerabilities.
                    Review the details below.
                  </Alert>
                )}
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Security Advisories */}
      {securityAdvisories && securityAdvisories.length > 0 && (
        <Card style={{ marginTop: "1rem" }}>
          <CardBody>
            <Button
              variant="plain"
              onClick={() => toggleSection("advisories")}
              style={{
                padding: 0,
                width: "100%",
                justifyContent: "flex-start",
                marginBottom: expandedSections.advisories ? "1rem" : "0",
              }}
            >
              <Flex
                alignItems={{ default: "alignItemsCenter" }}
                spaceItems={{ default: "spaceItemsSm" }}
              >
                <FlexItem>
                  {expandedSections.advisories ? (
                    <ChevronDownIcon />
                  ) : (
                    <ChevronRightIcon />
                  )}
                </FlexItem>
                <FlexItem>
                  <Title headingLevel="h3" size="lg">
                    Security Advisories
                  </Title>
                </FlexItem>
              </Flex>
            </Button>
            {expandedSections.advisories &&
              securityAdvisories.map((advisory, index) => (
                <Alert
                  key={advisory.id}
                  variant={getSeverityVariant(advisory.severity)}
                  isInline
                  title={
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span>{advisory.title}</span>
                      <Label color={getSeverityVariant(advisory.severity)}>
                        {advisory.severity.toUpperCase()}
                      </Label>
                    </div>
                  }
                  style={{
                    marginBottom:
                      index < securityAdvisories.length - 1 ? "1rem" : "0",
                  }}
                >
                  <DescriptionList isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Advisory ID</DescriptionListTerm>
                      <DescriptionListDescription>
                        {advisory.id}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Description</DescriptionListTerm>
                      <DescriptionListDescription>
                        {advisory.description}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        Affected Versions
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {advisory.affectedVersions.join(", ")}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Published</DescriptionListTerm>
                      <DescriptionListDescription>
                        {new Date(advisory.publishedAt).toLocaleDateString()}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </Alert>
              ))}
          </CardBody>
        </Card>
      )}

      {/* Vulnerabilities */}
      {currentVersionSbom?.summary?.vulnerabilities &&
        currentVersionSbom.summary.vulnerabilities.length > 0 && (
          <Card style={{ marginTop: "1rem" }} data-section="vulnerabilities">
            <CardBody>
              <Button
                variant="plain"
                onClick={() => toggleSection("vulnerabilities")}
                style={{
                  padding: 0,
                  width: "100%",
                  justifyContent: "flex-start",
                  marginBottom: expandedSections.vulnerabilities ? "1rem" : "0",
                }}
              >
                <Flex
                  alignItems={{ default: "alignItemsCenter" }}
                  spaceItems={{ default: "spaceItemsSm" }}
                >
                  <FlexItem>
                    {expandedSections.vulnerabilities ? (
                      <ChevronDownIcon />
                    ) : (
                      <ChevronRightIcon />
                    )}
                  </FlexItem>
                  <FlexItem>
                    <Title headingLevel="h3" size="lg">
                      Vulnerabilities
                    </Title>
                  </FlexItem>
                </Flex>
              </Button>
              {expandedSections.vulnerabilities && (
                <div>
                  <p
                    style={{
                      marginBottom: "1rem",
                      color: "var(--pf-v6-global--Color--200)",
                    }}
                  >
                    Known vulnerabilities found in package dependencies
                  </p>

                  {/* Vulnerabilities Filter Toolbar */}
                  <Toolbar
                    id="vulnerabilities-toolbar"
                    style={{ marginBottom: "1rem" }}
                    clearAllFilters={clearAllVulnFilters}
                    collapseListedFiltersBreakpoint="lg"
                    clearFiltersButtonText="Clear all filters"
                  >
                    <ToolbarContent>
                      <ToolbarItem style={{ flex: 1, minWidth: 0 }}>
                        <SearchInput
                          placeholder="Filter by CVE ID"
                          value={cveIdFilter}
                          onChange={(_event, value) => setCveIdFilter(value)}
                          onClear={() => setCveIdFilter("")}
                          aria-label="Filter vulnerabilities by CVE ID"
                          style={{ width: "100%" }}
                        />
                      </ToolbarItem>

                      {/* Severity Filter */}
                      <ToolbarItem>
                        <ToolbarFilter
                          labels={severityFilters}
                          deleteLabel={(_category, chip) =>
                            onDeleteVulnFilterChip("severity", chip)
                          }
                          deleteLabelGroup={() =>
                            onDeleteVulnFilterGroup("severity")
                          }
                          categoryName="Severity"
                        >
                          <Select
                            role="menu"
                            isOpen={isSeverityFilterOpen}
                            selected={severityFilters}
                            onSelect={(event, value) =>
                              onVulnFilterSelect("severity", event, value)
                            }
                            onOpenChange={(isOpen) =>
                              setIsSeverityFilterOpen(isOpen)
                            }
                            toggle={(
                              toggleRef: React.Ref<MenuToggleElement>,
                            ) => (
                              <MenuToggle
                                ref={toggleRef}
                                onClick={() =>
                                  setIsSeverityFilterOpen(!isSeverityFilterOpen)
                                }
                                isExpanded={isSeverityFilterOpen}
                                style={{ minWidth: "120px" }}
                              >
                                Severity
                                {severityFilters.length > 0 && (
                                  <Badge isRead style={{ marginLeft: "8px" }}>
                                    {severityFilters.length}
                                  </Badge>
                                )}
                              </MenuToggle>
                            )}
                          >
                            <SelectList
                              style={{ maxHeight: "150px", overflowY: "auto" }}
                            >
                              {severityOptions.map((severity) => (
                                <SelectOption
                                  key={severity.value}
                                  value={severity.value}
                                  hasCheckbox
                                  isSelected={severityFilters.includes(
                                    severity.value,
                                  )}
                                >
                                  {severity.label}
                                </SelectOption>
                              ))}
                            </SelectList>
                          </Select>
                        </ToolbarFilter>
                      </ToolbarItem>

                      {/* Fixable Filter */}
                      <ToolbarItem>
                        <ToolbarFilter
                          labels={fixableFilter ? [fixableFilter] : []}
                          deleteLabel={(_category, chip) =>
                            onDeleteVulnFilterChip("fixable", chip)
                          }
                          deleteLabelGroup={() =>
                            onDeleteVulnFilterGroup("fixable")
                          }
                          categoryName="Fixable"
                        >
                          <Select
                            role="menu"
                            isOpen={isFixableFilterOpen}
                            selected={fixableFilter}
                            onSelect={(event, value) =>
                              onVulnFilterSelect("fixable", event, value)
                            }
                            onOpenChange={(isOpen) =>
                              setIsFixableFilterOpen(isOpen)
                            }
                            toggle={(
                              toggleRef: React.Ref<MenuToggleElement>,
                            ) => (
                              <MenuToggle
                                ref={toggleRef}
                                onClick={() =>
                                  setIsFixableFilterOpen(!isFixableFilterOpen)
                                }
                                isExpanded={isFixableFilterOpen}
                                style={{ minWidth: "100px" }}
                              >
                                Fixable
                                {fixableFilter && (
                                  <Badge isRead style={{ marginLeft: "8px" }}>
                                    1
                                  </Badge>
                                )}
                              </MenuToggle>
                            )}
                          >
                            <SelectList>
                              {fixableOptions.map((option) => (
                                <SelectOption
                                  key={option.value}
                                  value={option.value}
                                  isSelected={fixableFilter === option.value}
                                >
                                  {option.label}
                                </SelectOption>
                              ))}
                            </SelectList>
                          </Select>
                        </ToolbarFilter>
                      </ToolbarItem>
                    </ToolbarContent>
                  </Toolbar>

                  {filteredVulnerabilities.length > 0 ? (
                    <Table aria-label="Vulnerabilities table" variant="compact">
                      <Thead>
                        <Tr>
                          <Th width={20}>ID</Th>
                          <Th width={15}>Severity</Th>
                          <Th width={20}>Component</Th>
                          <Th width={30}>Description</Th>
                          <Th width={15}>Fixed Version</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredVulnerabilities.map((vuln, index) => (
                          <Tr key={index}>
                            <Td dataLabel="ID">
                              <Button
                                variant="link"
                                size="sm"
                                component="a"
                                href={vuln.references?.[0]}
                                target="_blank"
                              >
                                {vuln.id}
                              </Button>
                            </Td>
                            <Td dataLabel="Severity">
                              <Label
                                color={
                                  vuln.severity === "critical"
                                    ? "red"
                                    : vuln.severity === "high"
                                      ? "orange"
                                      : vuln.severity === "medium"
                                        ? "yellow"
                                        : "grey"
                                }
                                isCompact
                              >
                                {vuln.severity.toUpperCase()} ({vuln.cvss})
                              </Label>
                            </Td>
                            <Td dataLabel="Component">
                              <strong>{vuln.component}</strong>
                              <br />
                              <small
                                style={{
                                  color: "var(--pf-v6-global--Color--200)",
                                }}
                              >
                                v{vuln.version}
                              </small>
                            </Td>
                            <Td dataLabel="Description">{vuln.description}</Td>
                            <Td dataLabel="Fixed Version">
                              <Label color="green" isCompact>
                                {vuln.fixedVersion}
                              </Label>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Alert
                      variant="info"
                      isInline
                      title="No results found"
                      style={{ marginTop: "1rem" }}
                    >
                      <p>
                        No vulnerabilities match the current filter criteria.
                      </p>
                    </Alert>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        )}

      {/* No vulnerabilities found */}
      {currentVersionSbom?.summary?.hasVulnerabilities === false && (
        <Card style={{ marginTop: "1rem" }} data-section="vulnerabilities">
          <CardBody>
            <Button
              variant="plain"
              onClick={() => toggleSection("vulnerabilities")}
              style={{
                padding: 0,
                width: "100%",
                justifyContent: "flex-start",
                marginBottom: expandedSections.vulnerabilities ? "1rem" : "0",
              }}
            >
              <Flex
                alignItems={{ default: "alignItemsCenter" }}
                spaceItems={{ default: "spaceItemsSm" }}
              >
                <FlexItem>
                  {expandedSections.vulnerabilities ? (
                    <ChevronDownIcon />
                  ) : (
                    <ChevronRightIcon />
                  )}
                </FlexItem>
                <FlexItem>
                  <Title headingLevel="h3" size="lg">
                    Vulnerabilities
                  </Title>
                </FlexItem>
              </Flex>
            </Button>
            {expandedSections.vulnerabilities && (
              <Alert
                variant="success"
                isInline
                title="No known vulnerabilities"
                style={{ marginTop: "1rem" }}
              >
                <p>
                  No vulnerabilities were found in this package or its
                  dependencies.
                </p>
              </Alert>
            )}
          </CardBody>
        </Card>
      )}

      {/* No Security Information */}
      {!hasSecurityInfo && (
        <Alert
          variant="success"
          isInline
          title="No known security issues"
          style={{ marginTop: "1.5rem" }}
        >
          <p>
            No security advisories, attestations, or trust information are
            available for this package. This doesn't guarantee the package is
            secure, but no known vulnerabilities have been reported.
          </p>
        </Alert>
      )}

      {/* SBOM Components Modal */}
      <Modal
        variant={ModalVariant.large}
        isOpen={isSbomComponentsModalOpen}
        onClose={() => {
          setIsSbomComponentsModalOpen(false);
          clearAllComponentFilters();
        }}
        hasNoBodyWrapper
      >
        <ModalHeader>
          <Title headingLevel="h1" size="2xl">
            SBOM Components ({currentVersionSbom?.components?.length || 0})
          </Title>
          <p
            style={{
              color: "var(--pf-v6-global--Color--200)",
              marginTop: "0.5rem",
            }}
          >
            Detailed breakdown of all software components included in this
            package.
          </p>
        </ModalHeader>
        <ModalBody style={{ maxHeight: "500px", overflowY: "auto" }}>
          {currentVersionSbom?.components && (
            <>
              {/* Component Filters */}
              <Toolbar
                id="components-toolbar"
                clearAllFilters={clearAllComponentFilters}
                style={{ marginBottom: "1rem" }}
              >
                <ToolbarContent>
                  <ToolbarItem
                    variant="search-filter"
                    style={{ flex: "1", minWidth: "200px" }}
                  >
                    <SearchInput
                      aria-label="Filter by component name"
                      placeholder="Filter by component name..."
                      value={componentNameFilter}
                      onChange={(_, value) => setComponentNameFilter(value)}
                      onClear={() => setComponentNameFilter("")}
                      style={{ width: "100%" }}
                    />
                  </ToolbarItem>
                  <ToolbarFilter
                    chips={componentTypeFilters}
                    deleteChip={(_, chip) =>
                      setComponentTypeFilters((prev) =>
                        prev.filter((t) => t !== chip),
                      )
                    }
                    deleteChipGroup={() => setComponentTypeFilters([])}
                    categoryName="Type"
                  >
                    <Select
                      role="menu"
                      aria-label="Component type filter"
                      variant="checkbox"
                      isOpen={isComponentTypeFilterOpen}
                      selected={componentTypeFilters}
                      onSelect={(_, selection) => {
                        const value = selection as string;
                        setComponentTypeFilters((prev) =>
                          prev.includes(value)
                            ? prev.filter((item) => item !== value)
                            : [...prev, value],
                        );
                      }}
                      onOpenChange={(nextOpen: boolean) =>
                        setIsComponentTypeFilterOpen(nextOpen)
                      }
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsComponentTypeFilterOpen(
                              !isComponentTypeFilterOpen,
                            )
                          }
                          isExpanded={isComponentTypeFilterOpen}
                        >
                          Type
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        {componentTypeOptions.map((option) => (
                          <SelectOption
                            key={option.value}
                            value={option.value}
                            isSelected={componentTypeFilters.includes(
                              option.value,
                            )}
                            hasCheckbox
                          >
                            {option.label}
                          </SelectOption>
                        ))}
                      </SelectList>
                    </Select>
                  </ToolbarFilter>
                  <ToolbarFilter
                    chips={componentLicenseFilters}
                    deleteChip={(_, chip) =>
                      setComponentLicenseFilters((prev) =>
                        prev.filter((l) => l !== chip),
                      )
                    }
                    deleteChipGroup={() => setComponentLicenseFilters([])}
                    categoryName="License"
                  >
                    <Select
                      role="menu"
                      aria-label="Component license filter"
                      variant="checkbox"
                      isOpen={isComponentLicenseFilterOpen}
                      selected={componentLicenseFilters}
                      onSelect={(_, selection) => {
                        const value = selection as string;
                        setComponentLicenseFilters((prev) =>
                          prev.includes(value)
                            ? prev.filter((item) => item !== value)
                            : [...prev, value],
                        );
                      }}
                      onOpenChange={(nextOpen: boolean) =>
                        setIsComponentLicenseFilterOpen(nextOpen)
                      }
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsComponentLicenseFilterOpen(
                              !isComponentLicenseFilterOpen,
                            )
                          }
                          isExpanded={isComponentLicenseFilterOpen}
                        >
                          License
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        {componentLicenseOptions.map((option) => (
                          <SelectOption
                            key={option.value}
                            value={option.value}
                            isSelected={componentLicenseFilters.includes(
                              option.value,
                            )}
                            hasCheckbox
                          >
                            {option.label}
                          </SelectOption>
                        ))}
                      </SelectList>
                    </Select>
                  </ToolbarFilter>
                </ToolbarContent>
              </Toolbar>

              {filteredComponents.length > 0 ? (
                <Table aria-label="SBOM Components table" variant="compact">
                  <Thead>
                    <Tr>
                      <Th>Component</Th>
                      <Th>Version</Th>
                      <Th>Type</Th>
                      <Th>Licenses</Th>
                      <Th>Supplier</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredComponents.map((component, index) => (
                      <Tr key={component.bomRef || index}>
                        <Td dataLabel="Component">
                          <div>
                            <div
                              style={{
                                fontWeight:
                                  "var(--pf-v6-global--FontWeight--semi-bold)",
                              }}
                            >
                              {component.name}
                            </div>
                            {component.description && (
                              <div
                                style={{
                                  fontSize: "var(--pf-v6-global--FontSize--sm)",
                                  color: "var(--pf-v6-global--Color--200)",
                                  marginTop: "0.25rem",
                                }}
                              >
                                {component.description}
                              </div>
                            )}
                          </div>
                        </Td>
                        <Td dataLabel="Version">
                          <code
                            style={{
                              fontSize: "var(--pf-v6-global--FontSize--sm)",
                            }}
                          >
                            {component.version}
                          </code>
                        </Td>
                        <Td dataLabel="Type">
                          <Badge isRead variant="outline">
                            {component.type}
                          </Badge>
                        </Td>
                        <Td dataLabel="Licenses">
                          {component.licenses &&
                          component.licenses.length > 0 ? (
                            <Flex
                              spaceItems={{ default: "spaceItemsXs" }}
                              direction={{ default: "column" }}
                            >
                              {component.licenses.map((license, idx) => (
                                <FlexItem key={idx}>
                                  <Badge isRead>{license}</Badge>
                                </FlexItem>
                              ))}
                            </Flex>
                          ) : (
                            <span
                              style={{
                                color: "var(--pf-v6-global--Color--200)",
                              }}
                            >
                              —
                            </span>
                          )}
                        </Td>
                        <Td dataLabel="Supplier">
                          {component.supplier?.name || (
                            <span
                              style={{
                                color: "var(--pf-v6-global--Color--200)",
                              }}
                            >
                              —
                            </span>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Alert
                  variant="info"
                  isInline
                  title="No components found"
                  style={{ marginTop: "1rem" }}
                >
                  <p>No components match the current filter criteria.</p>
                </Alert>
              )}
            </>
          )}
        </ModalBody>
      </Modal>
    </PageSection>
  );
};
