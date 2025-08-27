import { openai } from "@ai-sdk/openai";
import { ollama } from "ollama-ai-provider"
import "./env.js";

export const model = openai('gpt-5-nano');

export const localModel = ollama('qwen3:8b', {
  simulateStreaming: true,
})


