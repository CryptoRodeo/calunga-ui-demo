import type React from "react";
import { useContext, useState } from "react";
import {
  PageSection,
  Alert,
  Title,
  Card,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Flex,
  FlexItem,
  Button,
  Badge,
} from "@patternfly/react-core";
import {
  ExternalLinkAltIcon,
  DownloadIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@patternfly/react-icons";
import { PackageDetailContext } from "../package-detail-context-simple";
import { SLSABadge } from "../components/slsa-badge";
import { AttestationStatusBadge } from "../components/attestation-status-badge";

export const SecurityTabStep2: React.FC = () => {
  const { packageData } = useContext(PackageDetailContext);

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
        Security information for {packageData.name} v{packageData.version}
      </p>

      {/* Security Overview */}
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
          <p>
            <strong>SBOM Components:</strong>{" "}
            {currentVersionSbom?.components?.length ||
              currentVersionSbom?.summary?.totalComponents ||
              0}
          </p>
          <p>
            <strong>Vulnerabilities:</strong>{" "}
            {currentVersionSbom?.summary?.vulnerabilities?.length || 0}
          </p>
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

      {/* SBOM Details */}
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
                      {currentVersionSbom.components?.length ||
                        currentVersionSbom.summary?.totalComponents ||
                        0}{" "}
                      (view components)
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
                      {currentVersionSbom.summary?.licensesFound?.length ? (
                        currentVersionSbom.summary.licensesFound.map(
                          (license) => (
                            <Badge
                              key={license}
                              isRead
                              variant="outline"
                              style={{ marginRight: "0.5rem" }}
                            >
                              {license}
                            </Badge>
                          ),
                        )
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
    </PageSection>
  );
};
