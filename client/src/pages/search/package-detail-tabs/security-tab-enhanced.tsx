import type React from "react";
import { useContext, useState, useMemo } from "react";
import {
  PageSection,
  Alert,
  Title,
  Card,
  CardBody,
  Button,
  Flex,
  FlexItem,
  Divider,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Badge,
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
} from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ExternalLinkAltIcon,
} from "@patternfly/react-icons";
import { PackageDetailContext } from "../package-detail-context-simple";
import { SLSABadge } from "../components/slsa-badge";
import { AttestationStatusBadge } from "../components/attestation-status-badge";

export const SecurityTabEnhanced: React.FC = () => {
  const { packageData } = useContext(PackageDetailContext);

  const [expandedSections, setExpandedSections] = useState({
    attestations: true,
    sbom: true,
    sbomComponents: true,
    vulnerabilities: true,
  });

  // Vulnerabilities filter states
  const [cveIdFilter, setCveIdFilter] = useState("");
  const [severityFilters, setSeverityFilters] = useState<string[]>([]);
  const [fixableFilter, setFixableFilter] = useState<string>("");
  const [isSeverityFilterOpen, setIsSeverityFilterOpen] = useState(false);
  const [isFixableFilterOpen, setIsFixableFilterOpen] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!packageData) {
    return (
      <PageSection>
        <Alert variant="warning" title="No package data">
          Package data not available for security analysis.
        </Alert>
      </PageSection>
    );
  }

  try {
    const {
      currentVersionSbom,
      currentVersionAttestations,
      slsaLevel,
      securityAdvisories,
    } = packageData;

    // Filter options
    const severityOptions = [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "important", label: "Important" },
      { value: "critical", label: "Critical" },
    ];

    const fixableOptions = [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ];

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
          const isFixable = !!vuln.fixedVersion;
          if (fixableFilter === "yes" && !isFixable) return false;
          if (fixableFilter === "no" && isFixable) return false;
        }

        return true;
      });
    }, [
      currentVersionSbom?.summary?.vulnerabilities,
      cveIdFilter,
      severityFilters,
      fixableFilter,
    ]);

    // Filter handlers
    const onVulnFilterSelect = (
      filterType: string,
      _event: any,
      value: string | string[],
    ) => {
      if (filterType === "severity") {
        const newFilters = Array.isArray(value) ? value : [value];
        setSeverityFilters(newFilters);
      } else if (filterType === "fixable") {
        setFixableFilter(value as string);
        setIsFixableFilterOpen(false);
      }
    };

    const onDeleteVulnFilterChip = (filterType: string, value: string) => {
      if (filterType === "severity") {
        setSeverityFilters((prev) => prev.filter((f) => f !== value));
      } else if (filterType === "fixable") {
        setFixableFilter("");
      }
    };

    const onDeleteVulnFilterGroup = (filterType: string) => {
      if (filterType === "severity") {
        setSeverityFilters([]);
      } else if (filterType === "fixable") {
        setFixableFilter("");
      }
    };

    const clearAllVulnFilters = () => {
      setCveIdFilter("");
      setSeverityFilters([]);
      setFixableFilter("");
    };

    return (
      <PageSection id="security-tab-section">
        <Title headingLevel="h2" size="xl">
          Security
        </Title>
        <p style={{ marginTop: "0.5rem" }}>
          Security information for this package, including trust verification,
          attestations, and vulnerability reports when available.
        </p>

        {/* Attestations */}
        {currentVersionAttestations &&
          currentVersionAttestations.length > 0 && (
            <Card style={{ marginTop: "1rem" }}>
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
                    spaceItems={{ default: "spaceItemsSm" }}
                    alignItems={{ default: "alignItemsCenter" }}
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
                          {attestation.slsaLevel && (
                            <FlexItem>
                              <SLSABadge level={attestation.slsaLevel} />
                            </FlexItem>
                          )}
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
                              >
                                View Signature
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

        {/* SBOM */}
        {currentVersionSbom && (
          <Card style={{ marginTop: "1rem" }}>
            <CardBody>
              <Button
                variant="plain"
                onClick={() => toggleSection("sbom")}
                style={{
                  padding: 0,
                  width: "100%",
                  justifyContent: "flex-start",
                  marginBottom: expandedSections.sbom ? "1rem" : "0",
                }}
              >
                <Flex
                  spaceItems={{ default: "spaceItemsSm" }}
                  alignItems={{ default: "alignItemsCenter" }}
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
                  <FlexItem>
                    <Button
                      variant="link"
                      isInline
                      icon={<ExternalLinkAltIcon />}
                      component="a"
                      href={currentVersionSbom.url}
                      target="_blank"
                    >
                      View Raw
                    </Button>
                  </FlexItem>
                </Flex>
              </Button>

              {expandedSections.sbom && (
                <>
                  <DescriptionList isCompact isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Format</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Badge isRead variant="outline">
                          {currentVersionSbom.format} v
                          {currentVersionSbom.version}
                        </Badge>
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
                      <DescriptionListTerm>
                        Total Components
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {currentVersionSbom.components?.length ||
                          currentVersionSbom.summary?.totalComponents ||
                          0}
                      </DescriptionListDescription>
                    </DescriptionListGroup>

                    {currentVersionSbom.summary?.hasVulnerabilities !==
                      undefined && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>
                          Vulnerabilities
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          {currentVersionSbom.summary.hasVulnerabilities ? (
                            <Badge color="red">Found</Badge>
                          ) : (
                            <Badge color="green">None</Badge>
                          )}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                  </DescriptionList>

                  {currentVersionSbom.summary?.hasVulnerabilities && (
                    <Alert
                      variant="warning"
                      isInline
                      title="Vulnerabilities detected"
                      style={{ marginTop: "1rem" }}
                    >
                      This SBOM contains components with known vulnerabilities.
                      Review the full SBOM for details.
                    </Alert>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        )}

        {/* SBOM Components */}
        {currentVersionSbom?.components &&
          currentVersionSbom.components.length > 0 && (
            <Card style={{ marginTop: "1rem" }}>
              <CardBody>
                <Button
                  variant="plain"
                  onClick={() => toggleSection("sbomComponents")}
                  style={{
                    padding: 0,
                    width: "100%",
                    justifyContent: "flex-start",
                    marginBottom: expandedSections.sbomComponents
                      ? "1rem"
                      : "0",
                  }}
                >
                  <Flex
                    spaceItems={{ default: "spaceItemsSm" }}
                    alignItems={{ default: "alignItemsCenter" }}
                  >
                    <FlexItem>
                      {expandedSections.sbomComponents ? (
                        <ChevronDownIcon />
                      ) : (
                        <ChevronRightIcon />
                      )}
                    </FlexItem>
                    <FlexItem>
                      <Title headingLevel="h3" size="lg">
                        SBOM Components (
                        {currentVersionSbom?.components?.length || 0})
                      </Title>
                    </FlexItem>
                  </Flex>
                </Button>

                {expandedSections.sbomComponents && (
                  <>
                    <div style={{ marginBottom: "1rem" }}>
                      <p style={{ color: "var(--pf-v6-global--Color--200)" }}>
                        Detailed breakdown of all software components included
                        in this package.
                      </p>
                    </div>

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
                        {currentVersionSbom?.components?.map(
                          (component, index) => (
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
                                        fontSize:
                                          "var(--pf-v6-global--FontSize--sm)",
                                        color:
                                          "var(--pf-v6-global--Color--200)",
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
                                    fontSize:
                                      "var(--pf-v6-global--FontSize--sm)",
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
                          ),
                        )}
                      </Tbody>
                    </Table>
                  </>
                )}
              </CardBody>
            </Card>
          )}

        {/* Vulnerabilities */}
        {currentVersionSbom?.summary?.vulnerabilities &&
          currentVersionSbom.summary.vulnerabilities.length > 0 && (
            <Card style={{ marginTop: "1rem" }}>
              <CardBody>
                <Button
                  variant="plain"
                  onClick={() => toggleSection("vulnerabilities")}
                  style={{
                    padding: 0,
                    width: "100%",
                    justifyContent: "flex-start",
                    marginBottom: expandedSections.vulnerabilities
                      ? "1rem"
                      : "0",
                  }}
                >
                  <Flex
                    spaceItems={{ default: "spaceItemsSm" }}
                    alignItems={{ default: "alignItemsCenter" }}
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
                        Known Vulnerabilities (
                        {currentVersionSbom.summary.vulnerabilities.length})
                      </Title>
                    </FlexItem>
                  </Flex>
                </Button>

                {expandedSections.vulnerabilities && (
                  <>
                    <div style={{ marginBottom: "1rem" }}>
                      <p style={{ color: "var(--pf-v6-global--Color--200)" }}>
                        Security vulnerabilities found in package dependencies.
                        Use filters to refine results.
                      </p>
                    </div>

                    {/* Vulnerability Filters */}
                    <Toolbar
                      id="vulnerabilities-toolbar"
                      clearAllFilters={clearAllVulnFilters}
                    >
                      <ToolbarContent>
                        <ToolbarItem>
                          <SearchInput
                            aria-label="Filter by CVE ID"
                            placeholder="Filter by CVE ID..."
                            value={cveIdFilter}
                            onChange={(_, value) => setCveIdFilter(value)}
                            onClear={() => setCveIdFilter("")}
                          />
                        </ToolbarItem>
                        <ToolbarItem>
                          <ToolbarFilter
                            labels={severityFilters}
                            deleteLabel={(_, chip) =>
                              onDeleteVulnFilterChip("severity", chip as string)
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
                                    setIsSeverityFilterOpen(
                                      !isSeverityFilterOpen,
                                    )
                                  }
                                  isExpanded={isSeverityFilterOpen}
                                  style={{ minWidth: "100px" }}
                                >
                                  Severity{" "}
                                  {severityFilters.length > 0 && (
                                    <Badge isRead style={{ marginLeft: "8px" }}>
                                      {severityFilters.length}
                                    </Badge>
                                  )}
                                </MenuToggle>
                              )}
                            >
                              <SelectList>
                                {severityOptions.map((option) => (
                                  <SelectOption
                                    key={option.value}
                                    value={option.value}
                                    isSelected={severityFilters.includes(
                                      option.value,
                                    )}
                                  >
                                    {option.label}
                                  </SelectOption>
                                ))}
                              </SelectList>
                            </Select>
                          </ToolbarFilter>
                        </ToolbarItem>
                        <ToolbarItem>
                          <ToolbarFilter
                            labels={fixableFilter ? [fixableFilter] : []}
                            deleteLabel={(_, chip) =>
                              onDeleteVulnFilterChip("fixable", chip as string)
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
                                  Fixable{" "}
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

                    {/* Vulnerabilities Table */}
                    {filteredVulnerabilities.length > 0 ? (
                      <Table
                        aria-label="Vulnerabilities table"
                        variant="compact"
                      >
                        <Thead>
                          <Tr>
                            <Th>CVE ID</Th>
                            <Th>Severity</Th>
                            <Th>Component</Th>
                            <Th>CVSS Score</Th>
                            <Th>Fixed Version</Th>
                            <Th>Published</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredVulnerabilities.map((vuln, index) => (
                            <Tr key={vuln.id}>
                              <Td dataLabel="CVE ID">
                                <div>
                                  <div
                                    style={{
                                      fontWeight:
                                        "var(--pf-v6-global--FontWeight--semi-bold)",
                                    }}
                                  >
                                    {vuln.id}
                                  </div>
                                  <div
                                    style={{
                                      fontSize:
                                        "var(--pf-v6-global--FontSize--sm)",
                                      color: "var(--pf-v6-global--Color--200)",
                                      marginTop: "0.25rem",
                                    }}
                                  >
                                    {vuln.description}
                                  </div>
                                </div>
                              </Td>
                              <Td dataLabel="Severity">
                                <Badge
                                  color={
                                    vuln.severity === "critical"
                                      ? "red"
                                      : vuln.severity === "important"
                                        ? "orange"
                                        : vuln.severity === "medium"
                                          ? "blue"
                                          : "grey"
                                  }
                                >
                                  {vuln.severity.toUpperCase()}
                                </Badge>
                              </Td>
                              <Td dataLabel="Component">
                                <div>
                                  <div
                                    style={{
                                      fontWeight:
                                        "var(--pf-v6-global--FontWeight--semi-bold)",
                                    }}
                                  >
                                    {vuln.component}
                                  </div>
                                  <div
                                    style={{
                                      fontSize:
                                        "var(--pf-v6-global--FontSize--sm)",
                                    }}
                                  >
                                    v{vuln.version}
                                  </div>
                                </div>
                              </Td>
                              <Td dataLabel="CVSS Score">
                                {vuln.cvss ? (
                                  <Badge variant="outline">{vuln.cvss}</Badge>
                                ) : (
                                  "—"
                                )}
                              </Td>
                              <Td dataLabel="Fixed Version">
                                {vuln.fixedVersion ? (
                                  <Badge color="green">
                                    v{vuln.fixedVersion}
                                  </Badge>
                                ) : (
                                  <Badge color="red">Not fixed</Badge>
                                )}
                              </Td>
                              <Td dataLabel="Published">
                                {vuln.publishedDate
                                  ? new Date(
                                      vuln.publishedDate,
                                    ).toLocaleDateString()
                                  : "—"}
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
                  </>
                )}
              </CardBody>
            </Card>
          )}
      </PageSection>
    );
  } catch (error) {
    console.error("Error in SecurityTabEnhanced:", error);
    return (
      <PageSection>
        <Alert variant="danger" title="Error loading security information">
          <p>
            Error: {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </Alert>
      </PageSection>
    );
  }
};
