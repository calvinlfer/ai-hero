import type { Message } from "ai";
import {
  streamText,
  createDataStreamResponse,
} from "ai";
import { model } from "~/models";
import { auth } from "~/server/auth";
import { z } from "zod";
import { searchSerper } from "~/serper";


export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json()) as {
    messages: Array<Message>;
  };

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const { messages } = body;

      const result = streamText({
        model,
        messages,
        system: [
          "You are a research assistant with access to search the web.",
          "Ensure that the question that the user asks actually requires searching the web before answering.",
          "If the question does not require research, reject it.",
          "Always use the searchWeb tool before answering.",
          "When you have all the information you need, answer the questions and provide inline link citations of your sources.",
          "Try to limit the amount of searchWeb tool calls you make.",
          "Provide some pre-amble to let the user know what you are doing.",
          "Always render the output as markdown."
        ].join("\n"),
        tools: {
          searchWeb: {
            description: "Search the web for information to answer the user's question",
            parameters: z.object({
              query: z.string().describe("The query to search the web for"),
              numResults: z.number().min(10).max(15).describe("The number of results to return [10-15]"),
            }),
            execute: async ({ query, numResults }: { query: string; numResults: number }, { abortSignal }) => {
              console.log(`Serper: Searching for ${query}, limited to ${numResults} results...`);
              const results = await searchSerper({ q: query, num: numResults }, abortSignal);
              const plainResults = results.organic.map((r) => ({
                title: r.title,
                link: r.link,
                snippet: r.snippet,
              }))
              console.log(`Serper: Response for ${query}:`)
              console.dir(plainResults)
              return plainResults;
            }
          }
        },
        maxSteps: 10
      });

      result.mergeIntoDataStream(dataStream);
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occurred!";
    },
  });
}
