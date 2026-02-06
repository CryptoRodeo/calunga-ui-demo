import type {
  PulpPythonPackageContent,
  PulpPackageProvenance,
  PulpDistribution,
} from "@app/api/models";
import type {
  Package,
  PackageVersion,
  Attestation,
} from "@pages/search/search-context";
import { formatDate } from "./utils";

/**
 * Transforms Pulp content to UI Package model.
 * Handles optional aggregated data (versions, provenances, distribution).
 */
export const transformPulpContentToPackage = (
  content: PulpPythonPackageContent,
  allVersions?: PulpPythonPackageContent[],
  provenances?: PulpPackageProvenance[],
  distribution?: PulpDistribution | null,
): Package => {
  return {
    id: content.pulp_href,
    name: content.name,
    version: content.version,
    description:
      content.summary || content.description?.substring(0, 200) || "",
    fullDescription: content.description,

    // MVP: Stub downloads (no analytics yet)
    downloads: 0,

    // Format Pulp timestamp
    updated: formatDate(content.pulp_created) || "Unknown",

    // Author with fallback to maintainer
    author: content.author || content.maintainer || "Unknown",

    // License with fallback to license_expression
    license: content.license || content.license_expression || "Unknown",

    // Tags from classifiers (ensure it's always an array)
    tags: Array.isArray(content.classifiers) ? content.classifiers : [],

    // Wheel-specific fields
    wheelName: content.filename,
    pythonVersion: content.python_version,

    // Index from distribution name
    index: distribution?.name || "unknown",

    // Aggregated versions
    versions: allVersions?.map(transformToPackageVersion) || [],

    // Attestations from provenances
    currentVersionAttestations: provenances?.map(transformToAttestation) || [],

    // Computed trust metrics
    trustScore: computeTrustScore(provenances),
    slsaLevel: extractSlsaLevel(provenances),
  };
};

/**
 * Transforms Pulp content to PackageVersion for version list.
 */
export const transformToPackageVersion = (
  content: PulpPythonPackageContent,
): PackageVersion => {
  return {
    version: content.version,
    releaseDate: formatDate(content.pulp_created) || "Unknown",
    downloads: 0, // MVP: stub
  };
};

/**
 * Transforms Pulp PackageProvenance to UI Attestation.
 */
export const transformToAttestation = (
  provenance: PulpPackageProvenance,
): Attestation => {
  const pep740 = provenance.provenance;

  return {
    type: "PEP 740 Provenance",
    verifier: pep740.publisher?.name || "Unknown",
    timestamp: pep740.upload_time || provenance.pulp_created,
    status: "verified", // Assume verified if stored in Pulp

    // Extract SLSA level from attestations
    slsaLevel: pep740.attestations?.[0]?.slsa_level,
    digestSha256: provenance.sha256,
    issuer: pep740.publisher?.kind,

    // Store full provenance in metadata
    metadata: pep740,
  };
};

/**
 * Computes trust score from attestations.
 * Simple heuristic: number of attestations (0-100 scale).
 */
export const computeTrustScore = (
  provenances?: PulpPackageProvenance[],
): number => {
  if (!provenances || provenances.length === 0) return 0;

  // Simple scoring: 50 base + 10 per attestation (max 100)
  const attestationBonus = Math.min(provenances.length * 10, 50);
  return 50 + attestationBonus;
};

/**
 * Extracts highest SLSA level from attestations.
 */
export const extractSlsaLevel = (
  provenances?: PulpPackageProvenance[],
): number | undefined => {
  if (!provenances || provenances.length === 0) return undefined;

  const levels = provenances
    .flatMap((p) => p.provenance.attestations || [])
    .map((a) => a.slsa_level)
    .filter((level): level is number => typeof level === "number");

  return levels.length > 0 ? Math.max(...levels) : undefined;
};
