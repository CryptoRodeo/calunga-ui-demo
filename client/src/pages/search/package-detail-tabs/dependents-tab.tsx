import type React from "react";
import { useContext } from "react";
import { PageSection, Title } from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { PackageDetailContext } from "../package-detail-context";

export const DependentsTab: React.FC = () => {
  const { packageData } = useContext(PackageDetailContext);

  if (
    !packageData ||
    !packageData.dependents ||
    packageData.dependents.length === 0
  ) {
    return (
      <PageSection>
        <Title headingLevel="h3" size="lg">
          No dependents found
        </Title>
        <p>No packages currently depend on this package.</p>
      </PageSection>
    );
  }

  const formatDownloads = (downloads: number): string => {
    if (downloads >= 1000000) {
      return `${(downloads / 1000000).toFixed(1)}M`;
    }
    if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(0)}K`;
    }
    return downloads.toString();
  };

  return (
    <PageSection>
      <Title headingLevel="h3" size="lg" style={{ marginBottom: "1rem" }}>
        Packages that depend on {packageData.name}
      </Title>
      <Table aria-label="Dependents table" variant="compact">
        <Thead>
          <Tr>
            <Th>Package Name</Th>
            <Th>Version</Th>
            <Th>Downloads</Th>
          </Tr>
        </Thead>
        <Tbody>
          {packageData.dependents.map((dep) => (
            <Tr key={dep.name}>
              <Td dataLabel="Package Name">
                <strong>{dep.name}</strong>
              </Td>
              <Td dataLabel="Version">{dep.version}</Td>
              <Td dataLabel="Downloads">{formatDownloads(dep.downloads)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </PageSection>
  );
};
