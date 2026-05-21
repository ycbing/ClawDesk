import { useEffect, useRef, useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { Conversation } from "../../stores/chatStore";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { ChatInput } from "./ChatInput";
import { t } from "../../lib/i18n";

/* ─── Copy Button ─── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await invoke("set_clipboard_text", { content: text });
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
      navigator.clipboard.writeText(text).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/[0.06] z-10"
      title={t("chat.copy")}
    >
      {copied ? (
        <Check className="w-3 h-3" style={{ color: "var(--accent)" }} />
      ) : (
        <Copy className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
      )}
    </button>
  );
}

/* ─── Code Block with language label and copy ─── */
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const langLabel = lang ? getLanguageLabel(lang) : "";

  const handleCopy = useCallback(async () => {
    try {
      await invoke("set_clipboard_text", { content: code.trim() });
    } catch {
      navigator.clipboard.writeText(code.trim()).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [code]);

  return (
    <div className="my-2 rounded-lg overflow-hidden" style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.06)" }}>
      {langLabel && (
        <div
          className="flex items-center justify-between px-3 py-1.5 text-[10px]"
          style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
        >
          <span style={{ color: "var(--text-muted)" }}>{langLabel}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 transition-all duration-200 hover:bg-white/[0.06]"
          >
            {copied ? (
              <Check className="w-3 h-3" style={{ color: "var(--accent)" }} />
            ) : (
              <Copy className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
            )}
            <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>
              {copied ? t("chat.copied") : t("chat.copy")}
            </span>
          </button>
        </div>
      )}
      {!langLabel && (
        <div className="absolute top-1 right-1">
          <button
            onClick={handleCopy}
            className="p-1 rounded transition-all duration-200 hover:bg-white/[0.06] relative"
            style={{ position: "relative" }}
          >
            {copied ? (
              <Check className="w-3 h-3" style={{ color: "var(--accent)" }} />
            ) : (
              <Copy className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
            )}
          </button>
        </div>
      )}
      <pre
        className="px-3 py-2.5 text-[12.5px] leading-relaxed overflow-x-auto whitespace-pre-wrap break-words"
        style={{
          color: "#c9d1d9",
          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
        }}
      >
        {code.trim()}
      </pre>
    </div>
  );
}

function getLanguageLabel(lang: string): string {
  const map: Record<string, string> = {
    js: "JavaScript", javascript: "JavaScript", jsx: "JSX", ts: "TypeScript",
    tsx: "TSX", py: "Python", python: "Python", rb: "Ruby", ruby: "Ruby",
    rs: "Rust", rust: "Rust", go: "Go", java: "Java", c: "C", cpp: "C++",
    cs: "C#", css: "CSS", html: "HTML", json: "JSON", xml: "XML", yaml: "YAML",
    yml: "YAML", toml: "TOML", sql: "SQL", sh: "Shell", bash: "Shell",
    zsh: "Shell", fish: "Fish", ps1: "PowerShell", md: "Markdown",
    markdown: "Markdown", lua: "Lua", php: "PHP", swift: "Swift", kt: "Kotlin",
    kotlin: "Kotlin", dart: "Dart", r: "R", scala: "Scala", dockerfile: "Dockerfile",
  };
  return map[lang.toLowerCase()] || lang.toUpperCase();
}

/* ─── Enhanced Markdown Formatting ─── */
function formatContent(content: string): string {
  let html = content;

  // Escape HTML entities
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Split into lines for list processing
  const lines = html.split("\n");
  const processedLines: string[] = [];
  let inList = false;
  let listType = ""; // "ul" or "ol"

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks (fenced)
    if (line.startsWith("```")) {
      // find closing ```
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      // Use placeholder that will be replaced after
      processedLines.push(`__CODE_BLOCK_${processedLines.length}__`);
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = applyInlineFormatting(headingMatch[2]);
      processedLines.push(`<h${level} style="color:var(--text-primary);font-size:${level === 1 ? "16px" : level === 2 ? "14px" : "13px"};font-weight:600;margin:${level === 1 ? "12px" : "8px"} 0 4px">${text}</h${level}>`);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim()) || /^___+$/.test(line.trim())) {
      processedLines.push('<hr style="border:none;border-top:1px solid var(--border);margin:12px 0" />');
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)/);
    if (ulMatch) {
      if (!inList || listType !== "ul") {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push("<ul style=\"list-style:disc;padding-left:20px;margin:4px 0\">");
        inList = true;
        listType = "ul";
      }
      processedLines.push(`<li style="margin:2px 0;color:var(--text-primary)">${applyInlineFormatting(ulMatch[2])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push("<ol style=\"list-style:decimal;padding-left:20px;margin:4px 0\">");
        inList = true;
        listType = "ol";
      }
      processedLines.push(`<li style="margin:2px 0;color:var(--text-primary)">${applyInlineFormatting(olMatch[2])}</li>`);
      continue;
    }

    // Close list if non-list line
    if (inList) {
      processedLines.push(`</${listType}>`);
      inList = false;
      listType = "";
    }

    processedLines.push(line);
  }

  if (inList) {
    processedLines.push(`</${listType}>`);
  }

  html = processedLines.join("\n");

  // Inline code (not in code blocks)
  html = html.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');

  // Apply inline formatting
  html = applyInlineFormatting(html);

  // Newlines to br
  html = html.replace(/\n/g, "<br/>");

  return html;
}

function applyInlineFormatting(text: string): string {
  let result = text;
  // Bold
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  // Links
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent-hover);text-decoration:underline">$1</a>');
  return result;
}

/* ─── Message Bubble ─── */
interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  isStreaming?: boolean;
  isLast?: boolean;
}

function MessageBubble({ role, content, isStreaming, isLast }: MessageBubbleProps) {
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
            <span className="text-[9px] font-bold" style={{ color: "var(--accent)" }}>
              AI
            </span>
          </div>
        </div>
      )}

      <div
        className={`group relative max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
          isUser ? "rounded-br-sm" : "rounded-bl-sm"
        }`}
        style={{
          background: isUser ? "var(--user-bubble)" : "var(--ai-bubble)",
          color: "var(--text-primary)",
          ...(isUser ? { boxShadow: "var(--shadow-sm)" } : {}),
        }}
      >
        {/* Copy button */}
        {content && (
          <CopyButton text={content} />
        )}

        {content ? (
          <div
            className="whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{
              __html: formatContent(content),
            }}
          />
        ) : isStreaming && isLast ? (
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

/* ─── Chat Panel ─── */
interface ChatPanelProps {
  conversation: Conversation | undefined;
}

export function ChatPanel({ conversation }: ChatPanelProps) {
  const { messages } = conversation || { messages: [] };
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreaming = useChatStore((s) => s.isStreaming);

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
          messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              isStreaming={isStreaming}
              isLast={idx === messages.length - 1}
            />
          ))
        )}
      </div>
      <ChatInput />
    </div>
  );
}

/* ─── Welcome Screen ─── */
function WelcomeScreen() {
  const locale = useSettingsStore((s) => s.settings.locale);

  const quickActions = [
    { icon: "📁", text: t("chat.welcome.findDocs", locale) },
    { icon: "📋", text: t("chat.welcome.readClipboard", locale) },
    { icon: "🔧", text: t("chat.welcome.runCmd", locale) },
    { icon: "💬", text: t("chat.welcome.justChat", locale) },
  ];

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
        {t("chat.welcome.title", locale)}
      </h2>
      <p className="text-sm mb-10 max-w-[280px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {t("chat.welcome.desc", locale)}
      </p>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-[300px]">
        {quickActions.map((item, i) => (
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
        {t("chat.powered", locale)}
      </p>
    </div>
  );
}
