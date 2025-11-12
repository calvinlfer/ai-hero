export interface SearchAction {
  type: "search";
  query: string;
}

export interface ScrapeAction {
  type: "scrape";
  urls: string[];
}

export interface AnswerAction {
  type: "answer";
}

// The next action to perform (this is given back to us by the LLM)
export type Action = SearchAction | ScrapeAction | AnswerAction;
