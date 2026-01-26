import type React from "react";
import {
  Card,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Title,
} from "@patternfly/react-core";
import type { Package } from "../search-context";
import { TrustSidebarCard } from "./trust-sidebar-card";

interface IMetadataSidebarProps {
  packageData: Package;
}

export const MetadataSidebar: React.FC<IMetadataSidebarProps> = ({
  packageData,
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
          <DescriptionList isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>📅 Updated</DescriptionListTerm>
              <DescriptionListDescription>
                {packageData.updated}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>📥 Downloads</DescriptionListTerm>
              <DescriptionListDescription>
                {formatDownloads(packageData.downloads)}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>📄 License</DescriptionListTerm>
              <DescriptionListDescription>
                {packageData.license}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>👤 Author</DescriptionListTerm>
              <DescriptionListDescription>
                {packageData.author}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </CardBody>
      </Card>

      {(packageData.currentVersionAttestations ||
        packageData.currentVersionSbom ||
        packageData.trustScore ||
        packageData.slsaLevel) && (
        <TrustSidebarCard packageData={packageData} />
      )}

      {packageData.wheelName && (
        <Card style={{ marginTop: "1rem" }}>
          <CardBody>
            <Title headingLevel="h4" size="md" style={{ marginBottom: "1rem" }}>
              Wheel Metadata
            </Title>
            <DescriptionList isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>🐍 Python Version</DescriptionListTerm>
                <DescriptionListDescription>
                  {packageData.pythonVersion}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>⚙️ ABI</DescriptionListTerm>
                <DescriptionListDescription>
                  {packageData.abi}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>🖥️ Architecture</DescriptionListTerm>
                <DescriptionListDescription>
                  {packageData.architecture}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>📦 Wheel File</DescriptionListTerm>
                <DescriptionListDescription
                  style={{
                    fontSize: "var(--pf-v6-global--FontSize--sm)",
                    wordBreak: "break-all",
                  }}
                >
                  {packageData.wheelName}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
