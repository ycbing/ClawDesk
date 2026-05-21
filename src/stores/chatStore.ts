import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Omit<Message, "id" | "timestamp">) => void;
  updateLastAssistantMessage: (conversationId: string, content: string) => void;
  clearMessages: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

      createConversation: () => {
        const id = crypto.randomUUID();
        const now = Date.now();
        const newConversation: Conversation = {
          id,
          title: "New Chat",
          messages: [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      deleteConversation: (id) => {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id);
          return {
            conversations: filtered,
            activeConversationId:
              state.activeConversationId === id
                ? filtered[0]?.id ?? null
                : state.activeConversationId,
          };
        });
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      addMessage: (conversationId, message) => {
        const msg: Message = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const updatedMessages = [...c.messages, msg];
            const title =
              c.messages.length === 0 && message.role === "user"
                ? message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "")
                : c.title;
            return { ...c, messages: updatedMessages, title, updatedAt: Date.now() };
          }),
        }));
      },

      updateLastAssistantMessage: (conversationId, content) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            const msgs = [...c.messages];
            const lastIdx = msgs.length - 1;
            if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
              msgs[lastIdx] = { ...msgs[lastIdx], content };
            }
            return { ...c, messages: msgs, updatedAt: Date.now() };
          }),
        }));
      },

      clearMessages: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            return { ...c, messages: [], updatedAt: Date.now() };
          }),
        }));
      },
    }),
    {
      name: "clawdesk-chats",
    }
  )
);
