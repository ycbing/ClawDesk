import { useEffect, useRef } from "react";
import { Conversation } from "../../stores/chatStore";
import { ChatInput } from "./ChatInput";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
}

function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 px-4`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser ? "rounded-br-md" : "rounded-bl-md"
        }`}
        style={{
          background: isUser ? "var(--user-bubble)" : "var(--ai-bubble)",
          color: "var(--text-primary)",
        }}
      >
        {content ? (
          <div
            className="whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{
              __html: formatContent(content),
            }}
          />
        ) : isStreaming ? (
          <div className="flex gap-1 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatContent(content: string): string {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, "<code class='inline-code'>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

interface ChatPanelProps {
  conversation: Conversation | undefined;
}

export function ChatPanel({ conversation }: ChatPanelProps) {
  const { messages } = conversation || { messages: [] };
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              isStreaming={false}
            />
          ))
        )}
      </div>
      <ChatInput />
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "rgba(6, 182, 212, 0.1)" }}
      >
        <span className="text-3xl font-bold" style={{ color: "var(--accent)" }}>C</span>
      </div>
      <h2 className="text-xl font-semibold mb-2 text-gray-200">ClawDesk</h2>
      <p className="text-sm text-gray-500 mb-8 max-w-xs">
        Your AI Desktop Assistant. Ask anything, manage files, automate tasks.
      </p>
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {[
          { icon: "📁", text: "Find my documents" },
          { icon: "📋", text: "Read my clipboard" },
          { icon: "🔧", text: "Run a command" },
          { icon: "💬", text: "Just chat with me" },
        ].map((item) => (
          <button
            key={item.text}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-gray-400 hover:bg-white/5 hover:text-gray-300 transition-colors text-left border"
            style={{ borderColor: "var(--border)" }}
          >
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
