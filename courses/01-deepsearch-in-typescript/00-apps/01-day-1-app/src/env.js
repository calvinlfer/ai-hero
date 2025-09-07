import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    REDIS_URL: z.string().url(),
    OPENAI_API_KEY: z.string(),
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "production"])
      .default("development"),
    SERPER_API_KEY: z.string(),
    LANGFUSE_BASEURL: z.string().url(),
    LANGFUSE_PUBLIC_KEY: z.string(),
    LANGFUSE_SECRET_KEY: z.string(),
    JINA_API_KEY: z.string(),
    SEARCH_RESULTS_COUNT: z.coerce.number().min(2).max(15).default(10),
    EVAL_DATASET: z
      .enum(["dev", "ci", "regression"])
      .default("dev"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {},

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    REDIS_URL: process.env.REDIS_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    SERPER_API_KEY: process.env.SERPER_API_KEY,
    LANGFUSE_BASEURL: process.env.LANGFUSE_BASEURL,
    LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY,
    LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY,
    JINA_API_KEY: process.env.JINA_API_KEY,
    EVAL_DATASET: process.env.EVAL_DATASET,
    SEARCH_RESULTS_COUNT: process.env.SEARCH_RESULTS_COUNT,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
