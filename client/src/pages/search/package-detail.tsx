import type React from "react";
import { useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PageSection,
  PageSectionVariants,
  Title,
  Button,
  Flex,
  FlexItem,
  Label,
  Tabs,
  Tab,
  TabContent,
  Grid,
  GridItem,
  Alert,
} from "@patternfly/react-core";
import { ArrowLeftIcon } from "@patternfly/react-icons";
import {
  PackageDetailProvider,
  PackageDetailContext,
} from "./package-detail-context";
import { OverviewTab } from "./package-detail-tabs/overview-tab";
import { VersionsTab } from "./package-detail-tabs/versions-tab";
import { DependentsTab } from "./package-detail-tabs/dependents-tab";
import { SecurityTab } from "./package-detail-tabs/security-tab";
import { MetadataSidebar } from "./components/metadata-sidebar";

const PackageDetailContent: React.FC = () => {
  const { packageData, tabControls } = useContext(PackageDetailContext);
  const navigate = useNavigate();

  if (!packageData) {
    return (
      <PageSection>
        <Alert variant="warning" title="Package not found">
          <p>The package you are looking for could not be found.</p>
          <Button
            variant="link"
            onClick={() => navigate("/search")}
            style={{ paddingLeft: 0 }}
          >
            Return to search
          </Button>
        </Alert>
      </PageSection>
    );
  }

  const { propHelpers } = tabControls;

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Button
          variant="link"
          icon={<ArrowLeftIcon />}
          onClick={() => navigate("/search")}
          style={{ paddingLeft: 0, marginBottom: "1rem" }}
        >
          Back to Search
        </Button>
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
                <Title headingLevel="h1" size="2xl">
                  {packageData.name}
                </Title>
              </FlexItem>
              <FlexItem>
                <Label color="blue" isCompact>
                  v{packageData.version}
                </Label>
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <p style={{ fontSize: "var(--pf-v6-global--FontSize--lg)" }}>
              {packageData.description}
            </p>
          </FlexItem>
          {packageData.tags && packageData.tags.length > 0 && (
            <FlexItem>
              <Flex spaceItems={{ default: "spaceItemsSm" }}>
                {packageData.tags.map((tag) => (
                  <FlexItem key={tag}>
                    <Label color="grey" isCompact>
                      #{tag}
                    </Label>
                  </FlexItem>
                ))}
              </Flex>
            </FlexItem>
          )}
        </Flex>
      </PageSection>

      <PageSection>
        <Tabs {...propHelpers.getTabsProps()} aria-label="Package details tabs">
          <Tab {...propHelpers.getTabProps("overview")} title="Overview" />
          <Tab {...propHelpers.getTabProps("versions")} title="Versions" />
          <Tab {...propHelpers.getTabProps("dependents")} title="Dependents" />
          <Tab {...propHelpers.getTabProps("security")} title="Security" />
        </Tabs>

        <Grid hasGutter style={{ marginTop: "1rem" }}>
          <GridItem span={8} md={8} lg={9}>
            <TabContent {...propHelpers.getTabContentProps("overview")}>
              <OverviewTab />
            </TabContent>
            <TabContent {...propHelpers.getTabContentProps("versions")}>
              <VersionsTab />
            </TabContent>
            <TabContent {...propHelpers.getTabContentProps("dependents")}>
              <DependentsTab />
            </TabContent>
            <TabContent {...propHelpers.getTabContentProps("security")}>
              <SecurityTab />
            </TabContent>
          </GridItem>
          <GridItem span={4} md={4} lg={3}>
            <MetadataSidebar packageData={packageData} />
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};

export const PackageDetail: React.FC = () => {
  const { packageId } = useParams<{ packageId: string }>();

  if (!packageId) {
    return (
      <PageSection>
        <Alert variant="danger" title="Invalid package ID">
          <p>No package ID was provided in the URL.</p>
        </Alert>
      </PageSection>
    );
  }

  return (
    <PackageDetailProvider packageId={packageId}>
      <PackageDetailContent />
    </PackageDetailProvider>
  );
};
