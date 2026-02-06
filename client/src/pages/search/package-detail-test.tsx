import type React from "react";
import { useParams } from "react-router-dom";
import { PageSection, Title, Alert } from "@patternfly/react-core";
import dummyData from "./dummy-data.json";

export const PackageDetailTest: React.FC = () => {
  const { packageName, version } = useParams<{
    packageName: string;
    version: string;
  }>();

  // Force console output
  console.log("=== PackageDetailTest START ===");
  console.log("URL params:", { packageName, version });
  console.log("Current URL:", window.location.href);
  console.log("Dummy data length:", dummyData.length);

  // Test if this component even renders
  const renderTime = new Date().toISOString();
  console.log("Render time:", renderTime);

  try {
    const packages = dummyData;
    console.log(
      "First few packages:",
      packages.slice(0, 3).map((p) => ({ name: p.name, version: p.version })),
    );

    const packageData = packages.find(
      (pkg) => pkg.name === packageName && pkg.version === version,
    );
    console.log("Package search result:", {
      searchName: packageName,
      searchVersion: version,
      found: !!packageData,
      foundName: packageData?.name,
      foundVersion: packageData?.version,
    });

    // Always render something
    return (
      <PageSection style={{ backgroundColor: "#f0f8ff", padding: "2rem" }}>
        <Alert variant="info" title="Debug Info">
          <p>
            <strong>URL:</strong> {window.location.href}
          </p>
          <p>
            <strong>Package Name:</strong> {packageName || "undefined"}
          </p>
          <p>
            <strong>Version:</strong> {version || "undefined"}
          </p>
          <p>
            <strong>Render Time:</strong> {renderTime}
          </p>
          <p>
            <strong>Data Length:</strong> {dummyData.length}
          </p>
          <p>
            <strong>Package Found:</strong> {packageData ? "YES" : "NO"}
          </p>
        </Alert>

        {packageData ? (
          <div style={{ marginTop: "1rem" }}>
            <Title headingLevel="h1" size="2xl">
              ✅ SUCCESS: {packageData.name} v{packageData.version}
            </Title>
            <p>Description: {packageData.description}</p>
            <p>Downloads: {packageData.downloads}</p>
            <p>Author: {packageData.author}</p>
            <p>License: {packageData.license}</p>
          </div>
        ) : (
          <div style={{ marginTop: "1rem" }}>
            <Title headingLevel="h2" size="xl">
              ❌ Package Not Found
            </Title>
            <p>
              Searched for: {packageName} v{version}
            </p>
          </div>
        )}
      </PageSection>
    );
  } catch (error) {
    console.error("=== ERROR in PackageDetailTest ===", error);
    return (
      <PageSection style={{ backgroundColor: "#ffe6e6", padding: "2rem" }}>
        <Alert variant="danger" title="Component Error">
          <p>
            <strong>Error:</strong>{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <p>
            <strong>Stack:</strong>{" "}
            {error instanceof Error ? error.stack : "No stack trace"}
          </p>
          <p>
            <strong>URL:</strong> {window.location.href}
          </p>
        </Alert>
      </PageSection>
    );
  }
};
