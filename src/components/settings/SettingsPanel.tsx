import { ArrowLeft, Key, Globe, Palette, Keyboard } from "lucide-react";
import { useSettingsStore, AIProvider } from "../../stores/settingsStore";

interface SettingsPanelProps {
  onBack: () => void;
}

const providers: { value: AIProvider; label: string; defaultUrl: string; defaultModel: string }[] = [
  { value: "openai", label: "OpenAI", defaultUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini" },
  { value: "zhipu", label: "智谱 GLM (Zhipu)", defaultUrl: "https://open.bigmodel.cn/api/paas/v4", defaultModel: "glm-4-flash" },
  { value: "custom", label: "Custom (OpenAI Compatible)", defaultUrl: "", defaultModel: "" },
];

export function SettingsPanel({ onBack }: SettingsPanelProps) {
  const { settings, updateAI, updateSettings } = useSettingsStore();

  const handleProviderChange = (provider: AIProvider) => {
    const preset = providers.find((p) => p.value === provider);
    if (preset) {
      updateAI({
        provider,
        baseUrl: preset.defaultUrl,
        model: preset.defaultModel,
      });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          onClick={onBack}
          className="p-1 rounded hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-400" />
        </button>
        <h2 className="text-sm font-semibold text-gray-200">Settings</h2>
      </div>

      <div className="flex-1 p-4 space-y-6">
        {/* AI Provider */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-medium text-gray-300">AI Provider</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Provider</label>
              <select
                value={settings.ai.provider}
                onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none text-gray-200"
                style={{ borderColor: "var(--border)", background: "var(--bg-tertiary)" }}
              >
                {providers.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">API Key</label>
              <input
                type="password"
                value={settings.ai.apiKey}
                onChange={(e) => updateAI({ apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none text-gray-200 placeholder-gray-600"
                style={{ borderColor: "var(--border)", background: "var(--bg-tertiary)" }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Base URL</label>
              <input
                type="text"
                value={settings.ai.baseUrl}
                onChange={(e) => updateAI({ baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none text-gray-200 placeholder-gray-600"
                style={{ borderColor: "var(--border)", background: "var(--bg-tertiary)" }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Model</label>
              <input
                type="text"
                value={settings.ai.model}
                onChange={(e) => updateAI({ model: e.target.value })}
                placeholder="gpt-4o-mini"
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none text-gray-200 placeholder-gray-600"
                style={{ borderColor: "var(--border)", background: "var(--bg-tertiary)" }}
              />
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-medium text-gray-300">Appearance</h3>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Theme</label>
            <div className="flex gap-2">
              {(["dark", "light"] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateSettings({ theme })}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    settings.theme === theme
                      ? "border-cyan-500 text-cyan-400"
                      : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                  style={{ background: "var(--bg-tertiary)" }}
                >
                  {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Shortcut */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Keyboard className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-medium text-gray-300">Shortcut</h3>
          </div>
          <div
            className="px-3 py-2 rounded-lg text-sm text-gray-400 border"
            style={{ borderColor: "var(--border)", background: "var(--bg-tertiary)" }}
          >
            <kbd className="px-1.5 py-0.5 rounded text-xs bg-white/5 border border-white/10">
              {settings.shortcut === "ctrl+space" ? "Ctrl" : "⌘ Cmd"}
            </kbd>
            {" + "}
            <kbd className="px-1.5 py-0.5 rounded text-xs bg-white/5 border border-white/10">Space</kbd>
            <span className="text-xs text-gray-600 ml-2">Toggle ClawDesk</span>
          </div>
        </section>

        {/* About */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-medium text-gray-300">About</h3>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>ClawDesk v0.1.0</p>
            <p>AI Desktop Assistant by CraftMind</p>
            <p style={{ color: "var(--accent)" }}>craftmind.cn</p>
          </div>
        </section>
      </div>
    </div>
  );
}
