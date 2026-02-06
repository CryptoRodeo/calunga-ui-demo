import * as cookie from "cookie";
import { CALUNGA_ENV } from "@calunga-ui/common";

const logger =
  process.env.DEBUG === "1"
    ? console
    : {
        info() {},
        warn: console.warn,
        error: console.error,
      };

/**
 * Creates a proxyReq handler for Pulp-style proxies with shared
 * Basic Auth, header forwarding, and optional content-type overrides.
 */
function createPulpProxyReqHandler(options = {}) {
  const { setContentHeaders = false } = options;
  return (proxyReq, req, _res) => {
    // Add Basic Auth if credentials are provided
    if (CALUNGA_ENV.PULP_USERNAME && CALUNGA_ENV.PULP_PASSWORD) {
      const credentials = Buffer.from(
        `${CALUNGA_ENV.PULP_USERNAME}:${CALUNGA_ENV.PULP_PASSWORD}`,
      ).toString("base64");
      proxyReq.setHeader("Authorization", `Basic ${credentials}`);
    }

    // Optionally set Accept and Content-Type headers
    if (setContentHeaders) {
      proxyReq.setHeader("Accept", "application/json");
      proxyReq.setHeader("Content-Type", "application/json");
    }

    // Forward original headers
    req.socket.remoteAddress &&
      proxyReq.setHeader("X-Forwarded-For", req.socket.remoteAddress);
    req.socket.remoteAddress &&
      proxyReq.setHeader("X-Real-IP", req.socket.remoteAddress);
    req.headers.host &&
      proxyReq.setHeader("X-Forwarded-Host", req.headers.host);
  };
}

export const proxyMap = {
  ...(CALUNGA_ENV.OIDC_SERVER_IS_EMBEDDED === "true" && {
    auth: {
      pathFilter: "/auth",
      target: CALUNGA_ENV.OIDC_SERVER_URL || "http://localhost:8090",
      logger,
      changeOrigin: true,
      on: {
        proxyReq: (proxyReq, req, _res) => {
          req.socket.remoteAddress &&
            proxyReq.setHeader("X-Forwarded-For", req.socket.remoteAddress);
          req.socket.remoteAddress &&
            proxyReq.setHeader("X-Real-IP", req.socket.remoteAddress);
          req.headers.host &&
            proxyReq.setHeader("X-Forwarded-Host", req.headers.host);
        },
      },
    },
  }),
  api: {
    pathFilter: "/api",
    target: CALUNGA_ENV.CALUNGA_API_URL || "http://localhost:8080",
    logger,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req, _res) => {
        const cookies = cookie.parse(req.headers.cookie ?? "");
        const bearerToken = cookies.keycloak_cookie;
        if (bearerToken && !req.headers.authorization) {
          proxyReq.setHeader("Authorization", `Bearer ${bearerToken}`);
        }
      },
      proxyRes: (proxyRes, req, res) => {
        if (
          !req.headers.accept?.includes("application/json") &&
          (proxyRes.statusCode === 401 ||
            proxyRes.statusMessage === "Unauthorized")
        ) {
          res.writeHead(302, { Location: "/" }).end();
          proxyRes?.destroy();
        }
      },
    },
  },
  openapi: {
    pathFilter: "/openapi",
    target: CALUNGA_ENV.CALUNGA_API_URL || "http://localhost:8080",
    logger,
    changeOrigin: true,
  },
  openapiJson: {
    pathFilter: "/openapi.json",
    target: CALUNGA_ENV.CALUNGA_API_URL || "http://localhost:8080",
    logger,
    changeOrigin: true,
  },
  pulp: {
    pathFilter: "/pulp",
    target: CALUNGA_ENV.PULP_API_URL || "http://localhost:24817",
    pathRewrite: { "^/pulp": "" },
    logger,
    changeOrigin: true,
    secure: CALUNGA_ENV.PULP_VERIFY_SSL !== "false",
    on: {
      proxyReq: createPulpProxyReqHandler({ setContentHeaders: true }),
    },
  },
  pypi: {
    pathFilter: "/pypi",
    target:
      CALUNGA_ENV.PYPI_API_URL ||
      (CALUNGA_ENV.PULP_API_URL || "http://localhost:24817").replace(
        "/pulp/",
        "/pypi/",
      ),
    pathRewrite: { "^/pypi": "" },
    logger,
    changeOrigin: true,
    secure: CALUNGA_ENV.PULP_VERIFY_SSL !== "false",
    on: {
      proxyReq: createPulpProxyReqHandler(),
    },
  },
};
