import type React from "react";
import {
  Card,
  CardBody,
  Title,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
  Flex,
  FlexItem,
  Button,
} from "@patternfly/react-core";
import {
  ShieldAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@patternfly/react-icons";
import type { Package } from "../search-context";
import { SLSABadge } from "./slsa-badge";

interface ITrustSidebarCardProps {
  packageData: Package;
  onNavigateToSecurity: () => void;
  onNavigateToAttestations?: () => void;
  onNavigateToSbom?: () => void;
  onNavigateToVulnerabilities?: () => void;
}

export const TrustSidebarCard: React.FC<ITrustSidebarCardProps> = ({
  packageData,
  onNavigateToSecurity,
  onNavigateToAttestations,
  onNavigateToSbom,
  onNavigateToVulnerabilities,
}) => {
  const { currentVersionAttestations, currentVersionSbom, slsaLevel } =
    packageData;

  if (!currentVersionAttestations && !currentVersionSbom && !slsaLevel) {
    return null;
  }

  const verifiedCount =
    currentVersionAttestations?.filter((att) => att.status === "verified")
      .length ?? 0;
  const totalCount = currentVersionAttestations?.length ?? 0;
  const allVerified = totalCount > 0 && verifiedCount === totalCount;

  return (
    <Card style={{ marginTop: "1rem" }}>
      <CardBody>
        <Title headingLevel="h4" size="md" style={{ marginBottom: "1rem" }}>
          <Flex alignItems={{ default: "alignItemsCenter" }}>
            <ShieldAltIcon style={{ marginRight: "0.5rem" }} />
            Trust & Verification
          </Flex>
        </Title>
        <DescriptionList isCompact>
          {/* SLSA Level */}
          {slsaLevel && (
            <DescriptionListGroup>
              <DescriptionListTerm>SLSA Level</DescriptionListTerm>
              <DescriptionListDescription>
                <SLSABadge level={slsaLevel} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}

          {/* Verification Status */}
          {currentVersionAttestations &&
            currentVersionAttestations.length > 0 && (
              <DescriptionListGroup>
                <DescriptionListTerm>Verification</DescriptionListTerm>
                <DescriptionListDescription>
                  <Flex
                    alignItems={{ default: "alignItemsCenter" }}
                    spaceItems={{ default: "spaceItemsSm" }}
                  >
                    <FlexItem>
                      <Button
                        variant="link"
                        isInline
                        isSmall
                        onClick={
                          onNavigateToAttestations || onNavigateToSecurity
                        }
                        style={{
                          padding: 0,
                          fontSize: "var(--pf-v6-global--FontSize--sm)",
                          color: "#0066cc",
                        }}
                      >
                        {verifiedCount}/{totalCount} attestations verified
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <CheckCircleIcon
                        style={{
                          color: "#52c41a",
                          fontSize: "var(--pf-v6-global--FontSize--sm)",
                        }}
                      />
                    </FlexItem>
                  </Flex>
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}

          {/* SBOM */}
          {currentVersionSbom && (
            <DescriptionListGroup>
              <DescriptionListTerm>SBOM</DescriptionListTerm>
              <DescriptionListDescription>
                <Button
                  variant="link"
                  isInline
                  isSmall
                  onClick={onNavigateToSbom || onNavigateToSecurity}
                  style={{
                    padding: 0,
                    fontSize: "var(--pf-v6-global--FontSize--sm)",
                    color: "#0066cc",
                  }}
                >
                  {currentVersionSbom.components?.length ||
                    currentVersionSbom.summary?.totalComponents ||
                    0}{" "}
                  components
                </Button>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}

          {/* Vulnerabilities */}
          {currentVersionSbom?.summary && (
            <DescriptionListGroup>
              <DescriptionListTerm>Vulnerabilities</DescriptionListTerm>
              <DescriptionListDescription>
                <Flex
                  alignItems={{ default: "alignItemsCenter" }}
                  spaceItems={{ default: "spaceItemsSm" }}
                >
                  <FlexItem>
                    <Button
                      variant="link"
                      isInline
                      isSmall
                      onClick={
                        onNavigateToVulnerabilities || onNavigateToSecurity
                      }
                      style={{
                        padding: 0,
                        fontSize: "var(--pf-v6-global--FontSize--sm)",
                        color: "#0066cc",
                      }}
                    >
                      {currentVersionSbom.summary.hasVulnerabilities
                        ? `${currentVersionSbom.summary.vulnerabilities?.length || 0} found`
                        : "None found"}
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <ExclamationTriangleIcon
                      style={{
                        color: "#d73027",
                        fontSize: "var(--pf-v6-global--FontSize--sm)",
                      }}
                    />
                  </FlexItem>
                </Flex>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
      </CardBody>
    </Card>
  );
};
