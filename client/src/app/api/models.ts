import type { Labels } from "@app/client";
import type { Severity } from "@app/client";

export type WithUiId<T> = T & { _ui_unique_id: string };

/** Mark an object as "New" therefore does not have an `id` field. */
export type New<T extends { id: number }> = Omit<T, "id">;

export interface HubFilter {
  field: string;
  operator?: "=" | "!=" | "~" | "~~" | ">" | ">=" | "<" | "<=";
  value:
    | string
    | number
    | {
        list: (string | number)[];
        operator?: "AND" | "OR";
      };
}

export interface HubRequestParams {
  filters?: HubFilter[];
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
  page?: {
    pageNumber: number; // 1-indexed
    itemsPerPage: number;
  };
}

export interface HubPaginatedResult<T> {
  data: T[];
  total: number;
  params: HubRequestParams;
}

// Common

export type VulnerabilityStatus =
  | "fixed"
  | "not_affected"
  | "known_not_affected"
  | "under_investigation"
  | "affected";

export interface DecomposedPurl {
  type: string;
  name: string;
  namespace?: string;
  version?: string;
  qualifiers?: Labels;
  path?: string;
}

export type ExtendedSeverity = Severity | "unknown";
export const extendedSeverityFromSeverity = (
  value?: Severity | null,
): ExtendedSeverity => value ?? "unknown";

// User preferences

export interface WatchedSboms {
  sbom1Id: string | null;
  sbom2Id: string | null;
  sbom3Id: string | null;
  sbom4Id: string | null;
}

//

export interface Label {
  key: string;
  value?: string;
}

// Pulp API Types

/**
 * Pulp pagination response format (different from Hub)
 */
export interface PulpPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Pulp Python Package Content model
 * Represents a Python package distribution (wheel, sdist, etc.) in Pulp
 */
export interface PulpPythonPackageContent {
  pulp_href: string;
  pulp_created: string;
  pulp_last_updated: string;
  pulp_type: "python.python";

  // Core metadata
  name: string;
  version: string;
  summary: string;
  description: string;
  author: string;
  author_email: string;
  maintainer: string;
  maintainer_email: string;
  license: string;
  license_expression: string;

  // Classification
  classifiers: string[];
  keywords: string;

  // URLs
  home_page: string;
  project_urls: Record<string, string>;

  // Dependencies
  requires_dist: string[];
  requires_python: string;

  // Release metadata
  filename: string;
  packagetype: "bdist_wheel" | "sdist" | "bdist_egg";
  python_version: string;
  platform: string;
  sha256: string;
  size: number;
}

/**
 * PEP 740 Attestation Structure
 */
export interface PEP740Provenance {
  version: 1;
  upload_time: string;
  publisher?: {
    kind: string;
    name: string;
  };
  attestations?: Array<{
    slsa_level?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/**
 * Pulp Package Provenance (PEP 740)
 * Represents cryptographic attestations for package authenticity
 */
export interface PulpPackageProvenance {
  pulp_href: string;
  pulp_created: string;
  package: string; // href to PythonPackageContent
  provenance: PEP740Provenance;
  sha256: string;
}

/**
 * PyPI JSON Metadata API response format (PEP 566)
 * Returned by GET /pypi/{basePath}/pypi/{packageName}/json/
 */
export interface PyPIPackageMetadata {
  info: {
    name: string;
    version: string;
    summary: string;
    description: string;
    description_content_type: string | null;
    author: string;
    author_email: string;
    maintainer: string;
    maintainer_email: string;
    license: string;
    license_expression: string | null;
    requires_python: string | null;
    classifiers: string[] | null;
    keywords: string | null;
    home_page: string | null;
    project_urls: Record<string, string> | null;
    requires_dist: string[] | null;
    platform: string | null;
    provides_extras: string[] | null;
    yanked: boolean;
    yanked_reason: string | null;
  };
  releases: Record<
    string,
    Array<{
      filename: string;
      packagetype: string;
      python_version: string;
      requires_python: string | null;
      size: number;
      upload_time: string;
      upload_time_iso_8601: string;
      digests: { md5: string; sha256: string };
      yanked: boolean;
      yanked_reason: string | null;
      url: string;
    }>
  >;
  urls: Array<{
    filename: string;
    packagetype: string;
    python_version: string;
    requires_python: string | null;
    size: number;
    upload_time: string;
    upload_time_iso_8601: string;
    digests: { md5: string; sha256: string };
    yanked: boolean;
    yanked_reason: string | null;
    url: string;
  }>;
  last_serial: number;
}

/**
 * Pulp Distribution model
 * Represents where content is served from (like a PyPI index)
 */
export interface PulpDistribution {
  pulp_href: string;
  pulp_created: string;
  name: string;
  base_path: string;
  base_url: string;
  repository: string | null;
  publication: string | null;
  repository_version: string | null;
  hidden: boolean;
}
