import type React from "react";
import {
  Card,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Title,
  Flex,
  FlexItem,
} from "@patternfly/react-core";
import { InfoCircleIcon } from "@patternfly/react-icons";
import type { Package } from "../search-context";
import { TrustSidebarCard } from "./trust-sidebar-card";
import { ClassifiersCard } from "./classifiers-card";

interface IMetadataSidebarProps {
  packageData: Package;
  onNavigateToSecurity: () => void;
  onNavigateToAttestations?: () => void;
  onNavigateToSbom?: () => void;
  onNavigateToVulnerabilities?: () => void;
}

export const MetadataSidebar: React.FC<IMetadataSidebarProps> = ({
  packageData,
  onNavigateToSecurity,
  onNavigateToAttestations,
  onNavigateToSbom,
  onNavigateToVulnerabilities,
}) => {
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
    <div>
      <Card>
        <CardBody>
          <Title headingLevel="h4" size="md" style={{ marginBottom: "1rem" }}>
            <Flex
              alignItems={{ default: "alignItemsCenter" }}
              spaceItems={{ default: "spaceItemsSm" }}
            >
              <FlexItem>
                <InfoCircleIcon
                  style={{ color: "var(--pf-v6-global--info-color--100)" }}
                />
              </FlexItem>
              <FlexItem>Package Details</FlexItem>
            </Flex>
          </Title>
          <DescriptionList isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>Updated</DescriptionListTerm>
              <DescriptionListDescription>
                {packageData.updated}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Downloads</DescriptionListTerm>
              <DescriptionListDescription>
                {formatDownloads(packageData.downloads)}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>License</DescriptionListTerm>
              <DescriptionListDescription>
                {packageData.license}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Author</DescriptionListTerm>
              <DescriptionListDescription>
                {packageData.author}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </CardBody>
      </Card>

      {(packageData.currentVersionAttestations ||
        packageData.currentVersionSbom ||
        packageData.slsaLevel) && (
        <TrustSidebarCard
          packageData={packageData}
          onNavigateToSecurity={onNavigateToSecurity}
          onNavigateToAttestations={onNavigateToAttestations}
          onNavigateToSbom={onNavigateToSbom}
          onNavigateToVulnerabilities={onNavigateToVulnerabilities}
        />
      )}

      <ClassifiersCard packageData={packageData} />
    </div>
  );
};
