import { useState, useRef, useEffect } from "react";
import { Send, Square, Mic } from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { streamChat } from "../../lib/ai-client";

export function ChatInput() {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { activeConversationId, addMessage, updateLastAssistantMessage, createConversation } =
    useChatStore();
  const { settings } = useSettingsStore();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation();
    }

    setInput("");
    addMessage(convId, { role: "user", content: text });

    if (!settings.ai.apiKey) {
      addMessage(convId, {
        role: "assistant",
        content: "⚠️ Please set your API Key in Settings first. Go to Settings → AI Provider → enter your API Key.",
      });
      return;
    }

    setIsStreaming(true);
    addMessage(convId, { role: "assistant", content: "" });

    try {
      const conversation = useChatStore.getState().conversations.find((c) => c.id === convId);
      const messages = (conversation?.messages || [])
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: m.content }));

      const stream = streamChat(messages.slice(0, -1), settings.ai);
      let fullContent = "";

      for await (const chunk of stream) {
        fullContent += chunk;
        updateLastAssistantMessage(convId!, fullContent);
      }
    } catch (error: any) {
      updateLastAssistantMessage(
        convId!,
        `❌ Error: ${error.message || "Failed to get response. Check your API Key and network."}`
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 px-4 pt-2 pb-3">
      {/* 顶部渐变遮罩线 */}
      <div
        className="h-px mb-3"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent)",
        }}
      />

      <div
        className="flex items-end gap-2 rounded-2xl px-4 py-2.5 transition-all duration-300"
        style={{
          background: "var(--bg-tertiary)",
          border: `1px solid ${isFocused ? "var(--accent)" : "var(--border-light)"}`,
          boxShadow: isFocused
            ? "0 0 0 3px rgba(6, 182, 212, 0.1), var(--shadow-md)"
            : "var(--shadow-sm)",
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Message ClawDesk..."
          rows={1}
          className="flex-1 bg-transparent outline-none resize-none text-[13px] py-1 placeholder-gray-600"
          style={{
            maxHeight: "120px",
            color: "var(--text-primary)",
          }}
        />

        {/* 语音按钮 */}
        <button
          className="p-2 rounded-xl transition-all duration-300 hover:bg-white/[0.06] active:scale-90"
          style={{ color: "var(--text-muted)" }}
          title="Voice input (coming soon)"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* 发送/停止按钮 */}
        {isStreaming ? (
          <button
            onClick={handleStop}
            className="p-2 rounded-xl transition-all duration-200 hover:brightness-110 active:scale-90"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
            }}
            title="Stop generating"
          >
            <Square className="w-3.5 h-3.5 text-white" fill="white" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded-xl transition-all duration-300 active:scale-90 disabled:opacity-25"
            style={{
              background: input.trim()
                ? "linear-gradient(135deg, #06b6d4, #0891b2)"
                : "rgba(255,255,255,0.08)",
              boxShadow: input.trim()
                ? "0 2px 8px rgba(6, 182, 212, 0.3)"
                : "none",
            }}
            title="Send"
          >
            <Send
              className="w-3.5 h-3.5 transition-transform duration-200"
              style={{
                color: input.trim() ? "#fff" : "var(--text-muted)",
                transform: input.trim() ? "translateX(0.5px)" : "none",
              }}
            />
          </button>
        )}
      </div>

      <p
        className="text-[10px] text-center mt-2 tracking-wide"
        style={{ color: "var(--text-muted)", opacity: 0.7 }}
      >
        Press <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] mx-0.5">Enter</kbd> to send
        <span className="mx-1">·</span>
        <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] mx-0.5">Shift+Enter</kbd> for new line
        <span className="mx-1">·</span>
        <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] mx-0.5">{settings.shortcut.toUpperCase()}</kbd> to toggle
      </p>
    </div>
  );
}
