import { useState, useEffect, useRef, useCallback } from "react";
import { Clipboard, Search, Trash2, Copy, Clock, Check } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useToolStore, ClipboardEntry } from "../../stores/toolStore";

export function ClipboardPanel() {
  const { clipboardHistory, addClipboardEntry, clearClipboardHistory } = useToolStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [lastContent, setLastContent] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Poll clipboard every second
  const pollClipboard = useCallback(async () => {
    try {
      const text = await invoke<string>("get_clipboard_text");
      if (text && text !== lastContent) {
        setLastContent(text);
        addClipboardEntry(text);
      }
    } catch {
      // Ignore clipboard read errors (e.g., non-text content)
    }
  }, [lastContent, addClipboardEntry]);

  useEffect(() => {
    // Initial read
    pollClipboard();
    pollRef.current = setInterval(pollClipboard, 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pollClipboard]);

  const handleCopy = async (entry: ClipboardEntry) => {
    try {
      await invoke("set_clipboard_text", { content: entry.content });
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Copy error:", err);
    }
  };

  const handleClearAll = () => {
    clearClipboardHistory();
    setShowClearConfirm(false);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Today ${time}`;
    return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
  };

  const filtered = searchQuery
    ? clipboardHistory.filter(
        (e) =>
          e.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : clipboardHistory;

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))",
                border: "1px solid rgba(6, 182, 212, 0.12)",
              }}
            >
              <Clipboard className="w-4 h-4" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Clipboard History
              </h2>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Auto-captured from your clipboard
              </p>
            </div>
          </div>

          {clipboardHistory.length > 0 && (
            <div className="relative">
              {showClearConfirm ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleClearAll}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200"
                    style={{
                      background: "rgba(239, 68, 68, 0.15)",
                      color: "#f87171",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 hover:bg-white/[0.04]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-white/[0.04]"
                  title="Clear all"
                >
                  <Trash2 className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search */}
        {clipboardHistory.length > 0 && (
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clipboard history..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-300"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-light)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        )}
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filtered.map((entry) => (
          <div
            key={entry.id}
            onClick={() => handleCopy(entry)}
            className="group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 mb-1"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "";
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: copiedId === entry.id ? "rgba(6, 182, 212, 0.12)" : "var(--bg-tertiary)",
                border: "1px solid var(--border)",
              }}
            >
              {copiedId === entry.id ? (
                <Check className="w-4 h-4" style={{ color: "var(--accent)" }} />
              ) : (
                <Copy className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm leading-relaxed break-words"
                style={{ color: "var(--text-primary)" }}
              >
                {entry.content.length > 100
                  ? entry.content.slice(0, 100) + "..."
                  : entry.content}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Clock className="w-3 h-3" style={{ color: "var(--text-muted)", opacity: 0.6 }} />
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {formatTime(entry.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {clipboardHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{
                background: "rgba(6, 182, 212, 0.06)",
                border: "1px dashed rgba(6, 182, 212, 0.15)",
              }}
            >
              <Clipboard className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No clipboard history yet
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Copy text and it will appear here
            </p>
          </div>
        )}

        {clipboardHistory.length > 0 && filtered.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No matches found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
