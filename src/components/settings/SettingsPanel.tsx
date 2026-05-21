import { ArrowLeft, Key, Globe, Palette, Keyboard, Check } from "lucide-react";
import { useSettingsStore, AIProvider } from "../../stores/settingsStore";

interface SettingsPanelProps {
  onBack: () => void;
}

const providers: { value: AIProvider; label: string; defaultUrl: string; defaultModel: string }[] = [
  { value: "openai", label: "OpenAI", defaultUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini" },
  { value: "zhipu", label: "GLM (Zhipu)", defaultUrl: "https://open.bigmodel.cn/api/paas/v4", defaultModel: "glm-4-flash" },
  { value: "custom", label: "Custom", defaultUrl: "", defaultModel: "" },
];

const themes = [
  { value: "dark" as const, label: "Dark", icon: "🌙" },
  { value: "light" as const, label: "Light", icon: "☀️" },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl p-4 ${className}`}
      style={{
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border)",
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {label}
      </h3>
    </div>
  );
}

function FormInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm bg-transparent border outline-none transition-all duration-200 placeholder-gray-600"
        style={{
          borderColor: "var(--border-light)",
          color: "var(--text-primary)",
          background: "var(--bg-elevated)",
        }}
      />
    </div>
  );
}

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
      <div className="flex items-center gap-3 px-5 py-3 shrink-0 relative">
        <div
          className="absolute bottom-0 left-5 right-5 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent)",
          }}
        />
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg transition-all duration-200 hover:bg-white/[0.06] active:scale-90"
        >
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
        </button>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Settings
        </h2>
      </div>

      <div className="flex-1 p-5 space-y-4">
        {/* AI Provider Section */}
        <Card>
          <SectionLabel
            icon={<Key className="w-4 h-4" style={{ color: "var(--accent)" }} />}
            label="AI Provider"
          />

          {/* Segmented Control for Provider */}
          <div className="mb-4 p-1 rounded-xl flex gap-1" style={{ background: "var(--bg-elevated)" }}>
            {providers.map((p) => (
              <button
                key={p.value}
                onClick={() => handleProviderChange(p.value)}
                className="flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background:
                    settings.ai.provider === p.value
                      ? "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.08))"
                      : "transparent",
                  color:
                    settings.ai.provider === p.value
                      ? "var(--accent-hover)"
                      : "var(--text-muted)",
                  border:
                    settings.ai.provider === p.value
                      ? "1px solid rgba(6, 182, 212, 0.2)"
                      : "1px solid transparent",
                }}
              >
                {settings.ai.provider === p.value && (
                  <Check className="w-3 h-3 inline mr-1" style={{ verticalAlign: "-2px" }} />
                )}
                {p.label}
              </button>
            ))}
          </div>

          <FormInput
            label="API Key"
            type="password"
            value={settings.ai.apiKey}
            onChange={(v) => updateAI({ apiKey: v })}
            placeholder="sk-..."
          />
          <FormInput
            label="Base URL"
            value={settings.ai.baseUrl}
            onChange={(v) => updateAI({ baseUrl: v })}
            placeholder="https://api.openai.com/v1"
          />
          <FormInput
            label="Model"
            value={settings.ai.model}
            onChange={(v) => updateAI({ model: v })}
            placeholder="gpt-4o-mini"
          />
        </Card>

        {/* Appearance Section */}
        <Card>
          <SectionLabel
            icon={<Palette className="w-4 h-4" style={{ color: "var(--accent)" }} />}
            label="Appearance"
          />

          <label className="block text-xs mb-2.5" style={{ color: "var(--text-muted)" }}>
            Theme
          </label>
          <div className="flex gap-2">
            {themes.map((theme) => {
              const isActive = settings.theme === theme.value;
              return (
                <button
                  key={theme.value}
                  onClick={() => updateSettings({ theme: theme.value })}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))"
                      : "var(--bg-elevated)",
                    color: isActive ? "var(--accent-hover)" : "var(--text-muted)",
                    border: isActive
                      ? "1px solid rgba(6, 182, 212, 0.25)"
                      : "1px solid var(--border)",
                    boxShadow: isActive
                      ? "0 0 12px rgba(6, 182, 212, 0.1)"
                      : "none",
                  }}
                >
                  <span className="mr-1.5">{theme.icon}</span>
                  {theme.label}
                  {isActive && (
                    <Check
                      className="w-3 h-3 inline ml-1"
                      style={{ verticalAlign: "-2px", color: "var(--accent)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Shortcut Section */}
        <Card>
          <SectionLabel
            icon={<Keyboard className="w-4 h-4" style={{ color: "var(--accent)" }} />}
            label="Shortcut"
          />

          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
            }}
          >
            <kbd
              className="px-2 py-1 rounded-lg text-xs font-medium"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--text-secondary)",
              }}
            >
              {settings.shortcut === "ctrl+space" ? "Ctrl" : "⌘ Cmd"}
            </kbd>
            <span style={{ color: "var(--text-muted)" }}>+</span>
            <kbd
              className="px-2 py-1 rounded-lg text-xs font-medium"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "var(--text-secondary)",
              }}
            >
              Space
            </kbd>
            <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>
              Toggle ClawDesk
            </span>
          </div>
        </Card>

        {/* About Section */}
        <Card>
          <SectionLabel
            icon={<Globe className="w-4 h-4" style={{ color: "var(--accent)" }} />}
            label="About"
          />

          <div className="space-y-1.5">
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              ClawDesk <span style={{ color: "var(--text-muted)" }}>v0.1.0</span>
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              AI Desktop Assistant by CraftMind
            </p>
            <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>
              craftmind.cn
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
