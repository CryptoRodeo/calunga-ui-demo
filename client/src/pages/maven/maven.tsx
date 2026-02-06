import type React from "react";
import {
  PageSection,
  PageSectionVariants,
  Title,
} from "@patternfly/react-core";

export const Maven: React.FC = () => {
  return (
    <PageSection variant={PageSectionVariants.default}>
      <Title headingLevel="h1" size="2xl">
        Maven Packages
      </Title>
      <p>Maven repository page - coming soon.</p>
    </PageSection>
  );
};
