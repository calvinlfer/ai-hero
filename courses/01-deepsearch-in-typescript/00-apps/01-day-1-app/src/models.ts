import { google } from "@ai-sdk/google";
import "./env.js";

export const model = google('gemini-2.5-flash', {
  useSearchGrounding: true,
})