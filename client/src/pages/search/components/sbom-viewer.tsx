import type React from "react";
import { useState } from "react";
import {
  Modal,
  ModalVariant,
  Button,
  Tabs,
  Tab,
  TabTitleText,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Alert,
  Flex,
  FlexItem,
  Badge,
  ModalBody,
  ModalFooter,
} from "@patternfly/react-core";
import { DownloadIcon, ExternalLinkAltIcon } from "@patternfly/react-icons";
import type { SBOM } from "../search-context";

interface ISBOMViewerProps {
  sbom: SBOM;
  onClose: () => void;
}

export const SBOMViewer: React.FC<ISBOMViewerProps> = ({ sbom, onClose }) => {
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: string | number,
  ) => {
    setActiveTabKey(tabIndex);
  };

  return (
    <Modal
      variant={ModalVariant.large}
      title={`SBOM - ${sbom.format} ${sbom.version ? `v${sbom.version}` : ""}`}
      isOpen={true}
      onClose={onClose}
    >
      <ModalBody>
        <Tabs activeKey={activeTabKey} onSelect={handleTabClick}>
          <Tab eventKey={0} title={<TabTitleText>Overview</TabTitleText>}>
            <div style={{ padding: "1rem 0" }}>
              <DescriptionList isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>Format</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Badge isRead>
                      {sbom.format} {sbom.version && `v${sbom.version}`}
                    </Badge>
                  </DescriptionListDescription>
                </DescriptionListGroup>

                {sbom.serialNumber && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Serial Number</DescriptionListTerm>
                    <DescriptionListDescription>
                      <code
                        style={{
                          fontSize: "var(--pf-v6-global--FontSize--sm)",
                        }}
                      >
                        {sbom.serialNumber}
                      </code>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                <DescriptionListGroup>
                  <DescriptionListTerm>Generated At</DescriptionListTerm>
                  <DescriptionListDescription>
                    {new Date(sbom.generatedAt).toLocaleString()}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                {sbom.toolName && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Generation Tool</DescriptionListTerm>
                    <DescriptionListDescription>
                      {sbom.toolName}{" "}
                      {sbom.toolVersion && `v${sbom.toolVersion}`}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {sbom.componentCount !== undefined && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Total Components</DescriptionListTerm>
                    <DescriptionListDescription>
                      {sbom.componentCount}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {sbom.summary?.directDependencies !== undefined && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>
                      Direct Dependencies
                    </DescriptionListTerm>
                    <DescriptionListDescription>
                      {sbom.summary.directDependencies}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {sbom.summary?.licensesFound &&
                  sbom.summary.licensesFound.length > 0 && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>Licenses Found</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Flex spaceItems={{ default: "spaceItemsSm" }}>
                          {sbom.summary.licensesFound.map((license) => (
                            <FlexItem key={license}>
                              <Badge isRead>{license}</Badge>
                            </FlexItem>
                          ))}
                        </Flex>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}

                {sbom.summary?.criticalDependencies &&
                  sbom.summary.criticalDependencies.length > 0 && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        Critical Dependencies
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {sbom.summary.criticalDependencies.join(", ")}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}

                {sbom.summary?.hasVulnerabilities !== undefined && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Vulnerabilities</DescriptionListTerm>
                    <DescriptionListDescription>
                      {sbom.summary.hasVulnerabilities ? (
                        <Badge color="red">Found</Badge>
                      ) : (
                        <Badge color="green">None</Badge>
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>

              {sbom.summary?.hasVulnerabilities && (
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
            </div>
          </Tab>

          <Tab eventKey={1} title={<TabTitleText>Components</TabTitleText>}>
            <div style={{ padding: "1rem 0" }}>
              <Alert
                variant="info"
                isInline
                title="Full component list available in raw SBOM"
              >
                Download or view the raw SBOM file to see the complete component
                list with versions, licenses, and dependency relationships.
              </Alert>
            </div>
          </Tab>

          <Tab eventKey={2} title={<TabTitleText>Licenses</TabTitleText>}>
            <div style={{ padding: "1rem 0" }}>
              {sbom.summary?.licensesFound &&
              sbom.summary.licensesFound.length > 0 ? (
                <div>
                  <p style={{ marginBottom: "1rem" }}>
                    This package uses the following licenses across its
                    dependencies:
                  </p>
                  <Flex spaceItems={{ default: "spaceItemsMd" }}>
                    {sbom.summary.licensesFound.map((license) => (
                      <FlexItem key={license}>
                        <Badge isRead>{license}</Badge>
                      </FlexItem>
                    ))}
                  </Flex>
                </div>
              ) : (
                <Alert
                  variant="info"
                  isInline
                  title="License information not available in summary"
                >
                  Download the full SBOM to view detailed license information
                  for each component.
                </Alert>
              )}
            </div>
          </Tab>
        </Tabs>
      </ModalBody>
      <ModalFooter>
        <Button
          key="download"
          variant="primary"
          icon={<DownloadIcon />}
          component="a"
          href={sbom.url}
          download
        >
          Download SBOM
        </Button>
        <Button
          key="view-raw"
          variant="secondary"
          icon={<ExternalLinkAltIcon />}
          component="a"
          href={sbom.url}
          target="_blank"
        >
          View Raw
        </Button>
        <Button key="close" variant="link" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};
