import { type Message } from "ai";
import { evalite } from "evalite";
import { checkFactuality } from "./factuality";
import { askDeepSearch } from "~/server/aitooling/deepsearch";
import { model } from "~/models";
import { containsInlineMarkdownLink } from "./containsLinks";
import { env } from "~/env";
import { devData } from "./datasets/dev";
import { ciData } from "./datasets/ci";
import { regressionData } from "./datasets/regression";

evalite("Deep Search Eval", {
  data: async (): Promise<{ input: Message[]; expected: string }[]> => {
    const dev = env.EVAL_DATASET == 'dev' ? devData : [];
    const ci = env.EVAL_DATASET == 'ci' ? [...devData, ...ciData] : [];
    const regression = env.EVAL_DATASET == 'regression' ? [...devData, ...ciData, ...regressionData] : [];
    return [...dev, ...ci, ...regression];
  },
  task: async (input) => {
    return await askDeepSearch({
      model,
      messages: input,
    });
  },

  scorers: [
    {
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
    },
    {
      name: "Contains inline Markdown links",
      scorer: ({ output }) => containsInlineMarkdownLink(output) ? 1 : 0
    },
  ],
});