import type React from "react";
import { useContext, useState } from "react";
import {
  PageSection,
  Title,
  Button,
  Flex,
  FlexItem,
  Tooltip,
} from "@patternfly/react-core";
import { CopyIcon } from "@patternfly/react-icons";
import ReactMarkdown from "react-markdown";
import { PackageDetailContext } from "../package-detail-context-simple";

interface CodeBlockProps {
  children: string;
  language?: string;
  showCopyButton?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  language = "bash",
  showCopyButton = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Get background color based on language
  const getBackgroundColor = (lang: string) => {
    switch (lang) {
      case "python":
        return "#f8f9fa";
      case "bash":
        return "#f1f3f4";
      case "json":
        return "#f6f8fa";
      case "toml":
        return "#faf9f7";
      default:
        return "#f8f9fa";
    }
  };

  const getLanguageFromContent = (content: string): string => {
    if (
      content.includes("pip install") ||
      content.includes("git clone") ||
      content.includes("export ")
    )
      return "bash";
    if (
      content.includes("import ") ||
      content.includes("def ") ||
      content.includes("class ")
    )
      return "python";
    if (content.includes("[build-system]") || content.includes("[project]"))
      return "toml";
    if (content.includes('{"') || content.includes('"name":')) return "json";
    return language;
  };

  const detectedLanguage = getLanguageFromContent(children);

  return (
    <div
      style={{
        backgroundColor: getBackgroundColor(detectedLanguage),
        border: "1px solid #e9ecef",
        borderRadius: "6px",
        marginTop: "0.5rem",
        position: "relative",
        fontFamily:
          "'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "1rem",
        }}
      >
        <pre
          style={{
            margin: 0,
            padding: 0,
            backgroundColor: "transparent",
            fontFamily: "inherit",
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#212529",
            flex: 1,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflow: "auto",
          }}
        >
          {children}
        </pre>
        {showCopyButton && (
          <Tooltip content={copied ? "Copied!" : "Copy to clipboard"}>
            <Button
              variant="plain"
              onClick={handleCopy}
              style={{
                padding: "6px 10px",
                marginLeft: "12px",
                minWidth: "auto",
                height: "36px",
                width: "36px",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "6px",
                color: copied ? "#28a745" : "#000000",
                fontSize: "14px",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Copy to clipboard"
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
                  e.currentTarget.style.color = "#000000";
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#000000";
                }
              }}
            >
              <CopyIcon style={{ width: "16px", height: "16px" }} />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export const OverviewTab: React.FC = () => {
  const { packageData } = useContext(PackageDetailContext);

  if (!packageData) {
    return null;
  }

  // Get real PyPI data if available, otherwise fall back to generic content
  const hasRealData = packageData.pypiData;

  return (
    <PageSection>
      <Title headingLevel="h2" size="xl">
        About
      </Title>
      <div
        style={{
          marginTop: "0.5rem",
          backgroundColor: "#f8f9fa",
          border: "1px solid #e9ecef",
          borderRadius: "6px",
          padding: "1rem",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <ReactMarkdown>
          {packageData.fullDescription || packageData.description}
        </ReactMarkdown>
      </div>

      {/* Notices section for packages that have important notices */}
      {hasRealData && packageData.pypiData.notices && (
        <>
          <Title headingLevel="h2" size="xl" style={{ marginTop: "2rem" }}>
            Important Notices
          </Title>
          <div
            style={{
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "4px",
              padding: "1rem",
              marginTop: "0.5rem",
            }}
          >
            {packageData.pypiData.notices.map((notice, index) => (
              <div
                key={index}
                style={{
                  marginBottom:
                    index < packageData.pypiData.notices.length - 1
                      ? "0.5rem"
                      : "0",
                }}
              >
                {notice}
              </div>
            ))}
          </div>
        </>
      )}

      <Title headingLevel="h2" size="xl" style={{ marginTop: "2rem" }}>
        Installation
      </Title>
      <CodeBlock showCopyButton={true} language="bash">
        pip install {packageData.name}
      </CodeBlock>

      {hasRealData && packageData.pypiData.alternativeInstallation && (
        <div style={{ marginTop: "0.5rem" }}>
          <p>Alternatively, you can install from source:</p>
          <CodeBlock language="bash">
            {packageData.pypiData.alternativeInstallation}
          </CodeBlock>
        </div>
      )}

      <Title headingLevel="h2" size="xl" style={{ marginTop: "2rem" }}>
        {hasRealData && packageData.pypiData.usageTitle
          ? packageData.pypiData.usageTitle
          : "Basic Usage"}
      </Title>

      {hasRealData && packageData.pypiData.usageExample ? (
        <CodeBlock language="python">
          {packageData.pypiData.usageExample}
        </CodeBlock>
      ) : (
        <CodeBlock language="python">{`import ${packageData.name}\n\n# Use ${packageData.name} in your project`}</CodeBlock>
      )}

      {/* Features section */}
      {hasRealData && packageData.pypiData.features && (
        <>
          <Title headingLevel="h3" size="lg" style={{ marginTop: "1rem" }}>
            Key Features
          </Title>
          <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
            {packageData.pypiData.features.map((feature, index) => (
              <li key={index} style={{ marginBottom: "0.25rem" }}>
                {feature}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Additional usage info */}
      {hasRealData && packageData.pypiData.additionalInfo && (
        <div style={{ marginTop: "1rem" }}>
          <p>{packageData.pypiData.additionalInfo}</p>
        </div>
      )}

      {/* Configuration/Credentials Setup */}
      {hasRealData && packageData.pypiData.configurationSetup && (
        <>
          <Title headingLevel="h2" size="xl" style={{ marginTop: "2rem" }}>
            Configuration
          </Title>
          <p style={{ marginTop: "0.5rem" }}>
            {packageData.pypiData.configurationSetup.description}
          </p>
          {packageData.pypiData.configurationSetup.steps &&
            packageData.pypiData.configurationSetup.steps.map((step, index) => (
              <div key={index} style={{ marginTop: "1rem" }}>
                <Title headingLevel="h4" size="md">
                  {step.title}
                </Title>
                <p style={{ marginTop: "0.5rem" }}>{step.description}</p>
                {step.codeExample && (
                  <CodeBlock
                    language={
                      step.codeExample.includes("[default]")
                        ? "toml"
                        : step.codeExample.includes("export")
                          ? "bash"
                          : "python"
                    }
                  >
                    {step.codeExample}
                  </CodeBlock>
                )}
              </div>
            ))}
        </>
      )}

      {/* Advanced Usage Patterns */}
      {hasRealData && packageData.pypiData.advancedUsage && (
        <>
          <Title headingLevel="h2" size="xl" style={{ marginTop: "2rem" }}>
            Advanced Usage
          </Title>
          {packageData.pypiData.advancedUsage.map((usage, index) => (
            <div key={index} style={{ marginTop: "1.5rem" }}>
              <Title headingLevel="h4" size="md">
                {usage.title}
              </Title>
              <p style={{ marginTop: "0.5rem" }}>{usage.description}</p>
              <CodeBlock language="python">{usage.example}</CodeBlock>
            </div>
          ))}
        </>
      )}

      {/* Testing Information */}
      {hasRealData && packageData.pypiData.testing && (
        <>
          <Title headingLevel="h2" size="xl" style={{ marginTop: "2rem" }}>
            Running Tests
          </Title>
          <p style={{ marginTop: "0.5rem" }}>
            {packageData.pypiData.testing.description}
          </p>
          <CodeBlock language="bash">
            {packageData.pypiData.testing.commands}
          </CodeBlock>
          {packageData.pypiData.testing.additionalInfo && (
            <div style={{ marginTop: "1rem" }}>
              <p>{packageData.pypiData.testing.additionalInfo}</p>
            </div>
          )}
        </>
      )}

      {/* Getting Help Section */}
      {hasRealData && packageData.pypiData.gettingHelp && (
        <>
          <Title headingLevel="h2" size="xl" style={{ marginTop: "2rem" }}>
            Getting Help
          </Title>
          <p style={{ marginTop: "0.5rem" }}>
            {packageData.pypiData.gettingHelp.description}
          </p>
          <div style={{ marginTop: "1rem" }}>
            {packageData.pypiData.gettingHelp.resources &&
              packageData.pypiData.gettingHelp.resources.map(
                (resource, index) => (
                  <div key={index} style={{ marginBottom: "0.5rem" }}>
                    <strong>{resource.type}:</strong>{" "}
                    {resource.url ? (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {resource.description}
                      </a>
                    ) : (
                      resource.description
                    )}
                  </div>
                ),
              )}
          </div>
        </>
      )}

      {/* Contributing Section */}
      {hasRealData && packageData.pypiData.contributing && (
        <>
          <Title headingLevel="h2" size="xl" style={{ marginTop: "2rem" }}>
            Contributing
          </Title>
          <p style={{ marginTop: "0.5rem" }}>
            {packageData.pypiData.contributing.description}
          </p>
          {packageData.pypiData.contributing.steps && (
            <div style={{ marginTop: "1rem" }}>
              <ol style={{ paddingLeft: "1.5rem" }}>
                {packageData.pypiData.contributing.steps.map((step, index) => (
                  <li key={index} style={{ marginBottom: "0.5rem" }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {packageData.pypiData.contributing.repositoryUrl && (
            <div style={{ marginTop: "1rem" }}>
              <p>
                🔗{" "}
                <a
                  href={packageData.pypiData.contributing.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </a>
              </p>
            </div>
          )}
        </>
      )}

      {/* Security Information */}
      {hasRealData && packageData.pypiData.security && (
        <>
          <Title headingLevel="h2" size="xl" style={{ marginTop: "2rem" }}>
            Security
          </Title>
          <p style={{ marginTop: "0.5rem" }}>
            {packageData.pypiData.security.description}
          </p>
          {packageData.pypiData.security.reportingUrl && (
            <div style={{ marginTop: "1rem" }}>
              <p>
                🛡️{" "}
                <a
                  href={packageData.pypiData.security.reportingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Report Security Vulnerabilities
                </a>
              </p>
            </div>
          )}
          {packageData.pypiData.security.bestPractices && (
            <div style={{ marginTop: "1rem" }}>
              <Title headingLevel="h4" size="md">
                Security Best Practices
              </Title>
              <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                {packageData.pypiData.security.bestPractices.map(
                  (practice, index) => (
                    <li key={index} style={{ marginBottom: "0.25rem" }}>
                      {practice}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Maintainers & Sponsorship */}
      {hasRealData && packageData.pypiData.maintainers && (
        <>
          <Title headingLevel="h2" size="xl" style={{ marginTop: "2rem" }}>
            Maintainers
          </Title>
          <p style={{ marginTop: "0.5rem" }}>This project is maintained by:</p>
          <div style={{ marginTop: "0.5rem" }}>
            {packageData.pypiData.maintainers.map((maintainer, index) => (
              <div key={index} style={{ marginBottom: "0.25rem" }}>
                • <strong>{maintainer.name}</strong>
                {maintainer.role && ` (${maintainer.role})`}
                {maintainer.github && (
                  <>
                    {" "}
                    -{" "}
                    <a
                      href={`https://github.com/${maintainer.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @{maintainer.github}
                    </a>
                  </>
                )}
              </div>
            ))}
          </div>
          {packageData.pypiData.sponsorship && (
            <div style={{ marginTop: "1rem" }}>
              <p>
                💖{" "}
                <a
                  href={packageData.pypiData.sponsorship.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {packageData.pypiData.sponsorship.description}
                </a>
              </p>
            </div>
          )}
        </>
      )}

      {/* Links section */}
      {hasRealData &&
        (packageData.pypiData.documentationUrl ||
          packageData.pypiData.homepageUrl) && (
          <>
            <Title headingLevel="h2" size="xl" style={{ marginTop: "2rem" }}>
              Resources
            </Title>
            <div style={{ marginTop: "0.5rem" }}>
              {packageData.pypiData.documentationUrl && (
                <p>
                  📖{" "}
                  <a
                    href={packageData.pypiData.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Official Documentation
                  </a>
                </p>
              )}
              {packageData.pypiData.homepageUrl &&
                packageData.pypiData.homepageUrl !==
                  packageData.pypiData.documentationUrl && (
                  <p>
                    🏠{" "}
                    <a
                      href={packageData.pypiData.homepageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Homepage
                    </a>
                  </p>
                )}
            </div>
          </>
        )}
    </PageSection>
  );
};
