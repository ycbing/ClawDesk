import { Minus, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function TitleBar() {
  const appWindow = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="flex items-center h-10 px-4 select-none shrink-0 relative"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* 底部渐变边框 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.15) 30%, rgba(6, 182, 212, 0.25) 50%, rgba(6, 182, 212, 0.15) 70%, transparent)",
        }}
      />

      {/* Logo + Title */}
      <div data-tauri-drag-region className="flex items-center gap-2.5 flex-1">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #06b6d4, #0891b2)",
            boxShadow: "0 0 10px rgba(6, 182, 212, 0.4)",
          }}
        >
          <span className="text-[10px] font-bold text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>C</span>
        </div>
        <span
          className="text-xs font-semibold tracking-wide"
          style={{
            color: "var(--text-secondary)",
            letterSpacing: "0.04em",
          }}
          data-tauri-drag-region
        >
          ClawDesk
        </span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => appWindow.minimize()}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/8 transition-all duration-200 active:scale-90"
        >
          <Minus className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
        </button>
        <button
          onClick={() => appWindow.hide()}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/20 transition-all duration-200 active:scale-90 group"
        >
          <X className="w-3.5 h-3.5 transition-colors duration-200 group-hover:text-red-400" style={{ color: "var(--text-muted)" }} />
        </button>
      </div>
    </div>
  );
}
