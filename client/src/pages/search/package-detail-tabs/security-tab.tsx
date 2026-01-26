import type React from "react";
import { useContext } from "react";
import {
  PageSection,
  Alert,
  Title,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
} from "@patternfly/react-core";
import { PackageDetailContext } from "../package-detail-context";

export const SecurityTab: React.FC = () => {
  const { packageData } = useContext(PackageDetailContext);

  if (
    !packageData ||
    !packageData.securityAdvisories ||
    packageData.securityAdvisories.length === 0
  ) {
    return (
      <PageSection>
        <Alert
          variant="success"
          isInline
          title="No known security vulnerabilities"
        >
          <p>
            No security advisories have been published for this package. This
            doesn't guarantee the package is secure, but no known
            vulnerabilities have been reported.
          </p>
        </Alert>
      </PageSection>
    );
  }

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

  return (
    <PageSection>
      <Title headingLevel="h3" size="lg" style={{ marginBottom: "1rem" }}>
        Security Advisories
      </Title>
      {packageData.securityAdvisories.map((advisory) => (
        <Alert
          key={advisory.id}
          variant={getSeverityVariant(advisory.severity)}
          isInline
          title={
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span>{advisory.title}</span>
              <Label color={getSeverityVariant(advisory.severity)}>
                {advisory.severity.toUpperCase()}
              </Label>
            </div>
          }
          style={{ marginBottom: "1rem" }}
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
              <DescriptionListTerm>Affected Versions</DescriptionListTerm>
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
    </PageSection>
  );
};
