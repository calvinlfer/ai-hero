import { evalite } from "evalite";
import type { Message } from "ai";
import { askDeepSearch } from "~/server/aitooling/deepsearch";
import { model } from "~/models";

evalite("Deep Search Eval", {
  data: async (): Promise<{ input: Message[] }[]> => {
    return [
      {
        input: [
          {
            id: "1",
            role: "user",
            content:
              "What is the latest version of TypeScript?",
          },
        ],
      },
      {
        input: [
          {
            id: "1",
            role: "user",
            content:
              "What are the main features of Next.js 14?",
          },
        ],
      },
    ];
  },
  task: async (input) => {
    return await askDeepSearch({
      model,
      messages: input,
    });
  },
  scorers: [],
});