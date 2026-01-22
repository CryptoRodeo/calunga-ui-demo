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
};
