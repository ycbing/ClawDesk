import { Copy, Check, Trash2, ArrowLeft } from "lucide-react";
import { useState, useCallback } from "react";
import { ScreenRecord } from "../../stores/screenStore";
import { t } from "../../lib/i18n";

/* ─── Image Compression Utility ─── */
export function compressImage(
  base64Data: string,
  maxWidth = 320,
  quality = 0.6
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = (h * maxWidth) / w;
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Cannot get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = base64Data.startsWith("data:")
      ? base64Data
      : `data:image/png;base64,${base64Data}`;
  });
}

/* ─── Copy Button ─── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

/* ─── AI Streaming Dots ─── */
function StreamingDots() {
  return (
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
  );
}

/* ─── Markdown formatting (reuse pattern from ChatPanel) ─── */
function applyInlineFormatting(text: string): string {
  let result = text;
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(
    /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g,
    "<em>$1</em>"
  );
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent-hover);text-decoration:underline">$1</a>'
  );
  return result;
}

function formatContent(content: string): string {
  let html = content;
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = html.split("\n");
  const processedLines: string[] = [];
  let inList = false;
  let listType = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      const langLabel = lang
        ? lang.charAt(0).toUpperCase() + lang.slice(1)
        : "";
      processedLines.push(
        `<div class="code-block"><div style="display:flex;justify-content:space-between;align-items:center;padding:4px 12px;background:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.04);font-size:10px;color:var(--text-muted);margin:-12px -12px 8px -12px"><span>${langLabel}</span></div><pre style="margin:0;padding:12px">${codeLines
          .join("\n")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</pre></div>`
      );
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = applyInlineFormatting(headingMatch[2]);
      processedLines.push(
        `<h${level} style="color:var(--text-primary);font-size:${level === 1 ? "16px" : level === 2 ? "14px" : "13px"};font-weight:600;margin:${level === 1 ? "12px" : "8px"} 0 4px">${text}</h${level}>`
      );
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)/);
    if (ulMatch) {
      if (!inList || listType !== "ul") {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push(
          '<ul style="list-style:disc;padding-left:20px;margin:4px 0">'
        );
        inList = true;
        listType = "ul";
      }
      processedLines.push(
        `<li style="margin:2px 0;color:var(--text-primary)">${applyInlineFormatting(ulMatch[2])}</li>`
      );
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push(
          '<ol style="list-style:decimal;padding-left:20px;margin:4px 0">'
        );
        inList = true;
        listType = "ol";
      }
      processedLines.push(
        `<li style="margin:2px 0;color:var(--text-primary)">${applyInlineFormatting(olMatch[2])}</li>`
      );
      continue;
    }

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
  html = html.replace(
    /`([^`\n]+)`/g,
    '<code class="inline-code">$1</code>'
  );
  html = applyInlineFormatting(html);
  html = html.replace(/\n/g, "<br/>");
  return html;
}

/* ─── Props ─── */
interface ScreenResultProps {
  record: ScreenRecord;
  onDelete: () => void;
  onBack: () => void;
}

export function ScreenResult({ record, onDelete, onBack }: ScreenResultProps) {
  const fullImageSrc = record.imageBase64.startsWith("data:")
    ? record.imageBase64
    : `data:image/jpeg;base64,${record.imageBase64}`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm transition-all duration-200 hover:text-white"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("screen.backToList")}</span>
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 hover:bg-red-500/10"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t("screen.delete")}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
        {/* Screenshot Preview */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            border: "1px solid rgba(6, 182, 212, 0.15)",
            boxShadow: "0 0 24px rgba(6, 182, 212, 0.06), 0 4px 16px rgba(0,0,0,0.3)",
          }}
        >
          <img
            src={fullImageSrc}
            alt="Screenshot"
            className="w-full object-contain max-h-[400px]"
            style={{ background: "#0d1117" }}
          />
          {/* Glow overlay top */}
          <div
            className="absolute inset-x-0 top-0 h-16 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(6, 182, 212, 0.06), transparent)",
            }}
          />
        </div>

        {/* Question */}
        <div className="animate-slide-in-right">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: "var(--user-bubble)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Q</span>
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {t("screen.result.question")}
            </span>
          </div>
          <div
            className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3 text-[13px]"
            style={{
              background: "var(--user-bubble)",
              color: "var(--text-primary)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {record.question}
          </div>
        </div>

        {/* AI Answer */}
        <div className="animate-slide-in-left">
          <div className="flex items-center gap-2 mb-2">
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
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {t("screen.result.answer")}
            </span>
          </div>
          <div
            className="group relative max-w-[90%] rounded-2xl rounded-bl-sm px-4 py-3 text-[13px] leading-relaxed"
            style={{
              background: "var(--ai-bubble)",
              color: "var(--text-primary)",
            }}
          >
            {record.answer && <CopyButton text={record.answer} />}
            {record.answer ? (
              <div
                className="whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{
                  __html: formatContent(record.answer),
                }}
              />
            ) : record.isStreaming ? (
              <StreamingDots />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
