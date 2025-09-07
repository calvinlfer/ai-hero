import z from "zod";
import { type Tools } from "~/server/aitooling/deepsearch";
import { searchSerper } from "~/serper";
import { env } from "~/env";

export const searchTool: Tools = {
  searchWeb: {
    description: "Search the web for information to answer the user's question",
    parameters: z.object({
      query: z.string().describe("The query to search the web for")
    }),
    execute: async ({ query }: { query: string }, { abortSignal }) => {
      const results = await searchSerper({ q: query, num: env.SEARCH_RESULTS_COUNT }, abortSignal);
      const plainResults = results.organic.map((r) => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet,
        date: r.date,
      }))
      return plainResults;
    }
  }
}