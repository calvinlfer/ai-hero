import type { Message } from "ai";
import { db } from "./index";
import { chats, messages, type DB } from "./schema";
import { eq, and, asc, desc } from "drizzle-orm";

export type Chat = DB.Chat;
type ChatWithMessages = DB.Chat & { messages: DB.Message[] };

export const upsertChat: (
  opts: {
    userId: string;
    chatId: string;
    title: string;
    messages: Message[];
  }
) => Promise<ChatWithMessages> =
  async (
    opts: {
      userId: string;
      chatId: string;
      title: string;
      messages: Message[];
    }
  ) => {
    const { userId, chatId, title, messages: incomingMessages } = opts;

    return await db.transaction(async (txn) => {
      // Ensure the chat exists and belongs to userId
      const existingChat = await txn.query.chats.findFirst({
        where: eq(chats.id, chatId),
      })

      if (existingChat && existingChat.userId !== userId) {
        // I don't like throwing but we don't have Effect.TS so...
        throw new Error(`Chat (${chatId}) does not belong to user (${userId})`);
      }

      if (!existingChat) {
        // Create the chat
        await txn.insert(chats).values({
          id: chatId,
          title,
          userId,
        });
      } else {
        // Existing chat
        // Delete all messages (in the messages table) of existing chat
        await txn.delete(messages).where(eq(messages.chatId, chatId));

        // Update the title of th existing chat
        await txn.update(chats)
          .set({
            title,
            updatedAt: new Date()
          })
          .where(eq(chats.id, chatId));
      }

      // Insert the messages
      if (incomingMessages.length > 0) {
        const messagesToInsert = incomingMessages.map((msg, i) =>
        ({
          chatId,
          role: msg.role,
          parts: msg.parts,
          order: i + 1,
        })
        )
        await txn.insert(messages).values(messagesToInsert);
      }

      // return chats with messages
      const result: ChatWithMessages | undefined = await txn.query.chats.findFirst({
        where: eq(chats.id, chatId),
        with: {
          messages: {
            orderBy: [asc(messages.order)],
          },
        },
      });

      // There should always be a result since we're doing the upsert above, so we'll use ?? (nullish coalescing) to ensure a return value
      return result ?? {
        id: chatId,
        title,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
      }
    })
  }


export const getChat: (
  opts: {
    userId: string;
    chatId: string;
  }
) => Promise<ChatWithMessages | undefined> =
  async (
    opts: {
      userId: string;
      chatId: string;
    }
  ) => {
    const { userId, chatId } = opts;

    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
      with: {
        messages: {
          orderBy: [asc(messages.order)],
        },
      },
    });
    if (chat && chat.userId !== userId) {
      throw new Error("Chat does not belong to the logged in user");
    }

    return chat;
  }

export const getChats: (userId: string) => Promise<DB.Chat[]> =
  async (userId: string) =>
    await db.query.chats.findMany({ where: eq(chats.userId, userId), });
