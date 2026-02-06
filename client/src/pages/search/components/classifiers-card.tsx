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
} from "@patternfly/react-core";
import { TagIcon } from "@patternfly/react-icons";
import type { Package } from "../search-context";

interface IClassifiersCardProps {
  packageData: Package;
}

export const ClassifiersCard: React.FC<IClassifiersCardProps> = ({
  packageData,
}) => {
  // Derive development status from package data
  const getDevelopmentStatus = () => {
    // Check for pre-release versions to determine status
    if (
      packageData.version.includes("rc") ||
      packageData.version.includes("beta") ||
      packageData.version.includes("alpha")
    ) {
      return "4 - Beta";
    }
    // If it has high downloads and is stable, it's production/stable
    if (packageData.downloads > 1000000) {
      return "5 - Production/Stable";
    }
    return "4 - Beta";
  };

  // Get intended audience based on tags
  const getIntendedAudience = () => {
    const audiences = [];
    if (
      packageData.tags?.some((tag) =>
        [
          "data-science",
          "data-analysis",
          "scientific-computing",
          "machine-learning",
        ].includes(tag),
      )
    ) {
      audiences.push("Science/Research");
    }
    if (
      packageData.tags?.some((tag) =>
        ["web-development", "gui", "networking"].includes(tag),
      )
    ) {
      audiences.push("Developers");
    }
    if (
      packageData.tags?.some((tag) =>
        ["system", "utilities", "devops"].includes(tag),
      )
    ) {
      audiences.push("System Administrators");
    }
    return audiences.length > 0 ? audiences : ["Developers"];
  };

  // Get topic based on tags and description
  const getTopics = () => {
    const topics = [];
    if (
      packageData.tags?.some((tag) =>
        [
          "data-science",
          "data-analysis",
          "statistics",
          "scientific-computing",
        ].includes(tag),
      )
    ) {
      topics.push("Scientific/Engineering");
    }
    if (
      packageData.tags?.some((tag) =>
        ["web-development", "networking", "http"].includes(tag),
      )
    ) {
      topics.push("Internet :: WWW/HTTP");
    }
    if (
      packageData.tags?.some((tag) => ["database", "storage"].includes(tag))
    ) {
      topics.push("Database");
    }
    if (
      packageData.tags?.some((tag) =>
        ["security", "cryptography"].includes(tag),
      )
    ) {
      topics.push("Security");
    }
    if (packageData.tags?.some((tag) => ["testing", "quality"].includes(tag))) {
      topics.push("Software Development :: Testing");
    }
    if (
      packageData.tags?.some((tag) => ["utilities", "system"].includes(tag))
    ) {
      topics.push("System :: Systems Administration");
    }
    return topics.length > 0 ? topics : ["Software Development"];
  };

  // Get programming languages
  const getProgrammingLanguages = () => {
    const languages = ["Python", "Python :: 3", "Python :: 3 :: Only"];

    // Add Python 3.12 support specifically
    languages.push("Python :: 3.12");

    if (packageData.tags?.includes("cython")) {
      languages.push("Cython");
    }

    return languages;
  };

  return (
    <Card style={{ marginTop: "1rem" }}>
      <CardBody>
        <Title headingLevel="h4" size="md" style={{ marginBottom: "1rem" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            spaceItems={{ default: "spaceItemsSm" }}
          >
            <FlexItem>
              <TagIcon
                style={{ color: "var(--pf-v6-global--palette--purple--400)" }}
              />
            </FlexItem>
            <FlexItem>Classifiers</FlexItem>
          </Flex>
        </Title>
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Development Status</DescriptionListTerm>
            <DescriptionListDescription>
              {getDevelopmentStatus()}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Environment</DescriptionListTerm>
            <DescriptionListDescription>Console</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Intended Audience</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex
                spaceItems={{ default: "spaceItemsXs" }}
                direction={{ default: "column" }}
              >
                {getIntendedAudience().map((audience) => (
                  <FlexItem key={audience}>
                    <Label color="blue" isCompact>
                      {audience}
                    </Label>
                  </FlexItem>
                ))}
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>License</DescriptionListTerm>
            <DescriptionListDescription>
              OSI Approved ::{" "}
              {packageData.license === "BSD-3-Clause"
                ? "BSD License"
                : packageData.license}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Operating System</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex
                spaceItems={{ default: "spaceItemsXs" }}
                direction={{ default: "column" }}
              >
                <FlexItem>
                  <Label color="orange" isCompact>
                    POSIX :: Linux
                  </Label>
                </FlexItem>
                <FlexItem>
                  <Label color="orange" isCompact>
                    MacOS
                  </Label>
                </FlexItem>
                <FlexItem>
                  <Label color="orange" isCompact>
                    Microsoft :: Windows
                  </Label>
                </FlexItem>
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Programming Language</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex
                spaceItems={{ default: "spaceItemsXs" }}
                direction={{ default: "column" }}
              >
                {getProgrammingLanguages().map((language) => (
                  <FlexItem key={language}>
                    <Label color="green" isCompact>
                      {language}
                    </Label>
                  </FlexItem>
                ))}
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>System Support & Version</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex
                spaceItems={{ default: "spaceItemsXs" }}
                direction={{ default: "column" }}
              >
                <FlexItem>
                  <Label color="purple" isCompact>
                    Python 3.12+
                  </Label>
                </FlexItem>
                <FlexItem>
                  <Label color="blue" isCompact>
                    manylinux wheels
                  </Label>
                </FlexItem>
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Available Architecture</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex
                spaceItems={{ default: "spaceItemsXs" }}
                direction={{ default: "column" }}
              >
                <FlexItem>
                  <Label color="cyan" isCompact>
                    x86_64
                  </Label>
                </FlexItem>
                <FlexItem>
                  <Label color="cyan" isCompact>
                    aarch64
                  </Label>
                </FlexItem>
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Topic</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex
                spaceItems={{ default: "spaceItemsXs" }}
                direction={{ default: "column" }}
              >
                {getTopics().map((topic) => (
                  <FlexItem key={topic}>
                    <Label color="purple" isCompact>
                      {topic}
                    </Label>
                  </FlexItem>
                ))}
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};
