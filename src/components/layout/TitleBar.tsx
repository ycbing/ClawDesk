import { Minus, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function TitleBar() {
  const appWindow = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="flex items-center h-9 px-3 select-none shrink-0"
      style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}
    >
      <div data-tauri-drag-region className="flex items-center gap-2 flex-1">
        <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "var(--accent)" }}>
          <span className="text-[10px] font-bold text-black">C</span>
        </div>
        <span className="text-xs font-medium" data-tauri-drag-region>
          ClawDesk
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => appWindow.minimize()}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
        >
          <Minus className="w-3.5 h-3.5 text-gray-400" />
        </button>
        <button
          onClick={() => appWindow.hide()}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/80 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
