import { MessageSquarePlus, Settings, Trash2 } from "lucide-react";
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
      className="w-56 flex flex-col shrink-0 border-r"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
      }}
    >
      {/* New Chat Button */}
      <div className="p-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
              activeConversationId === conv.id ? "bg-white/10" : "hover:bg-white/5"
            }`}
            onClick={() => setActiveConversation(conv.id)}
          >
            <div className="flex-1 truncate text-gray-300">{conv.title}</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteConversation(conv.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-all"
            >
              <Trash2 className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        ))}
        {conversations.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-xs">No conversations yet</div>
        )}
      </div>

      {/* Settings Button */}
      <div className="p-2 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
