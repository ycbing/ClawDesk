import { MessageSquarePlus, Settings, Trash2, MessageCircle } from "lucide-react";
import { useChatStore } from "../../stores/chatStore";

interface SidebarProps {
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({ onNewChat, onOpenSettings }: SidebarProps) {
  const { conversations, activeConversationId, setActiveConversation, deleteConversation } =
    useChatStore();

  return (
    <div
      className="w-56 flex flex-col shrink-0 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #141418 0%, #16161c 100%)",
      }}
    >
      {/* 右侧分割线 */}
      <div
        className="absolute right-0 top-0 bottom-0 w-px"
        style={{
          background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent)",
        }}
      />

      {/* New Chat Button */}
      <div className="p-3 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #06b6d4, #0891b2)",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(6, 182, 212, 0.25)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(6, 182, 212, 0.4)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(6, 182, 212, 0.25)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {conversations.map((conv) => {
          const isActive = activeConversationId === conv.id;
          return (
            <div
              key={conv.id}
              className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-200 ${
                isActive ? "" : "hover:bg-white/[0.04]"
              }`}
              onClick={() => setActiveConversation(conv.id)}
              style={{
                background: isActive ? "rgba(6, 182, 212, 0.08)" : undefined,
              }}
            >
              {/* 左侧活跃指示器 */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{
                    background: "linear-gradient(180deg, #06b6d4, #22d3ee)",
                    boxShadow: "0 0 8px rgba(6, 182, 212, 0.3)",
                  }}
                />
              )}

              <div
                className="flex-1 truncate"
                style={{ color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}
              >
                {conv.title}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all duration-200 hover:bg-red-500/15"
              >
                <Trash2 className="w-3 h-3 text-red-400/70 hover:text-red-400 transition-colors" />
              </button>
            </div>
          );
        })}

        {/* 空状态 */}
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 animate-fade-in">
            <div className="relative mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(6, 182, 212, 0.06)",
                  border: "1px dashed rgba(6, 182, 212, 0.15)",
                }}
              >
                <MessageCircle className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
              </div>
            </div>
            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              No conversations yet
            </p>
            <p className="text-[10px] mt-1 text-center" style={{ color: "rgba(95, 99, 104, 0.6)" }}>
              Click "New Chat" to start
            </p>
          </div>
        )}
      </div>

      {/* Settings Button */}
      <div className="p-2 relative">
        <div
          className="absolute top-0 left-4 right-4 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent)",
          }}
        />
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-white/[0.04] group"
          style={{ color: "var(--text-muted)" }}
        >
          <Settings className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
          <span className="group-hover:text-gray-400 transition-colors duration-200">Settings</span>
        </button>
      </div>
    </div>
  );
}
