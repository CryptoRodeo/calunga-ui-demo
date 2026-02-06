/**
 * Barrel module that conditionally exports Pulp API functions.
 *
 * When ENV.MOCK is "on", exports mock implementations from ./mock/mock-api.ts
 * that serve data from static JSON fixtures. Otherwise, exports real
 * implementations from ./rest.ts that make live HTTP requests to Pulp.
 *
 * All consumers should import Pulp-specific functions from this module
 * instead of directly from rest.ts.
 */
import ENV from "@app/env";
import type {
  HubPaginatedResult,
  HubRequestParams,
  PulpDistribution,
} from "./models";

// PULP_ENDPOINTS is always from rest.ts — just string constants
export { PULP_ENDPOINTS } from "./rest";

// Import both implementations
import {
  getAllDistributions as realGetAllDistributions,
  getPulpPaginatedResult as realGetPulpPaginatedResult,
  getDistributionForContent as realGetDistributionForContent,
  getDistributionByBasePath as realGetDistributionByBasePath,
  getSimplePackageNames as realGetSimplePackageNames,
} from "./rest";

import {
  getAllDistributions as mockGetAllDistributions,
  getPulpPaginatedResult as mockGetPulpPaginatedResult,
  getDistributionForContent as mockGetDistributionForContent,
  getDistributionByBasePath as mockGetDistributionByBasePath,
  getSimplePackageNames as mockGetSimplePackageNames,
} from "./mock";

const useMock = ENV.MOCK === "on";

export const getAllDistributions: () => Promise<PulpDistribution[]> = useMock
  ? mockGetAllDistributions
  : realGetAllDistributions;

export const getPulpPaginatedResult: <T>(
  url: string,
  params?: HubRequestParams,
  extraParams?: Record<string, string | number>,
) => Promise<HubPaginatedResult<T>> = useMock
  ? mockGetPulpPaginatedResult
  : realGetPulpPaginatedResult;

export const getDistributionForContent: (
  contentHref: string,
) => Promise<PulpDistribution | null> = useMock
  ? mockGetDistributionForContent
  : realGetDistributionForContent;

export const getDistributionByBasePath: (
  basePath: string,
) => Promise<PulpDistribution | null> = useMock
  ? mockGetDistributionByBasePath
  : realGetDistributionByBasePath;

export const getSimplePackageNames: (
  basePath: string,
  extraParams?: Record<string, string | number>,
) => Promise<string[]> = useMock
  ? mockGetSimplePackageNames
  : realGetSimplePackageNames;
