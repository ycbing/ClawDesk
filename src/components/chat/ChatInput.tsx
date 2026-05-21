import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Square, Mic, MicOff } from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { streamChat } from "../../lib/ai-client";
import { t } from "../../lib/i18n";
import { getLocale } from "../../lib/i18n";

export function ChatInput() {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { activeConversationId, addMessage, updateLastAssistantMessage, createConversation, isStreaming, setIsStreaming } =
    useChatStore();
  const { settings } = useSettingsStore();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation();
    }

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    addMessage(convId, { role: "user", content: text });

    if (!settings.ai.apiKey) {
      addMessage(convId, {
        role: "assistant",
        content: `⚠️ ${t('settings.apiKey')}: Settings → AI Provider → enter your API Key.`,
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
        `❌ ${error.message || "Failed to get response"}`
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
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

  // Voice recording
  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setInput((prev) => prev + `[${t('voice.unsupported')}]`);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getLocale() === 'zh' ? 'zh-CN' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      setInput(finalTranscript + interimTranscript);
    };

    recognition.onerror = () => {
      stopRecording();
    };

    recognition.onend = () => {
      if (isRecording) stopRecording();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= 60) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  }, [getLocale, isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="shrink-0 px-4 pt-2 pb-3">
      {/* 录音指示器 */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2 mb-2 animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-red-500" style={{ animation: "pulse-glow 1s infinite" }} />
          <span className="text-xs text-red-400">
            {t('voice.recording')} {formatTime(recordingTime)}
          </span>
        </div>
      )}

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
          border: `1px solid ${isRecording ? "#ef4444" : isFocused ? "var(--accent)" : "var(--border-light)"}`,
          boxShadow: isRecording
            ? "0 0 0 3px rgba(239, 68, 68, 0.1)"
            : isFocused
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
          placeholder={t('chat.placeholder')}
          rows={1}
          className="flex-1 bg-transparent outline-none resize-none text-[13px] py-1 placeholder-gray-600"
          style={{
            maxHeight: "120px",
            color: "var(--text-primary)",
          }}
        />

        {/* 语音按钮 */}
        <button
          onClick={toggleRecording}
          className="p-2 rounded-xl transition-all duration-300 active:scale-90"
          style={{
            color: isRecording ? "#ef4444" : "var(--text-muted)",
            background: isRecording ? "rgba(239,68,68,0.1)" : "transparent",
          }}
          title={isRecording ? t('chat.stop') : "Voice input"}
          onMouseEnter={(e) => {
            if (!isRecording) e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            if (!isRecording) e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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
            title={t('chat.stop')}
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
            title={t('chat.send')}
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
        <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] mx-0.5">Enter</kbd> {t('chat.send')}
        <span className="mx-1">·</span>
        <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] mx-0.5">Shift+Enter</kbd>
        <span className="mx-1">·</span>
        <kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] mx-0.5">{settings.shortcut.toUpperCase()}</kbd>
      </p>
    </div>
  );
}
