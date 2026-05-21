import type { Message } from "../stores/chatStore";
import type { AIProvider } from "../stores/settingsStore";

interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export async function* streamChat(
  messages: Pick<Message, "role" | "content">[],
  config: AIConfig
): AsyncGenerator<string, void, unknown> {
  const url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;

  const body = {
    model: config.model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    stream: true,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.provider === "zhipu") {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  } else {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          yield content;
        }
      } catch {
        // Skip malformed JSON chunks
      }
    }
  }
}

export function formatMessage(content: string): string {
  // Basic markdown-like formatting for display
  return content
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, "<code class='inline-code'>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}
