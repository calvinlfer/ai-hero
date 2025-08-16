import ReactMarkdown, { type Components } from "react-markdown";
import { Bolt, PhoneOutgoing, PhoneIncoming, ChevronDown, ChevronRight, Link } from "lucide-react";
import type { Message } from "ai";
import { useState } from "react";

export type MessagePart = NonNullable<Message["parts"]>[number];
export type Role = Message["role"];
export type ToolInvocationUIPart = Extract<MessagePart, { type: "tool-invocation" }>;
export type SourceUIPart = Extract<MessagePart, { type: "source" }>;

interface ChatMessageProps {
  parts: MessagePart[];
  role: Role;
  userName: string;
}

const components: Components = {
  // Override default elements with custom styling
  p: ({ children }) => <p className="mb-4 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-4 list-disc pl-4">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal pl-4">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
  code: ({ className, children, ...props }) => (
    <code className={`${className ?? ""}`} {...props}>
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-700 p-4">
      {children}
    </pre>
  ),
  a: ({ children, ...props }) => (
    <a
      className="text-blue-400 underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

const Markdown = ({ children }: { children: string }) => {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
};

const ToolInvocation = ({ part }: { part: ToolInvocationUIPart }) => {
  const { toolInvocation } = part;
  const [showArgs, setShowArgs] = useState(false);
  const [showResult, setShowResult] = useState(false);

  if (toolInvocation.state === "partial-call") {
    return (
      <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-950/20 p-3">
        <div className="flex items-center gap-2 text-sm text-blue-300">
          <div className="size-2 animate-pulse rounded-full bg-blue-400"></div>
          <div className="flex items-center gap-2 font-medium">
            <PhoneOutgoing className="size-4" />
            Calling {toolInvocation.toolName}...
          </div>
        </div>
      </div>
    );
  }

  if (toolInvocation.state === "call") {
    return (
      <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-950/20 p-3">
        <div className="text-sm text-yellow-300">
          <div className="flex items-center gap-2 font-medium">
            <PhoneIncoming className="size-4" />
            {toolInvocation.toolName}
          </div>
          <button
            onClick={() => setShowArgs(!showArgs)}
            className="mt-2 flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300"
          >
            {showArgs ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            Arguments
          </button>
          {showArgs && (
            <div className="mt-1 text-xs text-yellow-400">
              <pre className="whitespace-pre-wrap">{JSON.stringify(toolInvocation.args, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (toolInvocation.state === "result") {
    return (
      <div className="mb-4 rounded-lg border border-green-500/30 bg-green-950/20 p-3">
        <div className="text-sm text-green-300">
          <div className="flex items-center gap-2 font-medium">
            <Bolt className="size-4" />
            {toolInvocation.toolName}
          </div>
          <button
            onClick={() => setShowArgs(!showArgs)}
            className="mt-2 flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
          >
            {showArgs ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            Arguments
          </button>
          {showArgs && (
            <div className="mt-1 text-xs text-green-400">
              <pre className="whitespace-pre-wrap">{JSON.stringify(toolInvocation.args, null, 2)}</pre>
            </div>
          )}
          <button
            onClick={() => setShowResult(!showResult)}
            className="mt-2 flex items-center gap-1 text-xs text-green-200 hover:text-green-100"
          >
            {showResult ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            Result
          </button>
          {showResult && (
            <div className="mt-1 text-xs text-green-200">
              <pre className="whitespace-pre-wrap">{JSON.stringify(toolInvocation.result, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
    </>
  );
};

const Source = ({ part }: { part: SourceUIPart }) => {
  const source = part.source;
  return (
    <div className="mb-4 rounded-lg border border-purple-500/30 bg-purple-950/20 p-3">
      <div className="text-sm text-purple-300">
        <div className="flex items-center gap-2 font-medium">
          <Link className="size-4" />
          Source
        </div>
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          {source.title ?? source.url}
        </a>
      </div>
    </div>
  );
}

export const ChatMessage = ({ parts, role, userName }: ChatMessageProps) => {
  const isAI = role === "assistant";

  return (
    <div className="mb-6">
      <div
        className={`rounded-lg p-4 ${isAI ? "bg-gray-800 text-gray-300" : "bg-gray-900 text-gray-300"
          }`}
      >
        <p className="mb-2 text-sm font-semibold text-gray-400">
          {isAI ? "AI" : userName}
        </p>

        <div className="prose prose-invert max-w-none">
          {
            (
              parts.map((part, index) => {
                if (part.type === "text") {
                  return <Markdown key={index}>{part.text}</Markdown>;
                }

                if (part.type === "tool-invocation") {
                  return <ToolInvocation key={index} part={part} />;
                }

                if (part.type === "source") {
                  return <Source key={index} part={part} />;
                }

                // For other part types we're not handling yet, return null
                return null;
              })
            )
          }
        </div>
      </div>
    </div>
  );
};
