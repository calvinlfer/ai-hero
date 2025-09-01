import { cacheWithRedis } from "../redis/cacheFn";
import type { BulkCrawlOptions, BulkCrawlResponse, CrawlErrorResponse, CrawlOptions, CrawlResponse } from "./models";
import { env } from "~/env";
import { setTimeout } from "node:timers/promises";

const DEFAULT_MAX_RETRIES = 3;
const MIN_DELAY_MS = 500;  // 0.5 seconds
const MAX_DELAY_MS = 8000; // 8 seconds

export const crawlWebsite = cacheWithRedis(
  "jinaReader",
  async (options: CrawlOptions & { url: string }): Promise<CrawlResponse> => {
    const jinaReaderBaseUrl = 'https://r.jina.ai';
    const targetUrl = encodeURIComponent(options.url);
    const url = `${jinaReaderBaseUrl}/${targetUrl}`;
    const makeRequest = async () => await fetch(url, {
      headers: {
        "Authorization": `Bearer ${env.JINA_API_KEY}`,
        'X-Return-Format': 'markdown'
      },
    });

    const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        const response = await makeRequest();
        if (response.ok) {
          const data = await response.text();
          return {
            success: true,
            data,
          };
        } else if (response.status >= 400 && response.status < 500) {
          return {
            success: false,
            error: `Failed to fetch website: ${response.status} ${response.statusText}`,
          };
        }

        attempts = attempts + 1;
        if (attempts === maxRetries) {
          return {
            success: false,
            error: `Failed to fetch website after ${maxRetries} attempts: ${response.status} ${response.statusText}`,
          };
        }

        // Exponential backoff: 0.5s, 1s, 2s, 4s, 8s max
        const delay = Math.min(
          MIN_DELAY_MS * Math.pow(2, attempts),
          MAX_DELAY_MS,
        );
        await setTimeout(delay);
      } catch (error) {
        attempts = attempts + 1;
        if (attempts === maxRetries) {
          return {
            success: false,
            error: `Network error after ${maxRetries} attempts: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
        const delay = Math.min(
          MIN_DELAY_MS * Math.pow(2, attempts),
          MAX_DELAY_MS,
        );
        await setTimeout(delay);
      }
    }

    return {
      success: false,
      error: "Maximum retry attempts reached",
    };
  });

export const bulkCrawlWebsites = async (
  options: BulkCrawlOptions,
): Promise<BulkCrawlResponse> => {
  const { urls, maxRetries = DEFAULT_MAX_RETRIES } =
    options;

  const results = await Promise.all(
    urls.map(async (url) => ({
      url,
      result: await crawlWebsite({ url, maxRetries }),
    })),
  );

  const allSuccessful = results.every(
    (r) => r.result.success,
  );

  if (!allSuccessful) {
    const errors = results
      .filter((r) => !r.result.success)
      .map(
        (r) =>
          `${r.url}: ${(r.result as CrawlErrorResponse).error}`,
      )
      .join("\n");

    return {
      results,
      success: false,
      error: `Failed to crawl some websites:\n${errors}`,
    };
  }

  return {
    results,
    success: true,
  } as BulkCrawlResponse;
};