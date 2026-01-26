import type React from "react";
import {
  Card,
  CardBody,
  CardTitle,
  Alert,
  List,
  ListItem,
  Button,
  Flex,
  FlexItem,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Badge,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExternalLinkAltIcon,
  DownloadIcon,
} from "@patternfly/react-icons";
import type { Package } from "../search-context";
import { SLSABadge } from "./slsa-badge";
import { AttestationStatusBadge } from "./attestation-status-badge";

interface IAttestationsCardProps {
  packageData: Package;
}

export const AttestationsCard: React.FC<IAttestationsCardProps> = ({
  packageData,
}) => {
  const { currentVersionAttestations, currentVersionSbom } = packageData;

  if (!currentVersionAttestations && !currentVersionSbom) {
    return null;
  }

  const allVerified =
    currentVersionAttestations?.every((att) => att.status === "verified") ??
    false;
  const hasFailures =
    currentVersionAttestations?.some((att) => att.status === "failed") ?? false;

  const provenanceAttestation = currentVersionAttestations?.find(
    (att) => att.type === "provenance",
  );
  const sbomAttestation = currentVersionAttestations?.find(
    (att) => att.type === "sbom",
  );
  const vulnerabilityAttestation = currentVersionAttestations?.find(
    (att) => att.type === "vulnerability",
  );

  return (
    <Card style={{ marginBottom: "1.5rem" }}>
      <CardTitle>
        <Flex alignItems={{ default: "alignItemsCenter" }}>
          <FlexItem>Attestations & Verification</FlexItem>
          {packageData.slsaLevel && (
            <FlexItem>
              <SLSABadge level={packageData.slsaLevel} />
            </FlexItem>
          )}
        </Flex>
      </CardTitle>
      <CardBody>
        {hasFailures ? (
          <Alert
            variant="danger"
            isInline
            title="Verification failed"
            style={{ marginBottom: "1rem" }}
          >
            One or more attestations failed verification. Use caution when using
            this package.
          </Alert>
        ) : allVerified ? (
          <Alert
            variant="success"
            isInline
            title="Verified Package"
            icon={<CheckCircleIcon />}
            style={{ marginBottom: "1rem" }}
          >
            This package has been verified with cryptographic attestations from
            trusted sources.
          </Alert>
        ) : (
          <Alert
            variant="info"
            isInline
            title="Partial Verification"
            style={{ marginBottom: "1rem" }}
          >
            This package has some attestations available. Review details below.
          </Alert>
        )}

        <List isPlain>
          {provenanceAttestation && (
            <ListItem>
              <Flex
                direction={{ default: "column" }}
                spaceItems={{ default: "spaceItemsSm" }}
              >
                <FlexItem>
                  <Flex
                    alignItems={{ default: "alignItemsCenter" }}
                    spaceItems={{ default: "spaceItemsSm" }}
                  >
                    <FlexItem>
                      <strong>Build Provenance</strong>
                    </FlexItem>
                    <FlexItem>
                      <AttestationStatusBadge
                        attestation={provenanceAttestation}
                        showVerifier={false}
                        isCompact
                      />
                    </FlexItem>
                    {provenanceAttestation.slsaLevel && (
                      <FlexItem>
                        <SLSABadge
                          level={provenanceAttestation.slsaLevel}
                          isCompact
                        />
                      </FlexItem>
                    )}
                  </Flex>
                </FlexItem>
                <FlexItem>
                  <DescriptionList
                    isCompact
                    isHorizontal
                    style={{ fontSize: "var(--pf-v6-global--FontSize--sm)" }}
                  >
                    {provenanceAttestation.buildPlatform && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Platform</DescriptionListTerm>
                        <DescriptionListDescription>
                          {provenanceAttestation.buildPlatform}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                    {provenanceAttestation.subject && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Subject</DescriptionListTerm>
                        <DescriptionListDescription>
                          {provenanceAttestation.subject}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                  </DescriptionList>
                </FlexItem>
              </Flex>
            </ListItem>
          )}

          {currentVersionSbom && (
            <ListItem style={{ marginTop: "1rem" }}>
              <Flex
                direction={{ default: "column" }}
                spaceItems={{ default: "spaceItemsSm" }}
              >
                <FlexItem>
                  <Flex
                    alignItems={{ default: "alignItemsCenter" }}
                    spaceItems={{ default: "spaceItemsSm" }}
                  >
                    <FlexItem>
                      <strong>SBOM Available</strong>
                    </FlexItem>
                    {sbomAttestation && (
                      <FlexItem>
                        <AttestationStatusBadge
                          attestation={sbomAttestation}
                          showVerifier={false}
                          isCompact
                        />
                      </FlexItem>
                    )}
                    <FlexItem>
                      <Badge isRead>
                        {currentVersionSbom.format}{" "}
                        {currentVersionSbom.version &&
                          `v${currentVersionSbom.version}`}
                      </Badge>
                    </FlexItem>
                  </Flex>
                </FlexItem>
                <FlexItem>
                  <DescriptionList
                    isCompact
                    isHorizontal
                    style={{ fontSize: "var(--pf-v6-global--FontSize--sm)" }}
                  >
                    {currentVersionSbom.componentCount !== undefined && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Components</DescriptionListTerm>
                        <DescriptionListDescription>
                          {currentVersionSbom.componentCount}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                    {currentVersionSbom.summary?.directDependencies !==
                      undefined && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>
                          Direct Dependencies
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          {currentVersionSbom.summary.directDependencies}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                    {currentVersionSbom.summary?.licensesFound && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Licenses</DescriptionListTerm>
                        <DescriptionListDescription>
                          {currentVersionSbom.summary.licensesFound.join(", ")}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                  </DescriptionList>
                </FlexItem>
                <FlexItem>
                  <Flex spaceItems={{ default: "spaceItemsSm" }}>
                    <FlexItem>
                      <Button
                        variant="link"
                        isSmall
                        icon={<DownloadIcon />}
                        component="a"
                        href={currentVersionSbom.url}
                        download
                      >
                        Download
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <Button
                        variant="link"
                        isSmall
                        icon={<ExternalLinkAltIcon />}
                        component="a"
                        href={currentVersionSbom.url}
                        target="_blank"
                      >
                        View
                      </Button>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </Flex>
            </ListItem>
          )}

          {vulnerabilityAttestation && (
            <ListItem style={{ marginTop: "1rem" }}>
              <Flex
                direction={{ default: "column" }}
                spaceItems={{ default: "spaceItemsSm" }}
              >
                <FlexItem>
                  <Flex
                    alignItems={{ default: "alignItemsCenter" }}
                    spaceItems={{ default: "spaceItemsSm" }}
                  >
                    <FlexItem>
                      <strong>Vulnerability Scan</strong>
                    </FlexItem>
                    <FlexItem>
                      <AttestationStatusBadge
                        attestation={vulnerabilityAttestation}
                        showVerifier={false}
                        isCompact
                      />
                    </FlexItem>
                  </Flex>
                </FlexItem>
                <FlexItem>
                  <DescriptionList
                    isCompact
                    isHorizontal
                    style={{ fontSize: "var(--pf-v6-global--FontSize--sm)" }}
                  >
                    {vulnerabilityAttestation.metadata?.scanResult && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Result</DescriptionListTerm>
                        <DescriptionListDescription>
                          {String(vulnerabilityAttestation.metadata.scanResult)}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                    {vulnerabilityAttestation.metadata?.lastScanDate && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Last Scanned</DescriptionListTerm>
                        <DescriptionListDescription>
                          {new Date(
                            String(
                              vulnerabilityAttestation.metadata.lastScanDate,
                            ),
                          ).toLocaleDateString()}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                  </DescriptionList>
                </FlexItem>
              </Flex>
            </ListItem>
          )}
        </List>
      </CardBody>
    </Card>
  );
};
