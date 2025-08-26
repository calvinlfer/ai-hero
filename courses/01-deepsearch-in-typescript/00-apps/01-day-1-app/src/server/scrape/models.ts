export interface CrawlSuccessResponse {
  success: true;
  data: string;
}

export interface CrawlErrorResponse {
  success: false;
  error: string;
}

export type CrawlResponse =
  | CrawlSuccessResponse
  | CrawlErrorResponse;

export interface BulkCrawlSuccessResponse {
  success: true;
  results: {
    url: string;
    result: CrawlSuccessResponse;
  }[];
}

export interface BulkCrawlFailureResponse {
  success: false;
  results: {
    url: string;
    result: CrawlResponse;
  }[];
  error: string;
}

export type BulkCrawlResponse =
  | BulkCrawlSuccessResponse
  | BulkCrawlFailureResponse;

export interface CrawlOptions {
  maxRetries?: number;
}

export interface BulkCrawlOptions
  extends CrawlOptions {
  urls: string[];
}
