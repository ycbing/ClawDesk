import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { TitleBar } from "./components/layout/TitleBar";
import { Sidebar } from "./components/layout/Sidebar";
import { ChatPanel } from "./components/chat/ChatPanel";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { FileSearch } from "./components/tools/FileSearch";
import { ClipboardPanel } from "./components/tools/ClipboardPanel";
import { TerminalPanel } from "./components/tools/TerminalPanel";
import { SnippetsPanel } from "./components/tools/SnippetsPanel";
import { CommandPalette } from "./components/command/CommandPalette";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useChatStore } from "./stores/chatStore";
import { useToolStore } from "./stores/toolStore";
import { MainView } from "./stores/toolStore";

type View = "chat" | "settings" | MainView;

export default function App() {
  const [view, setView] = useState<View>("chat");
  const [showPalette, setShowPalette] = useState(false);
  const { conversations, activeConversationId, addMessage } = useChatStore();
  const { mainView, setMainView } = useToolStore();
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Sync mainView from toolStore into the combined view
  const effectiveView: View = view === "settings" ? "settings" : mainView;

  // Listen for toggle-window event from Rust
  useEffect(() => {
    const unlisten = listen("toggle-window", () => {
      // Window show/hide is handled by Rust
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Ctrl+K / Cmd+K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowPalette((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Window size memory (save to localStorage)
  useEffect(() => {
    const handleResize = () => {
      localStorage.setItem(
        "clawdesk-window-size",
        JSON.stringify({ width: window.innerWidth, height: window.innerHeight })
      );
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load saved window size hint
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clawdesk-window-size");
      if (saved) {
        const { width, height } = JSON.parse(saved);
        if (width && height) {
          window.resizeTo(width, height);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleNewChat = useCallback(() => {
    setMainView("chat");
    setView("chat");
    useChatStore.getState().createConversation();
  }, [setMainView]);

  const handleOpenSettings = useCallback(() => {
    setView("settings");
  }, []);

  const handleInsertToChat = useCallback(
    (content: string) => {
      let convId = activeConversationId;
      if (!convId) {
        convId = useChatStore.getState().createConversation();
      }
      addMessage(convId, { role: "user", content });
      setMainView("chat");
    },
    [activeConversationId, addMessage, setMainView]
  );

  const handleClosePalette = useCallback(() => {
    setShowPalette(false);
  }, []);

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden relative"
      style={{ background: "var(--bg-primary)" }}
    >
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onNewChat={handleNewChat} onOpenSettings={handleOpenSettings} />
        <div
          className="flex-1 flex flex-col overflow-hidden relative"
          style={{ background: "var(--bg-primary)" }}
        >
          <ErrorBoundary>
            {effectiveView === "settings" ? (
              <div className="animate-fade-in h-full">
                <SettingsPanel onBack={() => setView("chat")} />
              </div>
            ) : effectiveView === "filesearch" ? (
              <FileSearch onInsertToChat={handleInsertToChat} />
            ) : effectiveView === "clipboard" ? (
              <ClipboardPanel />
            ) : effectiveView === "terminal" ? (
              <TerminalPanel />
            ) : effectiveView === "snippets" ? (
              <SnippetsPanel />
            ) : (
              <ChatPanel conversation={activeConversation} />
            )}
          </ErrorBoundary>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showPalette}
        onClose={handleClosePalette}
        onNewChat={handleNewChat}
        onOpenSettings={handleOpenSettings}
      />
    </div>
  );
}
