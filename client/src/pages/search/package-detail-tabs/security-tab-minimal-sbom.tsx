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
} from "@patternfly/react-core";
import {
  ExternalLinkAltIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@patternfly/react-icons";
import { PackageDetailContext } from "../package-detail-context-simple";
import { AttestationStatusBadge } from "../components/attestation-status-badge";

export const SecurityTabMinimalSbom: React.FC = () => {
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

      {/* Minimal SBOM Card */}
      {currentVersionSbom && (
        <Card style={{ marginTop: "1.5rem" }}>
          <CardBody>
            <Title headingLevel="h3" size="lg">
              Software Bill of Materials (SBOM)
            </Title>
            <div style={{ marginTop: "1rem" }}>
              <p>
                <strong>Format:</strong> {currentVersionSbom.format} v
                {currentVersionSbom.version}
              </p>
              <p>
                <strong>Generation Tool:</strong> konflux-sbom-generator v0.2.4
              </p>
              <p>
                <strong>Total Components:</strong>{" "}
                {currentVersionSbom.components?.length ||
                  currentVersionSbom.summary?.totalComponents ||
                  0}{" "}
                (view components)
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </PageSection>
  );
};
