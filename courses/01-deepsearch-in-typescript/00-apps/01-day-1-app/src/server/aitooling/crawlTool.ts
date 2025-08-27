import z from "zod";
import { type Tools } from "~/server/aitooling/deepsearch";
import { bulkCrawlWebsites } from "~/server/scrape/jina-reader";

export const crawlTool: Tools = {
  scrapeUrls: {
    description: "Scrape the content from specific URLs",
    parameters: z.object({
      urls: z.string().array().describe("URLs that you want to scrape")
    }),
    execute: async ({ urls }: { urls: string[] }) => {
      return await bulkCrawlWebsites({ urls });
    }
  }
}