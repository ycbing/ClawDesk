import { useState, useRef, useEffect } from "react";
import { Send, Square, Mic } from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { streamChat } from "../../lib/ai-client";

export function ChatInput() {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
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
    <div
      className="shrink-0 p-3 border-t"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="flex items-end gap-2 rounded-xl px-3 py-2 border"
        style={{
          background: "var(--bg-primary)",
          borderColor: "var(--border)",
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ClawDesk..."
          rows={1}
          className="flex-1 bg-transparent outline-none resize-none text-sm py-1 text-gray-200 placeholder-gray-600"
          style={{ maxHeight: "120px" }}
        />
        <button
          className="p-1.5 rounded-lg transition-colors text-gray-500 hover:text-gray-300"
          title="Voice input (coming soon)"
        >
          <Mic className="w-4 h-4" />
        </button>
        {isStreaming ? (
          <button
            onClick={handleStop}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: "#ef4444" }}
            title="Stop generating"
          >
            <Square className="w-4 h-4 text-white" fill="white" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
            style={{ background: "var(--accent)" }}
            title="Send"
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        )}
      </div>
      <p className="text-[10px] text-center mt-1.5" style={{ color: "var(--text-muted)" }}>
        Press Enter to send · Shift+Enter for new line · {settings.shortcut.toUpperCase()} to toggle
      </p>
    </div>
  );
}
