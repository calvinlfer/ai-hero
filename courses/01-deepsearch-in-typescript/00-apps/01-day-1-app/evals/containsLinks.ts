import { createScorer } from "evalite";

export function containsInlineMarkdownLink(s: string): boolean {
  const inline = /\[[^\]]+\]\(\s*[^()\s]+(?:\s+"[^"]*")?\s*\)/;
  return inline.test(s);
}

export const containsLinksScorer = createScorer<string, string, string>({
  name: "LLM output contains inline markdown links",
  scorer: ({ output }) => {
    return containsInlineMarkdownLink(output) ? 1 : 0;
  },
});
