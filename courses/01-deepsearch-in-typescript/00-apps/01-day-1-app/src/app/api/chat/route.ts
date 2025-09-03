import type { Message } from "ai";
import { createDataStreamResponse, appendResponseMessages } from "ai";
import { model } from "~/models";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import * as queries from "~/server/db/queries";
import { userRequests, users, type DB } from "~/server/db/schema";
import { recordRateLimit, checkRateLimit, type RateLimitConfig } from "~/server/redis/rateLimiting";
import { eq, gte, and, sql } from "drizzle-orm";
import { Langfuse, type LangfuseTraceClient } from "langfuse";
import { streamFromDeepSearch } from "~/server/aitooling/deepsearch";
import { env } from "~/env";


export const MaxDuration = 60;
export const MaxRequestsPerDay = 10;
const GlobalRateLimitConfig: RateLimitConfig = {
  maxRequests: 1,
  maxRetries: 3,
  windowMs: 20 * 1000, // 20s
  keyPrefix: "global_rate_limit",
}

type UserRateLimitResult =
  | { type: "success", user: DB.User }
  | { type: "unauthorized", error: string }
  | { type: "rate-limited", error: string }
  ;

const spanner =
  (client: LangfuseTraceClient) =>
    <In, Out>(name: string, fn: (input: In) => Promise<Out>) =>
      async (input: In) => {
        const span = client.span({
          name,
          input,
        });
        const output = await fn(input);
        span.end({
          output,
        });
        return output;
      }

async function checkUserRateLimit({ userId }: { userId: string }): Promise<UserRateLimitResult> {
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

const langfuse = new Langfuse({
  environment: env.NODE_ENV,
  publicKey: env.LANGFUSE_PUBLIC_KEY,
  secretKey: env.LANGFUSE_SECRET_KEY,
  baseUrl: env.LANGFUSE_BASEURL,
});

export async function POST(request: Request) {
  // construct trace as soon as possible and update it with key attributes as soon as we get them
  const trace = langfuse.trace({
    name: "Chat"
  });
  const mkSpan = spanner(trace);

  const session = await auth();
  if (!session) {
    return Response.json({
      error: "Unauthorized",
      message: "You must be signed in to chat.",
      state: "not-logged-in",
    }, { status: 401 });
  }

  // Associate the trace with the user
  trace.update({ userId: session.user.id });

  const body = (await request.json()) as {
    messages: Array<Message>,
    chatId: string,
    isNewChat: boolean,
  };

  // Associate the chat id with the trace
  trace.update({ sessionId: body.chatId });

  if (body.messages.length === 0) {
    return Response.json({
      error: "Bad Request",
      message: "You must provide a message.",
      state: "bad-request",
    }, { status: 400 });
  }

  const globalLimitResult = await mkSpan("check-global-rate-limit", checkRateLimit)(GlobalRateLimitConfig);
  if (!globalLimitResult.allowed) {
    console.log("Global rate limit exceeded, waiting...");
    // do some retries
    const isAllowed = await globalLimitResult.retry();
    if (!isAllowed) {
      return new Response("Too many requests", { status: 429 });
    }
  }
  await mkSpan("record-global-rate-limit", recordRateLimit)(GlobalRateLimitConfig);

  const userRateLimitResult = await mkSpan("check-user-rate-limit", checkUserRateLimit)({ userId: session.user.id });

  if (userRateLimitResult.type !== "success") {
    if (userRateLimitResult.type === "unauthorized") {
      return new Response(userRateLimitResult.error, { status: 401 });
    } else if (userRateLimitResult.type === "rate-limited") {
      return new Response(userRateLimitResult.error, { status: 429 });
    } else {
      return new Response("Unknown error", { status: 500 });
    }
  }

  const user = userRateLimitResult.user;

  await mkSpan("track-request", async (input: {
    userId: string,
    endpoint: string,
    status: string
  }) => {
    await db.insert(userRequests).values(input);
  })({
    userId: user.id,
    endpoint: "/api/chat",
    status: "completed",
  });

  const chatId = body.chatId;
  const isNewChat = body.isNewChat;


  await mkSpan("upsert-chat", queries.upsertChat)({
    userId: user.id,
    chatId,
    title: body.messages[0]?.content ?? "New Chat",
    messages: body.messages,
  });

  return createDataStreamResponse({
    execute: async (dataStream) => {
      if (isNewChat) {
        // message the client that a new chat was created
        dataStream.writeData({
          type: 'NEW_CHAT_CREATED',
          chatId,
        })
      }

      const { messages } = body;
      const timeNow = new Date();

      const result = streamFromDeepSearch({
        timeNow,
        model,
        messages,
        onFinish: async ({ response }) => {
          const oldMessages = messages;
          const newMessages = response.messages
          const allMessages = appendResponseMessages({ messages: oldMessages, responseMessages: newMessages });
          await mkSpan("upsert-chat-to-db", queries.upsertChat)({
            userId: user.id,
            chatId,
            title: oldMessages[0]?.content ?? "New Chat",
            messages: allMessages,
          });
          await langfuse.flushAsync();
        },
        telemetry: {
          isEnabled: true,
          functionId: "agent",
          metadata: {
            langfuseTraceId: trace.id,
          }
        }
      })

      result.mergeIntoDataStream(dataStream);
    },
    onError: (e) => {
      console.error(e);
      return "Oops, an error occurred!";
    },
  });
}
