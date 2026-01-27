import type React from "react";
import { useContext, useState } from "react";
import {
  PageSection,
  Badge,
  Button,
  Flex,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from "@patternfly/react-core";
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  ExpandableRowContent,
} from "@patternfly/react-table";
import { DownloadIcon, EyeIcon } from "@patternfly/react-icons";
import { PackageDetailContext } from "../package-detail-context";
import { SBOMViewer } from "../components/sbom-viewer";
import { AttestationStatusBadge } from "../components/attestation-status-badge";
import type { SBOM } from "../search-context";

export const VersionsTab: React.FC = () => {
  const { packageData } = useContext(PackageDetailContext);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(
    new Set(),
  );
  const [sbomViewerOpen, setSbomViewerOpen] = useState(false);
  const [selectedSbom, setSelectedSbom] = useState<SBOM | null>(null);

  if (!packageData || !packageData.versions) {
    return (
      <PageSection>
        <p>No version information available.</p>
      </PageSection>
    );
  }

  const toggleExpanded = (version: string) => {
    setExpandedVersions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(version)) {
        newSet.delete(version);
      } else {
        newSet.add(version);
      }
      return newSet;
    });
  };

  const handlePreviewSbom = (sbom: SBOM) => {
    setSelectedSbom(sbom);
    setSbomViewerOpen(true);
  };

  const handleCloseSbomViewer = () => {
    setSbomViewerOpen(false);
    setSelectedSbom(null);
  };

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
      <Table aria-label="Versions table" variant="compact">
        <Thead>
          <Tr>
            <Th />
            <Th>Version</Th>
            <Th>Release Date</Th>
            <Th>Downloads</Th>
            <Th>SBOM</Th>
            <Th>Attestations</Th>
          </Tr>
        </Thead>
        {packageData.versions.map((ver, idx) => {
          const isExpanded = expandedVersions.has(ver.version);
          return (
            <Tbody key={ver.version} isExpanded={isExpanded}>
              <Tr>
                <Td
                  expand={{
                    rowIndex: idx,
                    isExpanded,
                    onToggle: () => toggleExpanded(ver.version),
                  }}
                />
                <Td dataLabel="Version">
                  <strong>{ver.version}</strong>
                </Td>
                <Td dataLabel="Release Date">{ver.releaseDate}</Td>
                <Td dataLabel="Downloads">{formatDownloads(ver.downloads)}</Td>
                <Td dataLabel="SBOM">
                  {ver.sbom ? (
                    <Flex spaceItems={{ default: "spaceItemsSm" }}>
                      <Badge isRead>
                        {ver.sbom.format}{" "}
                        {ver.sbom.version && `v${ver.sbom.version}`}
                      </Badge>
                      <Button
                        variant="link"
                        isSmall
                        icon={<EyeIcon />}
                        onClick={() => ver.sbom && handlePreviewSbom(ver.sbom)}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="link"
                        isSmall
                        icon={<DownloadIcon />}
                        component="a"
                        href={ver.sbom.url}
                        download
                      >
                        Download
                      </Button>
                    </Flex>
                  ) : (
                    <span style={{ color: "var(--pf-v6-global--Color--200)" }}>
                      N/A
                    </span>
                  )}
                </Td>
                <Td dataLabel="Attestations">
                  {ver.attestations && ver.attestations.length > 0 ? (
                    <Badge>{ver.attestations.length}</Badge>
                  ) : (
                    <span style={{ color: "var(--pf-v6-global--Color--200)" }}>
                      None
                    </span>
                  )}
                </Td>
              </Tr>
              <Tr isExpanded={isExpanded}>
                <Td />
                <Td colSpan={5}>
                  <ExpandableRowContent>
                    {ver.sbom && (
                      <div style={{ marginBottom: "1rem" }}>
                        <strong>SBOM Details:</strong>
                        <DescriptionList isCompact isHorizontal>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Format</DescriptionListTerm>
                            <DescriptionListDescription>
                              {ver.sbom.format}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>URL</DescriptionListTerm>
                            <DescriptionListDescription>
                              <a href={ver.sbom.url}>{ver.sbom.url}</a>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>
                              Generated At
                            </DescriptionListTerm>
                            <DescriptionListDescription>
                              {new Date(ver.sbom.generatedAt).toLocaleString()}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      </div>
                    )}
                    {ver.attestations && ver.attestations.length > 0 && (
                      <div>
                        <strong>Attestations:</strong>
                        <Flex
                          spaceItems={{ default: "spaceItemsSm" }}
                          style={{ marginTop: "0.5rem" }}
                        >
                          {ver.attestations.map((att) => (
                            <AttestationStatusBadge
                              key={`${att.type}-${att.verifier}-${att.timestamp}`}
                              attestation={att}
                              showVerifier={true}
                              isCompact={true}
                            />
                          ))}
                        </Flex>
                      </div>
                    )}
                  </ExpandableRowContent>
                </Td>
              </Tr>
            </Tbody>
          );
        })}
      </Table>

      {sbomViewerOpen && selectedSbom && (
        <SBOMViewer sbom={selectedSbom} onClose={handleCloseSbomViewer} />
      )}
    </PageSection>
  );
};
