/** Define process.env to contain `CalungaEnvType` */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv extends Partial<Readonly<CalungaEnvType>> {}
  }
}

/**
 * The set of environment variables used by `@calunga-ui` packages.
 */
export type CalungaEnvType = {
  NODE_ENV: "development" | "production" | "test";
  VERSION: string;

  /** Controls how mock data is injected on the client */
  MOCK: string;

  /** Enable RBAC authentication/authorization */
  AUTH_REQUIRED: "true" | "false";

  /** SSO / Oidc client id */
  OIDC_CLIENT_ID?: string;

  /** SSO / Oidc scope */
  OIDC_SCOPE?: string;

  /** UI upload file size limit in megabytes (MB), suffixed with "m" */
  UI_INGRESS_PROXY_BODY_SIZE: string;

  /** The listen port for the UI's server */
  PORT?: string;

  /** Target URL for the UI server's `/auth` proxy */
  OIDC_SERVER_URL?: string;

  /** Whether or not `/auth` proxy will be enabled */
  OIDC_SERVER_IS_EMBEDDED?: "true" | "false";

  /** The Keycloak Realm */
  OIDC_SERVER_EMBEDDED_PATH?: string;

  /** Target URL for the UI server's `/api` proxy */
  CALUNGA_API_URL?: string;

  /** Target URL for the UI server's `/pulp` proxy */
  PULP_API_URL?: string;

  /** Pulp service account username for authentication */
  PULP_USERNAME?: string;

  /** Pulp service account password for authentication */
  PULP_PASSWORD?: string;

  /** Pulp domain for multi-tenancy support */
  PULP_DOMAIN?: string;

  /** Whether to verify SSL certificates when connecting to Pulp (server-side only) */
  PULP_VERIFY_SSL?: string;

  /** Location of branding files (relative paths computed from the project source root) */
  BRANDING?: string;
};

/**
 * Keys in `CalungaEnv` that are only used on the server and therefore do not
 * need to be sent to the client.
 */
export const SERVER_ENV_KEYS = [
  "PORT",
  "CALUNGA_API_URL",
  "PULP_API_URL",
  "PULP_USERNAME",
  "PULP_PASSWORD",
  "PULP_VERIFY_SSL",
  "BRANDING",
];

/**
 * Create a `CalungaEnv` from a partial `CalungaEnv` with a set of default values.
 */
export const buildCalungaEnv = ({
  NODE_ENV = "production",
  PORT,
  VERSION = "99.0.0",
  MOCK = "off",

  OIDC_SERVER_URL,
  OIDC_SERVER_IS_EMBEDDED = "false",
  OIDC_SERVER_EMBEDDED_PATH,
  AUTH_REQUIRED = "true",
  OIDC_CLIENT_ID,
  OIDC_SCOPE,

  UI_INGRESS_PROXY_BODY_SIZE = "500m",
  CALUNGA_API_URL,
  PULP_API_URL,
  PULP_USERNAME,
  PULP_PASSWORD,
  PULP_DOMAIN,
  PULP_VERIFY_SSL,
  BRANDING,
}: Partial<CalungaEnvType> = {}): CalungaEnvType => ({
  NODE_ENV,
  PORT,
  VERSION,
  MOCK,

  OIDC_SERVER_URL,
  OIDC_SERVER_IS_EMBEDDED,
  OIDC_SERVER_EMBEDDED_PATH,
  AUTH_REQUIRED,
  OIDC_CLIENT_ID,
  OIDC_SCOPE,

  UI_INGRESS_PROXY_BODY_SIZE,
  CALUNGA_API_URL,
  PULP_API_URL,
  PULP_USERNAME,
  PULP_PASSWORD,
  PULP_DOMAIN,
  PULP_VERIFY_SSL,
  BRANDING,
});

/**
 * Default values for `CalungaEnvType`.
 */
export const CALUNGA_ENV_DEFAULTS = buildCalungaEnv();

/**
 * Current `@calunga-ui` environment configurations from `process.env`.
 */
export const CALUNGA_ENV = buildCalungaEnv(process.env);
