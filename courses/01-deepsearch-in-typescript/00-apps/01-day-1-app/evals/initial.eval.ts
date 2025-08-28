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
      {
        input: [
          {
            id: "1",
            role: "user",
            content:
              "Compare and contrast React and Vue?",
          },
        ],
      },
      {
        input: [
          {
            id: "1",
            role: "user",
            content:
              "What are the differences between REST and gRPC?",
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
  scorers: [
    {
      name: "Contains links",
      description: "The response contains at least one markdown link",
      scorer: ({ output }) => {
        return containsInlineMarkdownLink(output)
          ? 1
          : 0;
      }
    }
  ],
});

function containsInlineMarkdownLink(s: string): boolean {
  const inline = /\[[^\]]+\]\(\s*[^()\s]+(?:\s+"[^"]*")?\s*\)/;
  return inline.test(s);
}