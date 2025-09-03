"use client";

import { ChatMessage } from "~/components/chat-message";
import { SignInModal } from "~/components/sign-in-modal";
import { RateLimitedModal } from "~/components/rate-limited-modal";
import { useChat, type Message } from "@ai-sdk/react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Square } from "lucide-react";
import { StickToBottom } from 'use-stick-to-bottom';
import { isNewChatCreated } from "~/lib/chat-utils";

interface ChatProps {
  userName: string;
  chatId: string;
  isNewChat: boolean;
  initialMessages?: Message[];
}

export const ChatPage = ({ userName, chatId, isNewChat, initialMessages }: ChatProps) => {
  const [getSignInModal, setSignInModal] = useState(false);
  const [getRateLimitedModal, setRateLimitedModal] = useState(false);
  const router = useRouter();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    stop,
    status, // isLoading is deprecated
    data // for custom messages from the server that are user-defined and not sent by the SDK
  } = useChat({
    api: '/api/chat',
    body: {
      chatId,
      isNewChat,
    },
    initialMessages,
    onError(error) {
      console.error(`Error in useChat: ${error.message}`);
      if (error.message.includes("Unauthorized")) {
        setSignInModal(true);
      }

      if (error.message.includes("Too many requests")) {
        setRateLimitedModal(true);
      }
    },
  });

  // data changes each time but the contents are the same
  // this is because of reference equality on arrays instead of value equality
  // this is a workaround to prevent the useEffect from running too often
  const lastDataItem = data ? data[data.length - 1] : null;
  const stableData = useMemo(() => data, [lastDataItem]);

  // redirect logic for new chats
  useEffect(() => {
    console.log(`useEffect hook running`)
    const lastDataItem = stableData?.[stableData.length - 1];
    if (isNewChat && lastDataItem && isNewChatCreated(lastDataItem)) {
      router.push(`?chatId=${lastDataItem.chatId}`);
    }
  }, [stableData, isNewChat, router]);

  return (
    <>
      <div className="flex flex-1 flex-col">
        <StickToBottom
          className="mx-auto w-full max-w-[65ch] flex-1 [&>div]:scrollbar-thin [&>div]:scrollbar-track-gray-800 [&>div]:scrollbar-thumb-gray-600 [&>div]:hover:scrollbar-thumb-gray-500 overflow-auto"
          resize="smooth"
          initial="smooth"
          role="log"
          aria-label="Chat messages"
        >
          <StickToBottom.Content className="flex flex-col p-4">
            {messages.map((message, index) => {
              return (
                <ChatMessage
                  key={index}
                  parts={message.parts}
                  role={message.role}
                  userName={userName}
                />
              );
            })}
          </StickToBottom.Content>
        </StickToBottom>

        <div className="border-t border-gray-700">
          <form
            onSubmit={handleSubmit}
            className="mx-auto max-w-[65ch] p-4"
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Say something..."
                autoFocus
                aria-label="Chat input"
                className="flex-1 rounded border border-gray-700 bg-gray-800 p-2 text-gray-200 placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={(status === 'submitted' || status === 'streaming') ? stop : handleSubmit}
                disabled={false}
                className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:hover:bg-gray-700"
              >
                {(status === 'submitted' || status === 'streaming') ? <Square className="size-4" /> : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <SignInModal isOpen={getSignInModal} onClose={() => setSignInModal(false)} />
      <RateLimitedModal isOpen={getRateLimitedModal} onClose={() => setRateLimitedModal(false)} />
    </>
  );
};
