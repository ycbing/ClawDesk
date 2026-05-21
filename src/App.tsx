import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { TitleBar } from "./components/layout/TitleBar";
import { Sidebar } from "./components/layout/Sidebar";
import { ChatPanel } from "./components/chat/ChatPanel";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { useChatStore } from "./stores/chatStore";
import { useSettingsStore } from "./stores/settingsStore";

type View = "chat" | "settings";

export default function App() {
  const [view, setView] = useState<View>("chat");
  const { conversations, activeConversationId } = useChatStore();
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Listen for toggle-window event from Rust
  useEffect(() => {
    const unlisten = listen("toggle-window", () => {
      // Window show/hide is handled by Rust, but we can refocus input here
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onNewChat={() => {
            setView("chat");
            useChatStore.getState().createConversation();
          }}
          onOpenSettings={() => setView("settings")}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          {view === "settings" ? (
            <SettingsPanel onBack={() => setView("chat")} />
          ) : (
            <ChatPanel conversation={activeConversation} />
          )}
        </div>
      </div>
    </div>
  );
}
