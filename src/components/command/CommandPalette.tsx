import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  MessageSquarePlus,
  Settings,
  FileSearch,
  Clipboard,
  Terminal,
  Trash2,
  Code,
  Moon,
  Sun,
} from "lucide-react";
import { useToolStore, MainView } from "../../stores/toolStore";
import { useChatStore } from "../../stores/chatStore";
import { useSettingsStore } from "../../stores/settingsStore";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export function CommandPalette({ isOpen, onClose, onNewChat, onOpenSettings }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { setMainView } = useToolStore();
  const { clearMessages, activeConversationId } = useChatStore();
  const { settings, updateSettings } = useSettingsStore();

  const commands = useMemo<CommandItem[]>(() => [
    {
      id: "new-chat",
      label: "New Chat",
      description: "Start a new conversation",
      icon: <MessageSquarePlus className="w-4 h-4" />,
      category: "Chat",
      action: () => { onNewChat(); onClose(); },
    },
    {
      id: "open-settings",
      label: "Open Settings",
      description: "Configure API keys and preferences",
      icon: <Settings className="w-4 h-4" />,
      category: "App",
      action: () => { onOpenSettings(); onClose(); },
    },
    {
      id: "file-search",
      label: "File Search",
      description: "Search and preview files",
      icon: <FileSearch className="w-4 h-4" />,
      category: "Tools",
      action: () => { setMainView("filesearch"); onClose(); },
    },
    {
      id: "clipboard",
      label: "Clipboard History",
      description: "View and manage clipboard",
      icon: <Clipboard className="w-4 h-4" />,
      category: "Tools",
      action: () => { setMainView("clipboard"); onClose(); },
    },
    {
      id: "terminal",
      label: "Terminal",
      description: "Execute shell commands",
      icon: <Terminal className="w-4 h-4" />,
      category: "Tools",
      action: () => { setMainView("terminal"); onClose(); },
    },
    {
      id: "snippets",
      label: "Code Snippets",
      description: "Manage code and text snippets",
      icon: <Code className="w-4 h-4" />,
      category: "Tools",
      action: () => { setMainView("snippets"); onClose(); },
    },
    {
      id: "clear-chat",
      label: "Clear Chat",
      description: "Clear messages in current chat",
      icon: <Trash2 className="w-4 h-4" />,
      category: "Chat",
      action: () => {
        if (activeConversationId) clearMessages(activeConversationId);
        onClose();
      },
    },
    {
      id: "toggle-theme",
      label: settings.theme === "dark" ? "Light Mode" : "Dark Mode",
      description: "Switch application theme",
      icon: settings.theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      category: "App",
      action: () => {
        updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" });
        onClose();
      },
    },
  ], [setMainView, onNewChat, onOpenSettings, clearMessages, activeConversationId, settings.theme, updateSettings]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [query, commands]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[20vh] z-[100]"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-2xl overflow-hidden animate-fade-in"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-light)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <Search className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
          />
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] shrink-0"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text-muted)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No commands found
              </p>
            </div>
          )}
          {filtered.map((cmd, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={cmd.id}
                onClick={() => cmd.action()}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-150 mx-1 rounded-lg"
                style={{
                  background: isSelected ? "rgba(6, 182, 212, 0.1)" : undefined,
                }}
                onMouseEnter={(e) => {
                  setSelectedIndex(idx);
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: isSelected ? "rgba(6, 182, 212, 0.15)" : "var(--bg-tertiary)",
                    color: isSelected ? "var(--accent)" : "var(--text-muted)",
                    border: `1px solid ${isSelected ? "rgba(6, 182, 212, 0.2)" : "var(--border)"}`,
                  }}
                >
                  {cmd.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    {cmd.label}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {cmd.description}
                  </p>
                </div>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {cmd.category}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-4 py-2 text-[11px]"
          style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          <span className="flex items-center gap-1">
            <kbd
              className="px-1 py-0.5 rounded"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: "9px",
              }}
            >
              ↑↓
            </kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd
              className="px-1 py-0.5 rounded"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: "9px",
              }}
            >
              ↵
            </kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd
              className="px-1 py-0.5 rounded"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: "9px",
              }}
            >
              esc
            </kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
