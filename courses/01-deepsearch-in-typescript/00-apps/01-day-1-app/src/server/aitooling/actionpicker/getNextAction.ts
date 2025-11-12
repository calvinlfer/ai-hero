import { generateObject } from "ai";
import type { SystemContext } from "../context/SystemContext";
import { model } from "~/models";
import { z } from "zod";
import { match, P } from "ts-pattern";
import type {
  Action,
  AnswerAction,
  ScrapeAction,
  SearchAction,
} from "./Action";

const actionSchema = z.object({
  type: z.enum(["search", "scrape", "answer"]).describe(
    `The type of action to take.
      - 'search': Search the web for more information.
      - 'scrape': Scrape a URL.
      - 'answer': Answer the user's question and complete the loop.`,
  ),
  query: z
    .string()
    .describe("The query to search for. Required if type is 'search'.")
    .optional(),
  urls: z
    .array(z.string())
    .describe("The URLs to scrape. Required if type is 'scrape'.")
    .optional(),
});

export const getNextAction: (
  context: SystemContext,
) => Promise<Action> = async (context: SystemContext) => {
  const result = await generateObject({
    model,
    schema: actionSchema,
    prompt: `You are a helpful assistant that can search the web, scrape a URL, or answer the user's question.
    Here is the context:

    ${context.getQueryHistory()}

    ${context.getScrapeHistory()}
    `,
  });

  const out: Action = match(result.object)
    .with({ type: "search", query: P.select() }, (query) => {
      const out: SearchAction = {
        type: "search",
        query: query ?? "",
      };
      return out;
    })
    .with({ type: "scrape", urls: P.select() }, (urls) => {
      const out: ScrapeAction = {
        type: "scrape",
        urls: urls ?? [],
      };
      return out;
    })
    .with({ type: "answer" }, () => {
      const out: AnswerAction = {
        type: "answer",
      };
      return out;
    })
    .exhaustive();

  return out;
};
