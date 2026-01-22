import { buildCalungaEnv, decodeEnv } from "@calunga-ui/common";

export const ENV = buildCalungaEnv(decodeEnv(window._env));

export default ENV;
