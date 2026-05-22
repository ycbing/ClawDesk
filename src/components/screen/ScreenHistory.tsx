import { Trash2, Clock } from "lucide-react";
import { ScreenRecord } from "../../stores/screenStore";
import { t } from "../../lib/i18n";

interface ScreenHistoryProps {
  records: ScreenRecord[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function ScreenHistory({
  records,
  activeId,
  onSelect,
  onDelete,
}: ScreenHistoryProps) {
  if (records.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center animate-fade-in">
        <div className="relative mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(6, 182, 212, 0.06)",
              border: "1px dashed rgba(6, 182, 212, 0.15)",
            }}
          >
            <Clock className="w-6 h-6" style={{ color: "var(--text-muted)" }} />
          </div>
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {t("screen.history.empty")}
        </p>
        <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
          {t("screen.history.hint")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
      {records.map((record, idx) => {
        const isActive = activeId === record.id;
        const thumbSrc = record.thumbnail.startsWith("data:")
          ? record.thumbnail
          : `data:image/jpeg;base64,${record.thumbnail}`;

        return (
          <div
            key={record.id}
            onClick={() => onSelect(record.id)}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
            style={{
              background: isActive
                ? "rgba(6, 182, 212, 0.08)"
                : "transparent",
              border: `1px solid ${
                isActive ? "rgba(6, 182, 212, 0.12)" : "transparent"
              }`,
              animation: `fadeIn 0.3s ease-out ${idx * 40}ms both`,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.borderColor = "var(--border-light)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
              }
            }}
          >
            {/* Thumbnail */}
            <div
              className="w-10 h-10 rounded-lg overflow-hidden shrink-0"
              style={{
                border: "1px solid var(--border)",
                background: "#0d1117",
              }}
            >
              <img
                src={thumbSrc}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium truncate"
                style={{
                  color: isActive
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                }}
              >
                {record.question}
              </p>
              <p
                className="text-[10px] mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {timeAgo(record.createdAt)}
                {record.isStreaming && (
                  <span
                    className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "var(--accent)", verticalAlign: "middle" }}
                  />
                )}
              </p>
            </div>

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(record.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all duration-200 hover:bg-red-500/15"
            >
              <Trash2
                className="w-3 h-3 text-red-400/70 hover:text-red-400 transition-colors"
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
