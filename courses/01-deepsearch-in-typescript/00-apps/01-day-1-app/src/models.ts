import { openai } from "@ai-sdk/openai";
import "./env.js";

export const model = openai('gpt-5-nano');
