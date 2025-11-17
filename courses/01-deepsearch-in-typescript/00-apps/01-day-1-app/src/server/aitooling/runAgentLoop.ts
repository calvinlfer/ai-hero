import { streamText, type StreamTextResult } from "ai";
import { SystemContext } from "./context/SystemContext";
import { getNextAction } from "./actionpicker/getNextAction";
import type { Action } from "./actionpicker/Action";
import { searchSerper } from "~/serper";
import { bulkCrawlWebsites } from "~/server/scrape/jina-reader";
import { env } from "~/env";
import { model } from "~/models";

export async function runAgentLoop(initialQuestion: string) {
  const context = new SystemContext(initialQuestion);

  while (!context.shouldStop()) {
    // Ask for the next action
    const action: Action = await getNextAction(context);
    if (action.type === "search") {
      const results = await searchSerper(
        { q: action.query, num: env.SEARCH_RESULTS_COUNT },
        undefined,
      );
      context.reportQueries([
        {
          query: action.query,
          results: results.organic.map((result) => ({
            date: result.date ?? new Date().toISOString(),
            title: result.title,
            url: result.link,
            snippet: result.snippet,
          })),
        },
      ]);
    } else if (action.type === "scrape") {
      const scrapes = await bulkCrawlWebsites({ urls: action.urls });
      if (scrapes.success) {
        context.reportScrapes(
          scrapes.results.map(({ url, result }) => ({
            url,
            result: result.data,
          })),
        );
      }
    } else if (action.type === "answer") {
      return answerQuestion(context);
    }

    context.incrementStep();
  }
  // ran out of steps, give final answer
  return answerQuestion(context, { isFinal: true });
}

export function answerQuestion(
  ctx: SystemContext,
  opts: {
    isFinal?: boolean;
  } = {},
): StreamTextResult<{}, string> {
  const { isFinal = false } = opts;

  return streamText({
    model,
    system: `You are a helpful AI assistant that answers questions based on the information gathered from web searches and scraped content.

    When answering:
    1. Be thorough but concise
    2. Always cite your sources using markdown links
    3. If you're unsure about something, say so
    4. Format URLs as markdown links using [title](url)
    5. Never include raw URLs

    ${isFinal ? "Note: We may not have all the information needed to answer the question completely. Please provide your best attempt at an answer based on the available information." : ""}`,
    prompt: `Question: ${ctx.getQuestion()}

    Based on the following context, please answer the question:

    ${ctx.getQueryHistory()}

    ${ctx.getScrapeHistory()}
    `,
  });
}
