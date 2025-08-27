import {
  streamText,
  type LanguageModelV1,
  type Message,
  type StreamTextResult,
  type TelemetrySettings,
} from "ai";
import { searchTool } from "./searchTool";
import { crawlTool } from "./crawlTool";

export type OnFinishCallback = Parameters<
  typeof streamText
>[0]["onFinish"];

export type Tools = Exclude<Parameters<typeof streamText>[0]["tools"], undefined>;

export type DeepSearchParams<T extends Tools> = {
  timeNow?: Date
  model: LanguageModelV1
  tools?: T
  messages: Message[]
  onFinish: OnFinishCallback
  telemetry: TelemetrySettings
}

/**
 *
 * @param opts the options to pass to the streamText function
 * @returns a stream of net-new messages transmitted from the agent
 */
export const streamFromDeepSearch: <T extends Tools>(opts: DeepSearchParams<T>) => StreamTextResult<T, never> =
  <T extends Tools>(opts: DeepSearchParams<T>) => {
    const now = opts.timeNow ?? new Date();
    const tools = opts.tools ?? {
      ...searchTool,
      ...crawlTool,
    };

    return streamText({
      model: opts.model,
      messages: opts.messages,
      maxSteps: 10,
      system: `
    You are a research assistant with access to search the web.
    Ensure that the question that the user asks actually requires searching the web before answering.
    If the question does not require research, reject it.
    Always use the searchWeb tool before answering.
    Gather a variety of sources (URLs) from searchWeb before using them in scrapeUrls.
    When you have all the information you need, answer the questions and provide inline link citations of your sources.
    Prioritize recent information.

    The current date is ${now.toISOString()}.

    Workflow:
    1. Provide some pre-amble to let the user know what you are doing.
    2. Use the scrapeUrls tool to get more information from specific URLs.
    3. Always render the output as GitHub flavoured Markdown.`,
      tools: tools,
      onFinish: opts.onFinish,
      experimental_telemetry: opts.telemetry,
    });
  }

export const askDeepSearch =
  async ({ model, messages }: { model: LanguageModelV1, messages: Message[] }) => {
    const stream = streamFromDeepSearch({
      model,
      messages,
      onFinish: () => { },
      telemetry: {
        isEnabled: false,
      },
    })
    await stream.consumeStream();
    return await stream.text;
  }