import type { Message } from "ai";
import {
  streamText,
  createDataStreamResponse,
} from "ai";
import { model } from "~/models";
import { auth } from "~/server/auth";


export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json()) as {
    messages: Array<Message>;
  };

  return createDataStreamResponse({
    execute: async (dataStream) => {
      const { messages } = body;

      const result = streamText({
        model,
        messages,
        system: [
          "You are a research assistant with access to search the web.",
          "Ensure that the question that the user asks actually requires searching the web before answering.",
          "If the question does not require research, reject it.",
          "After confirming this is a good question then search the web before answering.",
          "When you have all the information you need, answer the questions and provide inline link citations of your sources.",
          "Try to limit the amount web searching you do",
          "Provide some pre-amble to let the user know what you are doing.",
          "Always render the output as markdown."
        ].join("\n"),
        maxSteps: 10
      });

      result.mergeIntoDataStream(dataStream, {
        sendSources: true,
      });
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occurred!";
    },
  });
}
