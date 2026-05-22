import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MainView = "chat" | "screen" | "filesearch" | "clipboard" | "terminal" | "snippets";

export interface ClipboardEntry {
  id: string;
  content: string;
  timestamp: number;
}

export interface Snippet {
  id: string;
  name: string;
  content: string;
  createdAt: number;
}

interface ToolState {
  mainView: MainView;
  setMainView: (view: MainView) => void;
  clipboardHistory: ClipboardEntry[];
  addClipboardEntry: (content: string) => void;
  clearClipboardHistory: () => void;
  snippets: Snippet[];
  addSnippet: (name: string, content: string) => void;
  deleteSnippet: (id: string) => void;
}

export const useToolStore = create<ToolState>()(
  persist(
    (set) => ({
      mainView: "chat",
      setMainView: (view) => set({ mainView: view }),
      clipboardHistory: [],
      addClipboardEntry: (content) =>
        set((state) => {
          if (!content.trim()) return state;
          const filtered = state.clipboardHistory.filter(
            (e) => e.content !== content
          );
          const entry: ClipboardEntry = {
            id: crypto.randomUUID(),
            content,
            timestamp: Date.now(),
          };
          return {
            clipboardHistory: [entry, ...filtered].slice(0, 100),
          };
        }),
      clearClipboardHistory: () => set({ clipboardHistory: [] }),
      snippets: [],
      addSnippet: (name, content) =>
        set((state) => ({
          snippets: [
            {
              id: crypto.randomUUID(),
              name,
              content,
              createdAt: Date.now(),
            },
            ...state.snippets,
          ],
        })),
      deleteSnippet: (id) =>
        set((state) => ({
          snippets: state.snippets.filter((s) => s.id !== id),
        })),
    }),
    { name: "clawdesk-tools" }
  )
);
