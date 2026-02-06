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
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Flex,
  FlexItem,
} from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import {
  ExternalLinkAltIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@patternfly/react-icons";
import { PackageDetailContext } from "../package-detail-context-simple";
import { AttestationStatusBadge } from "../components/attestation-status-badge";

export const SecurityTabWithModal: React.FC = () => {
  const { packageData } = useContext(PackageDetailContext);
  const [isSbomComponentsModalOpen, setIsSbomComponentsModalOpen] =
    useState(false);
  const [expandedSections, setExpandedSections] = useState({
    attestations: true,
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
        Security information for {packageData.name} v{packageData.version}
      </p>

      <Card style={{ marginTop: "1.5rem" }}>
        <CardBody>
          <Title headingLevel="h3" size="lg">
            Security Overview
          </Title>
          <p>
            <strong>Trust Score:</strong> 99/100
          </p>
          <p>
            <strong>SLSA Level:</strong> {slsaLevel || 3}
          </p>
          <p>
            <strong>Has SBOM:</strong> {currentVersionSbom ? "✅ Yes" : "❌ No"}
          </p>
          <p>
            <strong>Has Attestations:</strong>{" "}
            {currentVersionAttestations ? "✅ Yes" : "❌ No"}
          </p>
          <p>
            <strong>Security Advisories:</strong> {securityAdvisories || 0}
          </p>

          {currentVersionSbom && (
            <div style={{ marginTop: "1rem" }}>
              <p>
                <strong>SBOM Components:</strong>{" "}
                {currentVersionSbom.components &&
                currentVersionSbom.components.length > 0 ? (
                  <Button
                    variant="link"
                    isInline
                    onClick={() => setIsSbomComponentsModalOpen(true)}
                    style={{ padding: 0, fontSize: "inherit" }}
                  >
                    {currentVersionSbom.components.length} (view components)
                  </Button>
                ) : (
                  currentVersionSbom.summary?.totalComponents || 0
                )}
              </p>
              <p>
                <strong>Vulnerabilities:</strong>{" "}
                {currentVersionSbom.summary?.vulnerabilities?.length || 0}
              </p>
            </div>
          )}
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
