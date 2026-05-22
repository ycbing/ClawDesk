import { useState, useRef, useCallback } from "react";
import {
  Camera,
  Send,
  Search,
  Bug,
  FileText,
  Palette,
  Code,
  Plus,
  Loader2,
} from "lucide-react";
import { readImage } from "@tauri-apps/plugin-clipboard-manager";
import { useScreenStore } from "../../stores/screenStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { streamVisionChat, type VisionMessage, type VisionContentPart } from "../../lib/ai-client";
import { compressImage } from "./ScreenResult";
import { ScreenHistory } from "./ScreenHistory";
import { ScreenResult } from "./ScreenResult";
import { t } from "../../lib/i18n";

/* ─── Quick Action Buttons ─── */
const quickActions = [
  {
    icon: Search,
    labelKey: "screen.action.ocr",
    prompt: "请识别并提取图片中的所有文字内容，保持原始格式和层级。",
    promptEn: "Extract and recognize all text from this image, preserving original formatting and hierarchy.",
  },
  {
    icon: Bug,
    labelKey: "screen.action.bug",
    prompt: "请分析这张截图中的错误信息，找出问题原因并给出解决方案。",
    promptEn: "Analyze the error message in this screenshot, identify the cause and provide a solution.",
  },
  {
    icon: FileText,
    labelKey: "screen.action.summary",
    prompt: "请总结这张截图中的关键内容，用简洁的要点列出。",
    promptEn: "Summarize the key content in this screenshot with concise bullet points.",
  },
  {
    icon: Palette,
    labelKey: "screen.action.design",
    prompt: "请对这张 UI 截图进行设计评审，从布局、色彩、排版、交互等方面给出改进建议。",
    promptEn: "Review this UI screenshot for design improvements: layout, color, typography, and interaction.",
  },
  {
    icon: Code,
    labelKey: "screen.action.code",
    prompt: "请解释这张截图中的代码，分析其功能和逻辑。",
    promptEn: "Explain the code in this screenshot, analyzing its functionality and logic.",
  },
];

export function ScreenPanel() {
  const {
    records,
    activeRecordId,
    viewMode,
    addRecord,
    updateRecord,
    deleteRecord,
    setActiveRecordId,
    setViewMode,
  } = useScreenStore();

  const { settings } = useSettingsStore();
  const locale = settings.locale;

  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeRecord = records.find((r) => r.id === activeRecordId);

  const handlePasteClipboard = useCallback(async () => {
    setErrorMsg(null);
    setIsCompressing(true);
    try {
      const image = await readImage();
      if (!image) {
        setErrorMsg(t("screen.clipboardEmpty"));
        return;
      }

      const rgba = await image.rgba();
      const size = await image.size();

      // Convert RGBA to PNG data URL via Canvas
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setErrorMsg(t("screen.clipboardError"));
        return;
      }
      const imageData = new ImageData(new Uint8ClampedArray(rgba), size.width, size.height);
      ctx.putImageData(imageData, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");

      // Compress for preview (full size)
      const fullCompressed = await compressImage(dataUrl, 1280, 0.8);
      setImageBase64(fullCompressed);
      setImagePreview(fullCompressed);
    } catch {
      setErrorMsg(t("screen.clipboardError"));
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const fullCompressed = await compressImage(dataUrl, 1280, 0.8);
      setImageBase64(fullCompressed);
      setImagePreview(fullCompressed);
      setIsCompressing(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleQuickAction = useCallback(
    (action: (typeof quickActions)[number]) => {
      const prompt = locale === "en" ? action.promptEn : action.prompt;
      setQuestion(prompt);
    },
    [locale]
  );

  const handleAnalyze = useCallback(async () => {
    if (!imageBase64) {
      setErrorMsg(t("screen.noImage"));
      return;
    }
    if (!settings.ai.apiKey) {
      setErrorMsg(t("screen.noApiKey"));
      return;
    }

    const q = question.trim() || t("screen.questionDefault");
    setIsLoading(true);
    setErrorMsg(null);

    // Generate thumbnail for history
    let thumbnail: string;
    try {
      thumbnail = await compressImage(imageBase64, 80, 0.5);
    } catch {
      thumbnail = imageBase64;
    }

    // Strip data URI prefix for storage
    const rawBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const rawThumb = thumbnail.replace(/^data:image\/\w+;base64,/, "");

    const recordId = addRecord({
      thumbnail: rawThumb,
      imageBase64: rawBase64,
      question: q,
      answer: "",
    });

    try {
      const contentParts: VisionContentPart[] = [
        { type: "text", text: q },
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${rawBase64}` },
        },
      ];

      const messages: VisionMessage[] = [
        { role: "user", content: contentParts },
      ];

      const stream = streamVisionChat(messages, settings.ai);
      let fullAnswer = "";

      for await (const chunk of stream) {
        fullAnswer += chunk;
        updateRecord(recordId, { answer: fullAnswer });
      }

      updateRecord(recordId, { isStreaming: false });
    } catch (error: any) {
      updateRecord(recordId, {
        answer: `❌ ${error.message || "Failed to get response"}`,
        isStreaming: false,
      });
    } finally {
      setIsLoading(false);
      setImageBase64(null);
      setImagePreview(null);
      setQuestion("");
    }
  }, [imageBase64, question, settings.ai, addRecord, updateRecord]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  /* ─── Result View ─── */
  if (viewMode === "result" && activeRecord) {
    return (
      <ScreenResult
        record={activeRecord}
        onDelete={() => {
          deleteRecord(activeRecord.id);
          setViewMode("list");
        }}
        onBack={() => {
          setActiveRecordId(null);
          setViewMode("list");
        }}
      />
    );
  }

  /* ─── List View ─── */
  if (viewMode === "list" && records.length > 0 && !imageBase64) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("screen.title")}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {t("screen.subtitle")}
            </p>
          </div>
          <button
            onClick={() => setViewMode("capture")}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #0891b2)",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(6, 182, 212, 0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(6, 182, 212, 0.4)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 2px 8px rgba(6, 182, 212, 0.25)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Plus className="w-4 h-4" />
            <span>{t("screen.newScreen")}</span>
          </button>
        </div>

        {/* History list */}
        <ScreenHistory
          records={records}
          activeId={activeRecordId}
          onSelect={setActiveRecordId}
          onDelete={(id) => deleteRecord(id)}
        />
      </div>
    );
  }

  /* ─── Capture View ─── */
  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="shrink-0 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))",
              boxShadow: "0 4px 16px rgba(6, 182, 212, 0.1)",
            }}
          >
            <Camera className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("screen.capture")}
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {t("screen.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
        {/* Image upload area */}
        {!imagePreview ? (
          <div
            className="relative rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px dashed var(--border-light)",
              minHeight: "200px",
            }}
            onClick={handlePasteClipboard}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.3)";
              e.currentTarget.style.background = "rgba(6, 182, 212, 0.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-light)";
              e.currentTarget.style.background = "var(--bg-tertiary)";
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{
                background: "rgba(6, 182, 212, 0.08)",
              }}
            >
              <Camera
                className="w-7 h-7"
                style={{ color: "var(--accent)" }}
              />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              {t("screen.pasteBtn")}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {t("screen.pasteHint")}
            </p>
            <p className="text-[10px] mt-2 px-3 py-1 rounded-full" style={{ color: "var(--text-muted)", background: "var(--bg-elevated)" }}>
              {t("screen.newScreen")} · Ctrl+Shift+S
            </p>
          </div>
        ) : (
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(6, 182, 212, 0.15)",
              boxShadow:
                "0 0 24px rgba(6, 182, 212, 0.06), 0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            <img
              src={imagePreview}
              alt="Screenshot preview"
              className="w-full object-contain max-h-[400px]"
              style={{ background: "#0d1117" }}
            />
            <div
              className="absolute inset-x-0 top-0 h-12 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(6, 182, 212, 0.05), transparent)",
              }}
            />
            {/* Remove image button */}
            <button
              onClick={() => {
                setImageBase64(null);
                setImagePreview(null);
              }}
              className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 hover:bg-red-500/20"
              style={{
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                backdropFilter: "blur(4px)",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Actions (show when image is loaded) */}
        {imagePreview && (
          <div className="animate-fade-in">
            <p
              className="text-xs font-medium mb-2.5"
              style={{ color: "var(--text-muted)" }}
            >
              {t("screen.quickActions")}
            </p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                const label = t(action.labelKey);
                const isActive = question === (locale === "en" ? action.promptEn : action.prompt);
                return (
                  <button
                    key={action.labelKey}
                    onClick={() => handleQuickAction(action)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                    style={{
                      background: isActive
                        ? "rgba(6, 182, 212, 0.12)"
                        : "var(--bg-tertiary)",
                      color: isActive
                        ? "var(--accent)"
                        : "var(--text-secondary)",
                      border: `1px solid ${
                        isActive
                          ? "rgba(6, 182, 212, 0.2)"
                          : "var(--border)"
                      }`,
                      animation: `fadeIn 0.3s ease-out ${idx * 50}ms both`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = "var(--border-light)";
                        e.currentTarget.style.color = "var(--text-primary)";
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.04)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.color = "var(--text-secondary)";
                        e.currentTarget.style.background = "var(--bg-tertiary)";
                      }
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Question input */}
        {imagePreview && (
          <div className="animate-fade-in">
            <div
              className="rounded-2xl px-4 py-3 transition-all duration-300"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-light)",
              }}
            >
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("screen.questionPlaceholder")}
                rows={2}
                className="w-full bg-transparent outline-none resize-none text-[13px] leading-relaxed"
                style={{
                  color: "var(--text-primary)",
                  maxHeight: "100px",
                }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div
            className="rounded-xl px-4 py-3 text-xs animate-fade-in"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.15)",
              color: "#fca5a5",
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Send button */}
        {imagePreview && (
          <button
            onClick={handleAnalyze}
            disabled={isLoading || isCompressing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
            style={{
              background: isLoading
                ? "rgba(6, 182, 212, 0.15)"
                : "linear-gradient(135deg, #06b6d4, #0891b2)",
              color: "#fff",
              boxShadow: isLoading
                ? "none"
                : "0 2px 8px rgba(6, 182, 212, 0.3)",
            }}
          >
            {isCompressing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("screen.compressing")}</span>
              </>
            ) : isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("screen.sending")}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{t("screen.send")}</span>
              </>
            )}
          </button>
        )}

        {/* Hidden file input for fallback upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
}
