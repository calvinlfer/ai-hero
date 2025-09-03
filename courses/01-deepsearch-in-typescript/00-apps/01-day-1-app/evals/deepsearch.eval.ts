import { type Message } from "ai";
import { evalite } from "evalite";
import { checkFactuality } from "./factuality";
import { askDeepSearch } from "~/server/aitooling/deepsearch";
import { model } from "~/models";

evalite("Deep Search Eval", {
  data: async (): Promise<{ input: Message[]; expected: string }[]> => {
    return [
      {
        input: [
          {
            id: "1",
            role: "user",
            content: "What is the latest version of TypeScript?",
          },
        ],
        expected: "5.9.2",
      },
      {
        input: [
          {
            id: "2",
            role: "user",
            content:
              "What are the main features of Next.js 15?",
          },
        ],
        expected: `
@next/codemod CLI: Easily upgrade to the latest Next.js and React versions.
Async Request APIs (Breaking): Incremental step towards a simplified rendering and caching model.
Caching Semantics (Breaking): fetch requests, GET Route Handlers, and client navigations are no longer cached by default.
React 19 Support: Support for React 19, React Compiler (Experimental), and hydration error improvements.
Turbopack Dev (Stable): Performance and stability improvements.
Static Indicator: New visual indicator shows static routes during development.
unstable_after API (Experimental): Execute code after a response finishes streaming.
instrumentation.js API (Stable): New API for server lifecycle observability.
Enhanced Forms (next/form): Enhance HTML forms with client-side navigation.
next.config: TypeScript support for next.config.ts.
Self-hosting Improvements: More control over Cache-Control headers.
Server Actions Security: Unguessable endpoints and removal of unused actions.
Bundling External Packages (Stable): New config options for App and Pages Router.
ESLint 9 Support: Added support for ESLint 9.
Development and Build Performance: Improved build times and Faster Fast Refresh.
`,
      }
    ];
  },
  task: async (input) => {
    return await askDeepSearch({
      model,
      messages: input,
    });
  },

  scorers: [{
    name: "Factuality",
    scorer: ({ input, expected, output }) => {
      const inputMessages = input
      const inputContent = inputMessages.map((m) => m.content).join("\n");
      const groundTruth = expected ?? "";
      return checkFactuality({
        question: inputContent,
        groundTruth: groundTruth,
        submission: output,
      });
    },
  }],
});