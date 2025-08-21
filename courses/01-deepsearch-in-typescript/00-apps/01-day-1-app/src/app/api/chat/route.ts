import type { Message } from "ai";
import {
  streamText,
  createDataStreamResponse,
  appendResponseMessages
} from "ai";
import { model } from "~/models";
import { auth } from "~/server/auth";
import { z } from "zod";
import { searchSerper } from "~/serper";
import { db } from "~/server/db";
import * as queries from "~/server/db/queries";
import { userRequests, users, type DB } from "~/server/db/schema";
import { eq, gte, and, sql } from "drizzle-orm";


export const maxDuration = 60;

export const MaxRequestsPerDay = 10;

type RateLimitResult =
  | { type: "success", user: DB.User }
  | { type: "unauthorized", error: string }
  | { type: "rate-limited", error: string }
  ;

async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  // get the user from the database to check if they're an admin
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  // if the user is not in the database, stop this from going thru, Next.JS Auth takes care of creating the user for you
  if (!user) {
    console.error(`User ${userId} not found in database`);
    return { type: "unauthorized", error: "User not found" };
  }

  // if the user is not an admin, check if they have exceeded their request limit
  if (!user.isAdmin) {
    const requestsInLastDay =
      await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(userRequests)
        .where(
          and(
            eq(userRequests.userId, user.id),
            gte(userRequests.createdAt, sql`CURRENT_TIMESTAMP - INTERVAL '1 day'`),
          ),
        );

    const requestsMade = requestsInLastDay[0]?.count ?? 0;

    if (requestsMade >= MaxRequestsPerDay) {
      return { type: "rate-limited", error: "Too many requests" };
    }
  }

  return { type: "success", user };
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return Response.json({
      error: "Unauthorized",
      message: "You must be signed in to chat.",
      state: "not-logged-in",
    }, { status: 401 });
  }

  const body = (await request.json()) as {
    messages: Array<Message>,
    chatId?: string
  };

  if (body.messages.length === 0) {
    return Response.json({
      error: "Bad Request",
      message: "You must provide a message.",
      state: "bad-request",
    }, { status: 400 });
  }


  const result = await checkRateLimit(session.user.id);
  if (result.type !== "success") {
    if (result.type === "unauthorized") {
      return new Response(result.error, { status: 401 });
    } else if (result.type === "rate-limited") {
      return new Response(result.error, { status: 429 });
    } else {
      return new Response("Unknown error", { status: 500 });
    }
  }

  const user = result.user;

  // Track the request
  await db.insert(userRequests).values({
    userId: user.id,
    endpoint: "/api/chat",
    status: "completed",
  });

  const chatId = body.chatId ?? crypto.randomUUID();
  await queries.upsertChat({
    userId: user.id,
    chatId,
    title: body.messages[0]?.content ?? "New Chat",
    messages: body.messages,
  });

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
          "Always use the searchWeb tool before answering.",
          "When you have all the information you need, answer the questions and provide inline link citations of your sources.",
          "Try to limit the amount of searchWeb tool calls you make.",
          "Provide some pre-amble to let the user know what you are doing.",
          "Always render the output as markdown."
        ].join("\n"),
        tools: {
          searchWeb: {
            description: "Search the web for information to answer the user's question",
            parameters: z.object({
              query: z.string().describe("The query to search the web for"),
              numResults: z.number().min(10).max(15).describe("The number of results to return [10-15]"),
            }),
            execute: async ({ query, numResults }: { query: string; numResults: number }, { abortSignal }) => {
              console.log(`Serper: Searching for ${query}, limited to ${numResults} results...`);
              const results = await searchSerper({ q: query, num: numResults }, abortSignal);
              const plainResults = results.organic.map((r) => ({
                title: r.title,
                link: r.link,
                snippet: r.snippet,
              }))
              console.log(`Serper: Response for ${query}:`)
              console.dir(plainResults)
              return plainResults;
            }
          }
        },
        maxSteps: 10,
        onFinish: async ({ finishReason, usage, response }) => {
          const oldMessages = messages;
          const newMessages = response.messages
          const allMessages = appendResponseMessages({ messages: oldMessages, responseMessages: newMessages });
          await queries.upsertChat({
            userId: user.id,
            chatId,
            title: oldMessages[0]?.content ?? "New Chat",
            messages: allMessages,
          });
        }
      });

      result.mergeIntoDataStream(dataStream);
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occurred!";
    },
  });
}
