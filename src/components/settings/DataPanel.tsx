import { useState, useRef } from "react";
import { Download, Upload, Trash2, AlertTriangle, Check, X } from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";
import { t } from "../../lib/i18n";

export function DataPanel() {
  const { settings } = useSettingsStore();
  const locale = settings.locale;
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const exportData = () => {
    const data = {
      chats: localStorage.getItem("clawdesk-chats"),
      settings: localStorage.getItem("clawdesk-settings"),
      tools: localStorage.getItem("clawdesk-tools"),
      exportedAt: new Date().toISOString(),
      version: "0.1.0",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clawdesk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("settings.data.exported", locale));
  };

  const importData = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);

        // Validate structure
        if (!data.version || typeof data.version !== "string") {
          showToast(t("settings.data.invalidFile", locale));
          return;
        }

        // Restore data
        if (data.chats) localStorage.setItem("clawdesk-chats", data.chats);
        if (data.settings) localStorage.setItem("clawdesk-settings", data.settings);
        if (data.tools) localStorage.setItem("clawdesk-tools", data.tools);

        showToast(t("settings.data.imported", locale));

        // Reload after a short delay to rehydrate stores
        setTimeout(() => window.location.reload(), 500);
      } catch {
        showToast(t("settings.data.invalidFile", locale));
      }
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = "";
  };

  const clearAllData = () => {
    localStorage.removeItem("clawdesk-chats");
    localStorage.removeItem("clawdesk-settings");
    localStorage.removeItem("clawdesk-tools");
    setShowClearConfirm(false);
    showToast(t("settings.data.cleared", locale));
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Export */}
      <button
        onClick={exportData}
        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 hover:bg-white/[0.03] active:scale-[0.99]"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(6, 182, 212, 0.1)" }}
        >
          <Download className="w-4 h-4" style={{ color: "var(--accent)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
            {t("settings.data.export", locale)}
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {t("settings.data.exportDesc", locale)}
          </p>
        </div>
      </button>

      {/* Import */}
      <button
        onClick={importData}
        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 hover:bg-white/[0.03] active:scale-[0.99]"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(6, 182, 212, 0.1)" }}
        >
          <Upload className="w-4 h-4" style={{ color: "var(--accent)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
            {t("settings.data.import", locale)}
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {t("settings.data.importDesc", locale)}
          </p>
        </div>
      </button>

      {/* Clear All Data */}
      <div>
        {showClearConfirm ? (
          <div
            className="p-3 rounded-xl space-y-3"
            style={{
              background: "rgba(239, 68, 68, 0.06)",
              border: "1px solid rgba(239, 68, 68, 0.15)",
            }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#f87171" }} />
              <p className="text-xs leading-relaxed" style={{ color: "#fca5a5" }}>
                {t("settings.data.clearConfirm", locale)}
              </p>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs transition-all duration-200 hover:bg-white/[0.04]"
                style={{ color: "var(--text-secondary)" }}
              >
                {t("clipboard.cancel", locale)}
              </button>
              <button
                onClick={clearAllData}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                }}
              >
                {t("clipboard.confirm", locale)}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 hover:bg-red-500/[0.04] active:scale-[0.99]"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(239, 68, 68, 0.08)" }}
            >
              <Trash2 className="w-4 h-4" style={{ color: "#f87171" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: "#f87171" }}>
                {t("settings.data.clear", locale)}
              </p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {t("settings.data.clearDesc", locale)}
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-xl z-50 animate-fade-in"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <Check className="w-4 h-4" style={{ color: "#34d399" }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}
