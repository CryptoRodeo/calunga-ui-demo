import type React from "react";
import { useContext } from "react";
import {
  PageSection,
  Alert,
  Title,
  Card,
  CardBody,
} from "@patternfly/react-core";
import { PackageDetailContext } from "../package-detail-context-simple";

export const SecurityTabSimple: React.FC = () => {
  const { packageData } = useContext(PackageDetailContext);

  console.log("SecurityTabSimple render - packageData:", !!packageData);

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

    console.log("Security data check:", {
      hasSbom: !!currentVersionSbom,
      hasAttestations: !!currentVersionAttestations,
      hasSlsaLevel: !!slsaLevel,
      hasAdvisories: !!securityAdvisories,
    });

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
              <strong>Trust Score:</strong> {packageData.trustScore}/100
            </p>
            <p>
              <strong>SLSA Level:</strong> {slsaLevel || "Not available"}
            </p>
            <p>
              <strong>Has SBOM:</strong>{" "}
              {currentVersionSbom ? "✅ Yes" : "❌ No"}
            </p>
            <p>
              <strong>Has Attestations:</strong>{" "}
              {currentVersionAttestations?.length > 0 ? "✅ Yes" : "❌ No"}
            </p>
            <p>
              <strong>Security Advisories:</strong>{" "}
              {securityAdvisories?.length || 0}
            </p>

            {currentVersionSbom && (
              <div style={{ marginTop: "1rem" }}>
                <p>
                  <strong>SBOM Components:</strong>{" "}
                  {currentVersionSbom.components?.length ||
                    currentVersionSbom.summary?.totalComponents ||
                    0}
                </p>
                <p>
                  <strong>Vulnerabilities:</strong>{" "}
                  {currentVersionSbom.summary?.vulnerabilities?.length || 0}
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </PageSection>
    );
  } catch (error) {
    console.error("Error in SecurityTabSimple:", error);
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
