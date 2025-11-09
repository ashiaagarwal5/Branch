import * as functions from 'firebase-functions';

interface RuntimeConfig {
  app?: {
    jwt_secret?: string;
    refresh_secret?: string;
    access_token_ttl_seconds?: string;
    refresh_token_ttl_days?: string;
    extension_access_ttl_seconds?: string;
  };
  services?: {
    classification_url?: string;
    image_generation_url?: string;
  };
}

const runtimeConfig = (() => {
  try {
    return (functions.config() || {}) as RuntimeConfig;
  } catch {
    return {} as RuntimeConfig;
  }
})();

const env = {
  projectId:
    process.env.GCLOUD_PROJECT ||
    process.env.PROJECT_ID ||
    (runtimeConfig as any)?.project?.id ||
    '',
  jwtSecret:
    process.env.JWT_SECRET ||
    runtimeConfig.app?.jwt_secret ||
    'insecure-development-secret',
  refreshTokenSecret:
    process.env.REFRESH_TOKEN_SECRET ||
    runtimeConfig.app?.refresh_secret ||
    'insecure-development-refresh-secret',
  accessTokenTtlSeconds: Number(
    process.env.ACCESS_TOKEN_TTL_SECONDS ||
      runtimeConfig.app?.access_token_ttl_seconds ||
      3600
  ),
  extensionAccessTokenTtlSeconds: Number(
    process.env.EXTENSION_ACCESS_TOKEN_TTL_SECONDS ||
      runtimeConfig.app?.extension_access_ttl_seconds ||
      900
  ),
  refreshTokenTtlDays: Number(
    process.env.REFRESH_TOKEN_TTL_DAYS ||
      runtimeConfig.app?.refresh_token_ttl_days ||
      7
  ),
  classificationServiceUrl:
    process.env.CLASSIFICATION_SERVICE_URL ||
    runtimeConfig.services?.classification_url ||
    '',
  imageGenerationServiceUrl:
    process.env.IMAGE_GENERATION_SERVICE_URL ||
    runtimeConfig.services?.image_generation_url ||
    '',
};

export type Environment = typeof env;

export { env };
