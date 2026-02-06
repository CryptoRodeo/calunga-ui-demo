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
  Card,
  CardBody,
  Flex,
  FlexItem,
  Button,
  Badge,
  Divider,
  Modal,
  ModalVariant,
  ModalHeader,
  ModalBody,
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
  ExternalLinkAltIcon,
  DownloadIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@patternfly/react-icons";
import { PackageDetailContext } from "../package-detail-context-simple";
import { SLSABadge } from "../components/slsa-badge";
import { AttestationStatusBadge } from "../components/attestation-status-badge";

export const SecurityTabModal: React.FC = () => {
  const { packageData } = useContext(PackageDetailContext);

  const [expandedSections, setExpandedSections] = useState({
    attestations: true,
    sbom: true,
    vulnerabilities: true,
  });

  const [isSbomComponentsModalOpen, setIsSbomComponentsModalOpen] =
    useState(false);

  // Vulnerabilities filter states
  const [cveIdFilter, setCveIdFilter] = useState("");
  const [severityFilters, setSeverityFilters] = useState<string[]>([]);
  const [fixableFilter, setFixableFilter] = useState<string>("");
  const [isSeverityFilterOpen, setIsSeverityFilterOpen] = useState(false);
  const [isFixableFilterOpen, setIsFixableFilterOpen] = useState(false);

  // Component filters for modal
  const [componentNameFilter, setComponentNameFilter] = useState("");
  const [componentTypeFilter, setComponentTypeFilter] = useState("");
  const [componentLicenseFilter, setComponentLicenseFilter] = useState("");

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

  const {
    currentVersionSbom,
    currentVersionAttestations,
    slsaLevel,
    securityAdvisories,
  } = packageData;

  // Filter options
  const severityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "Important", label: "Important" },
    { value: "Critical", label: "Critical" },
  ];

  const fixableOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];

  // Filter vulnerabilities
  const filteredVulnerabilities = useMemo(() => {
    if (!currentVersionSbom?.summary?.vulnerabilities) return [];

    return currentVersionSbom.summary.vulnerabilities.filter((vuln) => {
      // CVE ID filter
      if (
        cveIdFilter &&
        !vuln.cve.toLowerCase().includes(cveIdFilter.toLowerCase())
      ) {
        return false;
      }

      // Severity filter
      if (
        severityFilters.length > 0 &&
        !severityFilters.includes(vuln.severity)
      ) {
        return false;
      }

      // Fixable filter
      if (fixableFilter) {
        const isFixable = !!vuln.fixedVersion;
        const matchesFilter =
          (fixableFilter === "Yes" && isFixable) ||
          (fixableFilter === "No" && !isFixable);
        if (!matchesFilter) {
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

  // Filter components for modal
  const filteredComponents = useMemo(() => {
    if (!currentVersionSbom?.components) return [];

    return currentVersionSbom.components.filter((component) => {
      if (
        componentNameFilter &&
        !component.name
          .toLowerCase()
          .includes(componentNameFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        componentTypeFilter &&
        !component.type
          .toLowerCase()
          .includes(componentTypeFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        componentLicenseFilter &&
        !component.licenses?.some((license) =>
          license.toLowerCase().includes(componentLicenseFilter.toLowerCase()),
        )
      ) {
        return false;
      }
      return true;
    });
  }, [
    currentVersionSbom?.components,
    componentNameFilter,
    componentTypeFilter,
    componentLicenseFilter,
  ]);

  const clearAllFilters = () => {
    setCveIdFilter("");
    setSeverityFilters([]);
    setFixableFilter("");
  };

  const clearAllComponentFilters = () => {
    setComponentNameFilter("");
    setComponentTypeFilter("");
    setComponentLicenseFilter("");
  };

  return (
    <PageSection>
      <Title headingLevel="h2" size="xl">
        Security
      </Title>
      <p style={{ marginTop: "0.5rem" }}>
        Security information for {packageData.name} v{packageData.version}
      </p>

      {/* Security Overview */}
      <Card style={{ marginTop: "1.5rem" }}>
        <CardBody>
          <Title headingLevel="h3" size="lg" style={{ marginBottom: "1rem" }}>
            Security Overview
          </Title>
          <DescriptionList isHorizontal>
            <DescriptionListGroup>
              <DescriptionListTerm>Trust Score</DescriptionListTerm>
              <DescriptionListDescription>
                <span
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "var(--pf-v6-global--FontWeight--semi-bold)",
                  }}
                >
                  99/100
                </span>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>SLSA Level</DescriptionListTerm>
              <DescriptionListDescription>
                <SLSABadge level={slsaLevel || 3} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Has SBOM</DescriptionListTerm>
              <DescriptionListDescription>
                <Badge
                  variant="outline"
                  style={{ color: "var(--pf-v6-global--success-color--100)" }}
                >
                  ✅ Yes
                </Badge>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Has Attestations</DescriptionListTerm>
              <DescriptionListDescription>
                <Badge
                  variant="outline"
                  style={{ color: "var(--pf-v6-global--success-color--100)" }}
                >
                  ✅ Yes
                </Badge>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Security Advisories</DescriptionListTerm>
              <DescriptionListDescription>
                {securityAdvisories || 0}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>SBOM Components</DescriptionListTerm>
              <DescriptionListDescription>
                {currentVersionSbom?.components?.length ||
                  currentVersionSbom?.summary?.totalComponents ||
                  0}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Vulnerabilities</DescriptionListTerm>
              <DescriptionListDescription>
                {currentVersionSbom?.summary?.vulnerabilities?.length || 0}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </CardBody>
      </Card>

      {/* Attestation Details */}
      {currentVersionAttestations && (
        <Card style={{ marginTop: "1.5rem" }}>
          <CardBody>
            <Flex
              direction={{ default: "row" }}
              justifyContent={{ default: "justifyContentSpaceBetween" }}
              alignItems={{ default: "alignItemsCenter" }}
            >
              <FlexItem>
                <Title headingLevel="h3" size="lg">
                  Attestation Details
                </Title>
              </FlexItem>
              <FlexItem>
                <Button
                  variant="plain"
                  aria-expanded={expandedSections.attestations}
                  onClick={() => toggleSection("attestations")}
                  aria-label="Toggle attestation details"
                >
                  {expandedSections.attestations ? (
                    <ChevronDownIcon />
                  ) : (
                    <ChevronRightIcon />
                  )}
                </Button>
              </FlexItem>
            </Flex>

            {expandedSections.attestations && (
              <div style={{ marginTop: "1rem" }}>
                <DescriptionList isHorizontal>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Attestation Type</DescriptionListTerm>
                    <DescriptionListDescription>
                      {currentVersionAttestations.attestationType ||
                        "Provenance Attestation"}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>
                      Verification Status
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                      <AttestationStatusBadge
                        status={currentVersionAttestations.verificationStatus}
                      />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Platform</DescriptionListTerm>
                    <DescriptionListDescription>
                      {currentVersionAttestations.buildPlatform ||
                        "Red Hat Konflux CI/CD Platform"}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Certificate</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Button
                        variant="link"
                        isInline
                        component="a"
                        href="#"
                        target="_blank"
                      >
                        View Certificate{" "}
                        <ExternalLinkAltIcon
                          style={{ marginLeft: "0.25rem" }}
                        />
                      </Button>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Signature</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Button
                        variant="link"
                        isInline
                        component="a"
                        href="#"
                        target="_blank"
                      >
                        View Signature{" "}
                        <ExternalLinkAltIcon
                          style={{ marginLeft: "0.25rem" }}
                        />
                      </Button>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* SBOM Card with Modal Link */}
      {currentVersionSbom && (
        <Card style={{ marginTop: "1.5rem" }}>
          <CardBody>
            <Flex
              direction={{ default: "row" }}
              justifyContent={{ default: "justifyContentSpaceBetween" }}
              alignItems={{ default: "alignItemsCenter" }}
            >
              <FlexItem>
                <Title headingLevel="h3" size="lg">
                  Software Bill of Materials (SBOM)
                </Title>
              </FlexItem>
              <FlexItem>
                <Flex spaceItems={{ default: "spaceItemsMd" }}>
                  <FlexItem>
                    <Button variant="link" isInline>
                      <DownloadIcon style={{ marginRight: "0.5rem" }} />
                      Download
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button variant="link" isInline>
                      View Raw{" "}
                      <ExternalLinkAltIcon style={{ marginLeft: "0.25rem" }} />
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="plain"
                      aria-expanded={expandedSections.sbom}
                      onClick={() => toggleSection("sbom")}
                      aria-label="Toggle SBOM details"
                    >
                      {expandedSections.sbom ? (
                        <ChevronDownIcon />
                      ) : (
                        <ChevronRightIcon />
                      )}
                    </Button>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>

            {expandedSections.sbom && (
              <div style={{ marginTop: "1rem" }}>
                <DescriptionList isHorizontal>
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
                    <DescriptionListTerm>Serial Number</DescriptionListTerm>
                    <DescriptionListDescription>
                      <code
                        style={{
                          fontSize: "var(--pf-v6-global--FontSize--sm)",
                        }}
                      >
                        {currentVersionSbom.serialNumber ||
                          "CycloneDXRef-DOCUMENT"}
                      </code>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Generated At</DescriptionListTerm>
                    <DescriptionListDescription>
                      {currentVersionSbom.generatedAt
                        ? new Date(
                            currentVersionSbom.generatedAt,
                          ).toLocaleDateString()
                        : "January 15, 2026"}
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
                          variant="outline"
                          style={{
                            color: "var(--pf-v6-global--warning-color--100)",
                          }}
                        >
                          {currentVersionSbom.summary.vulnerabilities?.length ||
                            0}{" "}
                          found
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          style={{
                            color: "var(--pf-v6-global--info-color--100)",
                          }}
                        >
                          None
                        </Badge>
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
                    <p>
                      This SBOM contains components with known security
                      vulnerabilities. Review the vulnerabilities section below
                      for details.
                    </p>
                  </Alert>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Vulnerabilities */}
      {currentVersionSbom?.summary?.vulnerabilities &&
        currentVersionSbom.summary.vulnerabilities.length > 0 && (
          <Card style={{ marginTop: "1.5rem" }}>
            <CardBody>
              <Flex
                direction={{ default: "row" }}
                justifyContent={{ default: "justifyContentSpaceBetween" }}
                alignItems={{ default: "alignItemsCenter" }}
              >
                <FlexItem>
                  <Title headingLevel="h3" size="lg">
                    Vulnerabilities
                  </Title>
                </FlexItem>
                <FlexItem>
                  <Button
                    variant="plain"
                    aria-expanded={expandedSections.vulnerabilities}
                    onClick={() => toggleSection("vulnerabilities")}
                    aria-label="Toggle vulnerabilities"
                  >
                    {expandedSections.vulnerabilities ? (
                      <ChevronDownIcon />
                    ) : (
                      <ChevronRightIcon />
                    )}
                  </Button>
                </FlexItem>
              </Flex>

              {expandedSections.vulnerabilities && (
                <div style={{ marginTop: "1rem" }}>
                  {/* Vulnerabilities Filter Toolbar */}
                  <Toolbar
                    id="vulnerabilities-toolbar"
                    clearAllFilters={clearAllFilters}
                    style={{ marginBottom: "1rem" }}
                  >
                    <ToolbarContent>
                      <ToolbarItem>
                        <SearchInput
                          placeholder="Filter by CVE ID..."
                          value={cveIdFilter}
                          onChange={(_, value) => setCveIdFilter(value)}
                          onClear={() => setCveIdFilter("")}
                        />
                      </ToolbarItem>
                      <ToolbarFilter
                        chips={severityFilters}
                        deleteChip={(_, chip) =>
                          setSeverityFilters((prev) =>
                            prev.filter((s) => s !== chip),
                          )
                        }
                        deleteChipGroup={() => setSeverityFilters([])}
                        categoryName="Severity"
                      >
                        <Select
                          role="menu"
                          aria-label="Severity filter"
                          isOpen={isSeverityFilterOpen}
                          selected={severityFilters}
                          onSelect={(_, selection) => {
                            const value = selection as string;
                            setSeverityFilters((prev) =>
                              prev.includes(value)
                                ? prev.filter((item) => item !== value)
                                : [...prev, value],
                            );
                          }}
                          onOpenChange={(nextOpen: boolean) =>
                            setIsSeverityFilterOpen(nextOpen)
                          }
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle
                              ref={toggleRef}
                              onClick={() =>
                                setIsSeverityFilterOpen(!isSeverityFilterOpen)
                              }
                              isExpanded={isSeverityFilterOpen}
                            >
                              Severity
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
                      <ToolbarFilter
                        chips={fixableFilter ? [fixableFilter] : []}
                        deleteChip={() => setFixableFilter("")}
                        categoryName="Fixable"
                      >
                        <Select
                          role="menu"
                          aria-label="Fixable filter"
                          isOpen={isFixableFilterOpen}
                          selected={fixableFilter}
                          onSelect={(_, selection) => {
                            const value = selection as string;
                            setFixableFilter(
                              value === fixableFilter ? "" : value,
                            );
                            setIsFixableFilterOpen(false);
                          }}
                          onOpenChange={(nextOpen: boolean) =>
                            setIsFixableFilterOpen(nextOpen)
                          }
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle
                              ref={toggleRef}
                              onClick={() =>
                                setIsFixableFilterOpen(!isFixableFilterOpen)
                              }
                              isExpanded={isFixableFilterOpen}
                            >
                              Fixable
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
                    </ToolbarContent>
                  </Toolbar>

                  {filteredVulnerabilities.length > 0 ? (
                    <Table aria-label="Vulnerabilities table" variant="compact">
                      <Thead>
                        <Tr>
                          <Th>CVE ID</Th>
                          <Th>Severity</Th>
                          <Th>Component</Th>
                          <Th>Current Version</Th>
                          <Th>Fixed Version</Th>
                          <Th>CVSS Score</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredVulnerabilities.map((vuln, index) => (
                          <Tr key={vuln.cve || index}>
                            <Td dataLabel="CVE ID">
                              <Button
                                variant="link"
                                isInline
                                component="a"
                                href={`https://nvd.nist.gov/vuln/detail/${vuln.cve}`}
                                target="_blank"
                              >
                                {vuln.cve}{" "}
                                <ExternalLinkAltIcon
                                  style={{ marginLeft: "0.25rem" }}
                                />
                              </Button>
                            </Td>
                            <Td dataLabel="Severity">
                              <Badge
                                variant={
                                  vuln.severity === "Critical"
                                    ? "red"
                                    : vuln.severity === "Important"
                                      ? "orange"
                                      : vuln.severity === "Medium"
                                        ? "gold"
                                        : "blue"
                                }
                              >
                                {vuln.severity}
                              </Badge>
                            </Td>
                            <Td dataLabel="Component">{vuln.component}</Td>
                            <Td dataLabel="Current Version">
                              <code
                                style={{
                                  fontSize: "var(--pf-v6-global--FontSize--sm)",
                                }}
                              >
                                {vuln.currentVersion}
                              </code>
                            </Td>
                            <Td dataLabel="Fixed Version">
                              {vuln.fixedVersion ? (
                                <code
                                  style={{
                                    fontSize:
                                      "var(--pf-v6-global--FontSize--sm)",
                                  }}
                                >
                                  {vuln.fixedVersion}
                                </code>
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
                            <Td dataLabel="CVSS Score">
                              {vuln.cvssScore ? (
                                <Badge variant="outline">
                                  {vuln.cvssScore}
                                </Badge>
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
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Alert
                      variant="info"
                      isInline
                      title="No vulnerabilities found"
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

      {/* No Vulnerabilities Message */}
      {currentVersionSbom?.summary?.hasVulnerabilities === false && (
        <Card style={{ marginTop: "1.5rem" }}>
          <CardBody>
            <Title headingLevel="h3" size="lg" style={{ marginBottom: "1rem" }}>
              Vulnerabilities
            </Title>
            <Alert
              variant="success"
              isInline
              title="No vulnerabilities detected"
            >
              <p>
                This package and its dependencies have no known security
                vulnerabilities. The SBOM was scanned against current
                vulnerability databases.
              </p>
            </Alert>
          </CardBody>
        </Card>
      )}

      {/* SBOM Components Modal */}
      <Modal
        variant={ModalVariant.large}
        isOpen={isSbomComponentsModalOpen}
        onClose={() => setIsSbomComponentsModalOpen(false)}
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
              <Toolbar style={{ marginBottom: "1rem" }}>
                <ToolbarContent>
                  <ToolbarItem>
                    <SearchInput
                      placeholder="Filter by component name..."
                      value={componentNameFilter}
                      onChange={(_, value) => setComponentNameFilter(value)}
                      onClear={() => setComponentNameFilter("")}
                    />
                  </ToolbarItem>
                  <ToolbarItem>
                    <SearchInput
                      placeholder="Filter by type..."
                      value={componentTypeFilter}
                      onChange={(_, value) => setComponentTypeFilter(value)}
                      onClear={() => setComponentTypeFilter("")}
                    />
                  </ToolbarItem>
                  <ToolbarItem>
                    <SearchInput
                      placeholder="Filter by license..."
                      value={componentLicenseFilter}
                      onChange={(_, value) => setComponentLicenseFilter(value)}
                      onClear={() => setComponentLicenseFilter("")}
                    />
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>

              <Table aria-label="SBOM Components table" variant="compact">
                <Thead>
                  <Tr>
                    <Th>Component</Th>
                    <Th>Version</Th>
                    <Th>Type</Th>
                    <Th>Licenses</Th>
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
                        {component.licenses && component.licenses.length > 0 ? (
                          <Flex spaceItems={{ default: "spaceItemsXs" }}>
                            {component.licenses.map((license, idx) => (
                              <FlexItem key={idx}>
                                <Badge isRead>{license}</Badge>
                              </FlexItem>
                            ))}
                          </Flex>
                        ) : (
                          <span
                            style={{ color: "var(--pf-v6-global--Color--200)" }}
                          >
                            —
                          </span>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {filteredComponents.length === 0 && (
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
