import type React from "react";
import { useContext } from "react";
import { PageSection, Title } from "@patternfly/react-core";
import { PackageDetailContext } from "../package-detail-context";

export const OverviewTab: React.FC = () => {
  const { packageData } = useContext(PackageDetailContext);

  if (!packageData) {
    return null;
  }

  return (
    <PageSection>
      <Title headingLevel="h2" size="xl">
        About
      </Title>
      <p style={{ marginTop: "0.5rem" }}>
        {packageData.fullDescription || packageData.description}
      </p>

      <Title headingLevel="h2" size="xl" style={{ marginTop: "2rem" }}>
        Installation
      </Title>
      <pre
        style={{
          backgroundColor: "var(--pf-v6-global--BackgroundColor--200)",
          padding: "1rem",
          borderRadius: "4px",
          marginTop: "0.5rem",
        }}
      >
        pip install {packageData.name}
      </pre>

      <Title headingLevel="h2" size="xl" style={{ marginTop: "2rem" }}>
        Basic Usage
      </Title>
      <pre
        style={{
          backgroundColor: "var(--pf-v6-global--BackgroundColor--200)",
          padding: "1rem",
          borderRadius: "4px",
          marginTop: "0.5rem",
        }}
      >
        {`import ${packageData.name}\n\n# Use ${packageData.name} in your project`}
      </pre>
    </PageSection>
  );
};
