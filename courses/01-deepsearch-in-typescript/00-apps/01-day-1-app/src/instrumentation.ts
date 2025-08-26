import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";
import { env } from "./env";

// Automatically invoked by Next.JS
export function register() {
  registerOTel({
    serviceName: "ai-hero-cal",
    traceExporter: new LangfuseExporter({
      environment: env.NODE_ENV,
      baseUrl: env.LANGFUSE_BASEURL,
      publicKey: env.LANGFUSE_PUBLIC_KEY,
      secretKey: env.LANGFUSE_SECRET_KEY,
    }),
  });
}
