import type React from "react";
import {
  PageSection,
  PageSectionVariants,
  Title,
} from "@patternfly/react-core";

export const Npm: React.FC = () => {
  return (
    <PageSection variant={PageSectionVariants.default}>
      <Title headingLevel="h1" size="2xl">
        Node Package Manager
      </Title>
      <p>NPM repository page - coming soon.</p>
    </PageSection>
  );
};
