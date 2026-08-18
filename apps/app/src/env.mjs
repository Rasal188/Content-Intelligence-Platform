import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  shared: {
    VERCEL_URL: z
      .string()
      .optional()
      .transform((v) => (v ? `https://${v}` : undefined)),
    PORT: z.coerce.number().default(3000),
  },
  server: {
    DEV_BYPASS_AUTH: z.optional(z.string()),
    OLLAGRAPH_API_KEY: z.optional(z.string()),
    OLLAGRAPH_API_URL: z.optional(z.string()),
    OLLIMA_API_KEY: z.optional(z.string()),
    OLLIMA_API_BASE_URL: z.optional(z.string()),
    OLLIMA_MODEL: z.optional(z.string()),
    OLLIMA_TIMEOUT: z.optional(z.string()),
    OLLIMA_MAX_RETRIES: z.optional(z.string()),
    PROMPT_VERSION: z.optional(z.string()),
  },
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.string(),
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID: z.optional(z.string()),
    NEXT_PUBLIC_SENTRY_DSN: z.optional(z.string()),
  },
  runtimeEnv: {
    DEV_BYPASS_AUTH: process.env.DEV_BYPASS_AUTH,
    OLLAGRAPH_API_KEY: process.env.OLLAGRAPH_API_KEY,
    OLLAGRAPH_API_URL: process.env.OLLAGRAPH_API_URL,
    OLLIMA_API_KEY: process.env.OLLIMA_API_KEY,
    OLLIMA_API_BASE_URL: process.env.OLLIMA_API_BASE_URL,
    OLLIMA_MODEL: process.env.OLLIMA_MODEL,
    OLLIMA_TIMEOUT: process.env.OLLIMA_TIMEOUT,
    OLLIMA_MAX_RETRIES: process.env.OLLIMA_MAX_RETRIES,
    PROMPT_VERSION: process.env.PROMPT_VERSION,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID:
      process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    PORT: process.env.PORT,
    VERCEL_URL: process.env.VERCEL_URL,
  },
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
});
