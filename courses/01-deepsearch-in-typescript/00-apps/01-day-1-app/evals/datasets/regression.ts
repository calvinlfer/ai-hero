import type { Message } from "ai";

export const regressionData: Array<{ input: Array<Message>, expected: string }> = [
  {
    // Another multi-hop https://www.reddit.com/r/LocalLLaMA/comments/17zsb0w/qa_expert_the_llm_to_handle_multihop_question
    input: [
      {
        id: "1",
        role: "user",
        content: "What are top tourists attractions in the biggest city in Japan?",
      }
    ],
    expected: `Here are attractions in Tokyo
        Tsukiji outer market
        Akihabara
        Tokyo National Museum
        Imperial Palace
        `,
  },
  {
    input: [
      {
        id: "1",
        role: "user",
        content: "What is the population of Vietnam compared to the Philippines",
      }
    ],
    expected: "The current population of the Philippines is roughly 12-15% larger than Vietnam",
  },
]
