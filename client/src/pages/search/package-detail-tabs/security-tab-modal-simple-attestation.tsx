import type React from "react";
import { useContext, useState } from "react";
import {
  PageSection,
  Alert,
  Title,
  Card,
  CardBody,
  Button,
  Modal,
  ModalVariant,
  ModalHeader,
  ModalBody,
  Badge,
  Flex,
  FlexItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import {
  ExternalLinkAltIcon,
  DownloadIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@patternfly/react-icons";
import { PackageDetailContext } from "../package-detail-context-simple";

export const SecurityTabModalSimpleAttestation: React.FC = () => {
  const { packageData } = useContext(PackageDetailContext);
  const [isSbomComponentsModalOpen, setIsSbomComponentsModalOpen] =
    useState(false);
  const [expandedSections, setExpandedSections] = useState({
    attestations: true,
    sbom: true,
  });

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

  return (
    <PageSection>
      <Title headingLevel="h2" size="xl">
        Security
      </Title>
      <p style={{ marginTop: "0.5rem" }}>
        Security information for this package, including trust verification,
        attestations, and vulnerability reports when available.
      </p>

      <Card style={{ marginTop: "1rem" }}>
        <CardBody>
          <Title headingLevel="h3" size="lg" style={{ marginBottom: "1rem" }}>
            Security Overview
          </Title>
          <DescriptionList isCompact isHorizontal>
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
                {slsaLevel || 3}
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

      {/* Attestation Details - Original Style */}
      {currentVersionAttestations && (
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

            {expandedSections.attestations && (
              <div>
                <div style={{ marginBottom: "0.75rem" }}>
                  <Title
                    headingLevel="h4"
                    size="md"
                    style={{ marginBottom: "0.5rem" }}
                  >
                    Provenance Attestation
                  </Title>
                  <Flex spaceItems={{ default: "spaceItemsSm" }}>
                    <FlexItem>
                      <Badge color="green">Red Hat - Verified</Badge>
                    </FlexItem>
                  </Flex>
                </div>

                <DescriptionList isCompact isHorizontal>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Verified</DescriptionListTerm>
                    <DescriptionListDescription>
                      {new Date().toLocaleString()}
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
                    <DescriptionListTerm>Subject</DescriptionListTerm>
                    <DescriptionListDescription>
                      {currentVersionAttestations.subject ||
                        `${packageData.name}@${packageData.version}`}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Certificate</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Button
                        variant="link"
                        isInline
                        isSmall
                        icon={<ExternalLinkAltIcon />}
                        component="a"
                        href="#"
                        target="_blank"
                        style={{ padding: 0 }}
                      >
                        View
                      </Button>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Signature</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Button
                        variant="link"
                        isInline
                        isSmall
                        icon={<ExternalLinkAltIcon />}
                        component="a"
                        href="#"
                        target="_blank"
                        style={{ padding: 0 }}
                      >
                        View
                      </Button>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* SBOM Details - Original Style */}
      {currentVersionSbom && (
        <Card style={{ marginTop: "1rem" }}>
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
                </Flex>
              </FlexItem>
            </Flex>

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
                        <Badge color="red">
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
                    Review the full SBOM for details.
                  </Alert>
                )}
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Simple SBOM Components Modal */}
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
          {currentVersionSbom?.components &&
          currentVersionSbom.components.length > 0 ? (
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
                {currentVersionSbom.components.map((component, index) => (
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
                    <Td dataLabel="Type">{component.type}</Td>
                    <Td dataLabel="Licenses">
                      {component.licenses && component.licenses.length > 0 ? (
                        component.licenses.join(", ")
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
          ) : (
            <Alert variant="info" isInline title="No components found">
              <p>No SBOM components available for this package.</p>
            </Alert>
          )}
        </ModalBody>
      </Modal>
    </PageSection>
  );
};
