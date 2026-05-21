import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AIProvider = "openai" | "zhipu" | "custom";

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface AppSettings {
  ai: AISettings;
  theme: "dark" | "light";
  shortcut: string;
  fontSize: number;
}

interface SettingsState {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  updateAI: (partial: Partial<AISettings>) => void;
}

const defaultSettings: AppSettings = {
  ai: {
    provider: "zhipu",
    apiKey: "",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4-flash",
  },
  theme: "dark",
  shortcut: "ctrl+space",
  fontSize: 14,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      updateAI: (partial) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ai: { ...state.settings.ai, ...partial },
          },
        })),
    }),
    {
      name: "clawdesk-settings",
    }
  )
);
