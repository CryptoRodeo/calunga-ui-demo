import type React from "react";
import { useState } from "react";
import {
  Card,
  CardBody,
  Title,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Progress,
  Label,
  Flex,
  FlexItem,
  Button,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ShieldAltIcon,
  FileAltIcon,
  DownloadIcon,
  EyeIcon,
} from "@patternfly/react-icons";
import type { Package } from "../search-context";
import { SLSABadge } from "./slsa-badge";
import { SBOMViewer } from "./sbom-viewer";
import { AttestationDetailsModal } from "./attestation-details-modal";

interface ITrustSidebarCardProps {
  packageData: Package;
}

const getTrustScoreVariant = (score: number) => {
  if (score >= 86) return "success";
  if (score >= 71) return "info";
  if (score >= 41) return "warning";
  return "danger";
};

export const TrustSidebarCard: React.FC<ITrustSidebarCardProps> = ({
  packageData,
}) => {
  const {
    currentVersionAttestations,
    currentVersionSbom,
    trustScore,
    slsaLevel,
  } = packageData;

  const [sbomViewerOpen, setSbomViewerOpen] = useState(false);
  const [attestationModalOpen, setAttestationModalOpen] = useState(false);

  if (
    !currentVersionAttestations &&
    !currentVersionSbom &&
    !trustScore &&
    !slsaLevel
  ) {
    return null;
  }

  const verifiedCount =
    currentVersionAttestations?.filter((att) => att.status === "verified")
      .length ?? 0;
  const totalCount = currentVersionAttestations?.length ?? 0;
  const allVerified = totalCount > 0 && verifiedCount === totalCount;

  return (
    <>
      <Card style={{ marginTop: "1rem" }}>
        <CardBody>
          <Title headingLevel="h4" size="md" style={{ marginBottom: "1rem" }}>
            <Flex alignItems={{ default: "alignItemsCenter" }}>
              <ShieldAltIcon style={{ marginRight: "0.5rem" }} />
              Trust & Verification
            </Flex>
          </Title>
          <DescriptionList isCompact>
            {/* Verification Status */}
            {currentVersionAttestations &&
              currentVersionAttestations.length > 0 && (
                <DescriptionListGroup>
                  <DescriptionListTerm>
                    <CheckCircleIcon style={{ marginRight: "0.25rem" }} />
                    Status
                  </DescriptionListTerm>
                  <DescriptionListDescription>
                    <Flex
                      direction={{ default: "column" }}
                      spaceItems={{ default: "spaceItemsXs" }}
                    >
                      <FlexItem>
                        <Label color={allVerified ? "green" : "grey"}>
                          {allVerified ? "Verified" : "Partial"}
                        </Label>
                      </FlexItem>
                      <FlexItem>
                        <span
                          style={{
                            fontSize: "var(--pf-v6-global--FontSize--xs)",
                            color: "var(--pf-v6-global--Color--200)",
                          }}
                        >
                          {verifiedCount}/{totalCount} attestations
                        </span>
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="link"
                          isInline
                          isSmall
                          onClick={() => setAttestationModalOpen(true)}
                          style={{
                            padding: 0,
                            fontSize: "var(--pf-v6-global--FontSize--sm)",
                          }}
                        >
                          View details
                        </Button>
                      </FlexItem>
                    </Flex>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}

            {/* SBOM */}
            {currentVersionSbom && (
              <DescriptionListGroup>
                <DescriptionListTerm>
                  <FileAltIcon style={{ marginRight: "0.25rem" }} />
                  SBOM
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Flex
                    direction={{ default: "column" }}
                    spaceItems={{ default: "spaceItemsXs" }}
                  >
                    <FlexItem>
                      <Label color="blue" isRead>
                        {currentVersionSbom.format}{" "}
                        {currentVersionSbom.version &&
                          `v${currentVersionSbom.version}`}
                      </Label>
                    </FlexItem>
                    {currentVersionSbom.componentCount !== undefined && (
                      <FlexItem>
                        <span
                          style={{
                            fontSize: "var(--pf-v6-global--FontSize--xs)",
                            color: "var(--pf-v6-global--Color--200)",
                          }}
                        >
                          {currentVersionSbom.componentCount} components
                        </span>
                      </FlexItem>
                    )}
                    <FlexItem>
                      <Flex
                        spaceItems={{ default: "spaceItemsXs" }}
                        style={{ gap: "0.5rem" }}
                      >
                        <Button
                          variant="link"
                          isInline
                          isSmall
                          icon={<EyeIcon />}
                          onClick={() => setSbomViewerOpen(true)}
                          style={{
                            padding: 0,
                            fontSize: "var(--pf-v6-global--FontSize--sm)",
                          }}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="link"
                          isInline
                          isSmall
                          icon={<DownloadIcon />}
                          component="a"
                          href={currentVersionSbom.url}
                          download
                          style={{
                            padding: 0,
                            fontSize: "var(--pf-v6-global--FontSize--sm)",
                          }}
                        >
                          Download
                        </Button>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}

            {/* SLSA Level */}
            {slsaLevel && (
              <DescriptionListGroup>
                <DescriptionListTerm>SLSA Level</DescriptionListTerm>
                <DescriptionListDescription>
                  <SLSABadge level={slsaLevel} isCompact />
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}

            {/* Trust Score */}
            {trustScore !== undefined && (
              <DescriptionListGroup>
                <DescriptionListTerm>Trust Score</DescriptionListTerm>
                <DescriptionListDescription>
                  <Progress
                    value={trustScore}
                    title={`${trustScore}/100`}
                    variant={getTrustScoreVariant(trustScore)}
                    size="sm"
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
          </DescriptionList>
        </CardBody>
      </Card>

      {/* SBOM Viewer Modal */}
      {sbomViewerOpen && currentVersionSbom && (
        <SBOMViewer
          sbom={currentVersionSbom}
          onClose={() => setSbomViewerOpen(false)}
        />
      )}

      {/* Attestation Details Modal */}
      {attestationModalOpen && currentVersionAttestations && (
        <AttestationDetailsModal
          attestations={currentVersionAttestations}
          packageName={packageData.name}
          packageVersion={packageData.version}
          onClose={() => setAttestationModalOpen(false)}
        />
      )}
    </>
  );
};
