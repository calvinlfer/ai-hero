import z from "zod";
import { type Tools } from "~/server/aitooling/deepsearch";
import { searchSerper } from "~/serper";

export const searchTool: Tools = {
  searchWeb: {
    description: "Search the web for information to answer the user's question",
    parameters: z.object({
      query: z.string().describe("The query to search the web for"),
      numResults: z.number().min(10).max(15).describe("The number of results to return [10-15]"),
    }),
    execute: async ({ query, numResults }: { query: string; numResults: number }, { abortSignal }) => {
      const results = await searchSerper({ q: query, num: numResults }, abortSignal);
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