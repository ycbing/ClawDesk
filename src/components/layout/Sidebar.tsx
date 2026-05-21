import { MessageSquarePlus, Settings, Trash2, MessageCircle, FolderOpen, Clipboard, Terminal } from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import { useToolStore, MainView } from "../../stores/toolStore";
import { t } from "../../lib/i18n";

interface SidebarProps {
  onNewChat: () => void;
  onOpenSettings: () => void;
}

const toolButtons: { view: MainView; icon: typeof FolderOpen; labelKey: string }[] = [
  { view: "filesearch", icon: FolderOpen, labelKey: "tools.files" },
  { view: "clipboard", icon: Clipboard, labelKey: "tools.clipboard" },
  { view: "terminal", icon: Terminal, labelKey: "tools.terminal" },
];

export function Sidebar({ onNewChat, onOpenSettings }: SidebarProps) {
  const { conversations, activeConversationId, setActiveConversation, deleteConversation } =
    useChatStore();
  const { mainView, setMainView } = useToolStore();

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
          onClick={() => {
            setMainView("chat");
            onNewChat();
          }}
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
          <span>{t("sidebar.newChat")}</span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {conversations.map((conv) => {
          const isActive = activeConversationId === conv.id && mainView === "chat";
          return (
            <div
              key={conv.id}
              className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-200 ${
                isActive ? "" : "hover:bg-white/[0.04]"
              }`}
              onClick={() => {
                setActiveConversation(conv.id);
                setMainView("chat");
              }}
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
              {t("sidebar.noChats")}
            </p>
            <p className="text-[10px] mt-1 text-center" style={{ color: "rgba(95, 99, 104, 0.6)" }}>
              {t("sidebar.noChatsHint")}
            </p>
          </div>
        )}
      </div>

      {/* Tool Buttons */}
      <div className="px-2 py-1">
        <div className="flex items-center justify-center gap-1">
          {toolButtons.map(({ view, icon: Icon, labelKey }) => {
            const isActive = mainView === view;
            const label = t(labelKey);
            return (
              <button
                key={view}
                onClick={() => setMainView(view)}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-medium transition-all duration-200"
                style={{
                  background: isActive ? "rgba(6, 182, 212, 0.1)" : undefined,
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                  border: isActive ? "1px solid rgba(6, 182, 212, 0.15)" : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }
                }}
                title={label}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
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
          onClick={() => {
            setMainView("chat");
            onOpenSettings();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-white/[0.04] group"
          style={{ color: "var(--text-muted)" }}
        >
          <Settings className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
          <span className="group-hover:text-gray-400 transition-colors duration-200">{t("sidebar.settings")}</span>
        </button>
      </div>
    </div>
  );
}
