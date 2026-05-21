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
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-5 px-6 ${
        isUser ? "animate-slide-in-right" : "animate-slide-in-left"
      }`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="mr-2.5 mt-1 shrink-0">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.08))",
              border: "1px solid rgba(6, 182, 212, 0.15)",
            }}
          >
            <span
              className="text-[9px] font-bold"
              style={{ color: "var(--accent)" }}
            >
              AI
            </span>
          </div>
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
          isUser ? "rounded-br-sm" : "rounded-bl-sm"
        }`}
        style={{
          background: isUser ? "var(--user-bubble)" : "var(--ai-bubble)",
          color: "var(--text-primary)",
          ...(isUser ? { boxShadow: "var(--shadow-sm)" } : {}),
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
          <div className="flex gap-1.5 py-1.5 items-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-[6px] h-[6px] rounded-full"
                style={{
                  background: "var(--accent)",
                  animation: `dot-bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
                }}
              />
            ))}
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6">
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
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      {/* Logo */}
      <div className="relative mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))",
            boxShadow: "0 8px 32px rgba(6, 182, 212, 0.12)",
          }}
        >
          <span
            className="text-3xl font-bold"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #22d3ee)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            C
          </span>
        </div>
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.1), transparent)",
            borderRadius: "16px",
            filter: "blur(12px)",
          }}
        />
      </div>

      {/* Title */}
      <h2
        className="text-2xl font-semibold mb-2 tracking-tight"
        style={{
          background: "linear-gradient(135deg, #e8eaed, #9aa0a6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        ClawDesk
      </h2>
      <p className="text-sm mb-10 max-w-[280px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Your AI Desktop Assistant. Ask anything, manage files, automate tasks.
      </p>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-[300px]">
        {[
          { icon: "📁", text: "Find my documents" },
          { icon: "📋", text: "Read my clipboard" },
          { icon: "🔧", text: "Run a command" },
          { icon: "💬", text: "Just chat with me" },
        ].map((item, i) => (
          <button
            key={item.text}
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs text-left transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
            style={{
              color: "var(--text-secondary)",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              animationDelay: `${i * 60}ms`,
              animation: `fadeIn 0.4s ease-out ${i * 60}ms both`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-light)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span className="text-base">{item.icon}</span>
            <span className="font-medium">{item.text}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <p
        className="mt-10 text-[10px] tracking-widest uppercase"
        style={{ color: "var(--text-muted)", opacity: 0.6 }}
      >
        Powered by GLM-4
      </p>
    </div>
  );
}
