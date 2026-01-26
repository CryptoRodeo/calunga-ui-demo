import type React from "react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageSection,
  PageSectionVariants,
  Title,
  SearchInput,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Flex,
  FlexItem,
  Gallery,
  Pagination,
} from "@patternfly/react-core";
import { SearchContext, SearchProvider } from "./search-context";
import { SearchToolbar } from "./search-toolbar";

const SearchContent: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    currentPageItems,
    page,
    setPage,
    perPage,
    setPerPage,
    filteredItemCount,
  } = useContext(SearchContext);

  const navigate = useNavigate();

  const formatDownloads = (downloads: number): string => {
    if (downloads >= 1000000) {
      return `${(downloads / 1000000).toFixed(1)}M`;
    }
    if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(0)}K`;
    }
    return downloads.toString();
  };

  const onSearchChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string,
  ) => {
    setSearchQuery(value);
  };

  const onSearchClear = () => {
    setSearchQuery("");
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1" size="2xl">
          Package Search
        </Title>
        <div style={{ marginTop: "1rem", maxWidth: "600px" }}>
          <SearchInput
            placeholder="Search for packages..."
            value={searchQuery}
            onChange={onSearchChange}
            onClear={onSearchClear}
            aria-label="Search packages"
          />
        </div>
      </PageSection>
      <PageSection>
        <div
          style={{
            backgroundColor: "var(--pf-v6-global--BackgroundColor--100)",
          }}
        >
          <SearchToolbar />
          {currentPageItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                color: "var(--pf-v6-global--Color--200)",
              }}
            >
              <Title headingLevel="h3" size="lg">
                No packages found
              </Title>
              <p>
                {searchQuery
                  ? `No packages match your search "${searchQuery}"`
                  : "No packages available"}
              </p>
            </div>
          ) : (
            <>
              <div style={{ padding: "1rem" }}>
                <Gallery
                  hasGutter
                  minWidths={{
                    default: "100%",
                  }}
                >
                  {currentPageItems.map((pkg) => (
                    <Card
                      key={pkg.id}
                      isCompact
                      // isClickable
                      onClick={() => navigate(`/search/${pkg.id}`)}
                      style={{
                        cursor: "pointer",
                        border:
                          "1px solid var(--pf-v6-global--BorderColor--100)",
                        boxShadow: "var(--pf-v6-global--BoxShadow--sm)",
                      }}
                    >
                      <CardHeader>
                        <Flex
                          alignItems={{ default: "alignItemsCenter" }}
                          spaceItems={{ default: "spaceItemsSm" }}
                        >
                          <FlexItem>
                            <Title headingLevel="h3" size="lg">
                              {pkg.name}
                            </Title>
                          </FlexItem>
                          <FlexItem>
                            <Badge isRead>{pkg.version}</Badge>
                          </FlexItem>
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <p>{pkg.description}</p>
                      </CardBody>
                      <CardFooter>
                        <Flex
                          spaceItems={{ default: "spaceItemsLg" }}
                          style={{
                            fontSize: "var(--pf-v6-global--FontSize--sm)",
                            color: "var(--pf-v6-global--Color--200)",
                          }}
                        >
                          <FlexItem>
                            📥 {formatDownloads(pkg.downloads)} downloads
                          </FlexItem>
                          <FlexItem>📅 Updated {pkg.updated}</FlexItem>
                          <FlexItem>👤 {pkg.author}</FlexItem>
                          <FlexItem>📄 {pkg.license}</FlexItem>
                        </Flex>
                      </CardFooter>
                    </Card>
                  ))}
                </Gallery>
              </div>
              <div
                style={{
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Pagination
                  itemCount={filteredItemCount}
                  perPage={perPage}
                  page={page}
                  onSetPage={(_event, newPage) => setPage(newPage)}
                  onPerPageSelect={(_event, newPerPage) =>
                    setPerPage(newPerPage)
                  }
                  perPageOptions={[
                    { title: "10", value: 10 },
                    { title: "20", value: 20 },
                    { title: "50", value: 50 },
                  ]}
                />
              </div>
            </>
          )}
        </div>
      </PageSection>
    </>
  );
};

export const Search: React.FC = () => {
  return (
    <SearchProvider>
      <SearchContent />
    </SearchProvider>
  );
};
