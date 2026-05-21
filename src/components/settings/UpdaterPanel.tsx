import { useState } from "react";
import { RefreshCw, CheckCircle, Download, AlertCircle, Loader2 } from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";
import { t } from "../../lib/i18n";

type UpdateStatus = "idle" | "checking" | "available" | "latest" | "downloading" | "error";

export function UpdaterPanel() {
  const { settings } = useSettingsStore();
  const locale = settings.locale;
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [updateInfo, setUpdateInfo] = useState<{ version: string; body?: string } | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCheckUpdate = async () => {
    setStatus("checking");
    setErrorMsg("");
    try {
      // Dynamic import to avoid build issues when Tauri APIs aren't available
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();

      if (update?.available) {
        setStatus("available");
        setUpdateInfo({
          version: update.version,
          body: update.body || undefined,
        });
      } else {
        setStatus("latest");
      }
    } catch (err: any) {
      // If the plugin isn't available (e.g. in browser), just show latest
      console.log("Update check failed:", err.message);
      setStatus("error");
      setErrorMsg(err.message || t('updater.checkError', locale));
    }
  };

  const handleInstall = async () => {
    if (!updateInfo) return;
    setStatus("downloading");
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const { relaunch } = await import("@tauri-apps/plugin-process");
      const update = await check();

      if (update?.available) {
        await update.downloadAndInstall((event) => {
          if (event.event === "Progress") {
            setDownloadProgress(event.data.chunkLength);
          }
        });
        await relaunch();
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || t('updater.checkError', locale));
    }
  };

  return (
    <div className="space-y-3">
      {/* Version info */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {t('settings.version', locale)}
        </span>
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          v0.1.0
        </span>
      </div>

      {/* Status display */}
      {status === "checking" && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--accent)" }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {t('updater.checking', locale)}
          </span>
        </div>
      )}

      {status === "latest" && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
          <CheckCircle className="w-4 h-4" style={{ color: "#34d399" }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {t('updater.latest', locale)}
          </span>
        </div>
      )}

      {status === "available" && updateInfo && (
        <div
          className="p-3 rounded-xl space-y-3"
          style={{
            background: "rgba(6, 182, 212, 0.06)",
            border: "1px solid rgba(6, 182, 212, 0.15)",
          }}
        >
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--accent-hover)" }}>
              {t('updater.available', locale)} — v{updateInfo.version}
            </span>
          </div>
          {updateInfo.body && (
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {updateInfo.body}
            </p>
          )}
          <button
            onClick={handleInstall}
            className="w-full py-2 rounded-xl text-xs font-medium text-white transition-all duration-200 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #0891b2)",
              boxShadow: "0 2px 8px rgba(6, 182, 212, 0.3)",
            }}
          >
            {t('updater.install', locale)}
          </button>
        </div>
      )}

      {status === "downloading" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--accent)" }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {t('updater.downloading', locale)} {downloadProgress > 0 ? `${downloadProgress}%` : ""}
            </span>
          </div>
          {downloadProgress > 0 && (
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${downloadProgress}%`,
                  background: "linear-gradient(90deg, #06b6d4, #22d3ee)",
                }}
              />
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(239, 68, 68, 0.08)" }}>
          <AlertCircle className="w-4 h-4" style={{ color: "#f87171" }} />
          <span className="text-xs" style={{ color: "#f87171" }}>
            {errorMsg}
          </span>
        </div>
      )}

      {/* Check button */}
      {status === "idle" && (
        <button
          onClick={handleCheckUpdate}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 hover:bg-white/[0.04] active:scale-[0.98]"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('updater.check', locale)}
        </button>
      )}

      {/* Recheck button for latest/error */}
      {(status === "latest" || status === "error") && (
        <button
          onClick={handleCheckUpdate}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] transition-all duration-200 hover:bg-white/[0.04]"
          style={{ color: "var(--text-muted)" }}
        >
          <RefreshCw className="w-3 h-3" />
          {t('updater.check', locale)}
        </button>
      )}
    </div>
  );
}
