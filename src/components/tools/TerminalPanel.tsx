import { useState, useRef, useEffect, useCallback } from "react";
import { Terminal, Send, Copy, AlertTriangle, Check, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface CommandOutput {
  cmd: string;
  output: string;
  isError: boolean;
  timestamp: number;
}

const DANGEROUS_PATTERNS = [
  /\brm\s+(-[rfRF]+\s+)?\/\b/,      // rm -rf /
  /\brm\s+(-[rfRF]+\s+)?~\b/,       // rm -rf ~
  /\bsudo\s+rm\b/,
  /\bdd\s+if=.*of=\/dev\/sd/,
  /\bmkfs\b/,
  />\s*\/dev\//,
  /\bchmod\s+-R\s+777\s+\/\b/,
  /\bsudo\s+sh\s+-c/,
  /\bshred\b/,
  /\bwipe\b/,
];

function isDangerous(cmd: string): { dangerous: boolean; reason: string } {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(cmd)) {
      return { dangerous: true, reason: "This command may cause irreversible damage" };
    }
  }
  // Detect sudo usage
  if (/sudo\b/.test(cmd)) {
    return { dangerous: true, reason: "This command requires elevated privileges" };
  }
  return { dangerous: false, reason: "" };
}

export function TerminalPanel() {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<CommandOutput[]>([]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdHistoryIndex, setCmdHistoryIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [pendingDangerous, setPendingDangerous] = useState<{ cmd: string; reason: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = useCallback(async (cmd: string) => {
    if (!cmd.trim() || isRunning) return;

    setIsRunning(true);
    const entry: CommandOutput = {
      cmd: cmd.trim(),
      output: "",
      isError: false,
      timestamp: Date.now(),
    };

    setHistory((prev) => [...prev, entry]);
    setCommand("");

    // Update command history
    setCmdHistory((prev) => {
      const filtered = prev.filter((c) => c !== cmd.trim());
      return [cmd.trim(), ...filtered].slice(0, 50);
    });
    setCmdHistoryIndex(-1);

    try {
      const output = await invoke<string>("execute_command", { cmd: cmd.trim() });
      setHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          output: output || "(no output)",
        };
        return updated;
      });
    } catch (err: any) {
      setHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          output: typeof err === "string" ? err : err.message || String(err),
          isError: true,
        };
        return updated;
      });
    } finally {
      setIsRunning(false);
      inputRef.current?.focus();
    }
  }, [isRunning]);

  const handleSubmit = () => {
    const trimmed = command.trim();
    if (!trimmed) return;

    const { dangerous, reason } = isDangerous(trimmed);
    if (dangerous) {
      setPendingDangerous({ cmd: trimmed, reason });
      return;
    }

    executeCommand(trimmed);
  };

  const handleConfirmDangerous = () => {
    if (pendingDangerous) {
      executeCommand(pendingDangerous.cmd);
      setPendingDangerous(null);
    }
  };

  const handleCancelDangerous = () => {
    setPendingDangerous(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIndex = cmdHistoryIndex === -1 ? 0 : Math.min(cmdHistoryIndex + 1, cmdHistory.length - 1);
        setCmdHistoryIndex(newIndex);
        setCommand(cmdHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cmdHistoryIndex > 0) {
        const newIndex = cmdHistoryIndex - 1;
        setCmdHistoryIndex(newIndex);
        setCommand(cmdHistory[newIndex]);
      } else if (cmdHistoryIndex === 0) {
        setCmdHistoryIndex(-1);
        setCommand("");
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    }
  };

  const handleCopyOutput = async (idx: number) => {
    const entry = history[idx];
    try {
      await invoke("set_clipboard_text", { content: entry.output });
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch (err) {
      console.error("Copy error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))",
              border: "1px solid rgba(6, 182, 212, 0.12)",
            }}
          >
            <Terminal className="w-4 h-4" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Terminal
            </h2>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Execute shell commands
            </p>
          </div>
        </div>

        {/* Tips */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]"
          style={{
            background: "rgba(6, 182, 212, 0.06)",
            border: "1px solid rgba(6, 182, 212, 0.1)",
            color: "var(--text-muted)",
          }}
        >
          <span>↑↓</span> History
          <span className="mx-0.5">·</span>
          <span>Ctrl+L</span> Clear
        </div>
      </div>

      {/* Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5"
        style={{ fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace" }}
      >
        {history.map((entry, idx) => (
          <div key={idx} className="mb-4">
            {/* Command */}
            <div className="flex items-start gap-2">
              <span style={{ color: "var(--accent)" }}>$</span>
              <span className="text-sm break-words" style={{ color: "var(--text-primary)" }}>
                {entry.cmd}
              </span>
            </div>
            {/* Output */}
            <div className="relative ml-4 mt-1">
              <pre
                className="text-[12px] leading-relaxed whitespace-pre-wrap break-words"
                style={{
                  color: entry.isError ? "#f87171" : "var(--text-secondary)",
                }}
              >
                {entry.output}
              </pre>
              <button
                onClick={() => handleCopyOutput(idx)}
                className="absolute top-0 right-0 p-1.5 rounded-md opacity-0 hover:opacity-100 transition-opacity duration-200 hover:bg-white/[0.06]"
                title="Copy output"
              >
                {copiedIdx === idx ? (
                  <Check className="w-3 h-3" style={{ color: "var(--accent)" }} />
                ) : (
                  <Copy className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                )}
              </button>
            </div>
          </div>
        ))}

        {isRunning && (
          <div className="flex items-center gap-2 mb-4">
            <span style={{ color: "var(--accent)" }}>$</span>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {history[history.length - 1]?.cmd || command}
            </span>
            <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--accent)" }} />
          </div>
        )}

        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{
                background: "rgba(6, 182, 212, 0.06)",
                border: "1px dashed rgba(6, 182, 212, 0.15)",
              }}
            >
              <Terminal className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Type a command to execute
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Commands run in your system shell
            </p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-5 pb-4">
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-300"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-light)",
          }}
        >
          <span style={{ color: "var(--accent)", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
            $
          </span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            disabled={isRunning}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{
              color: "var(--text-primary)",
              fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!command.trim() || isRunning}
            className="p-1.5 rounded-lg transition-all duration-200 disabled:opacity-25"
            style={{
              background: command.trim() ? "linear-gradient(135deg, #06b6d4, #0891b2)" : "transparent",
            }}
          >
            <Send
              className="w-3.5 h-3.5"
              style={{ color: command.trim() ? "#fff" : "var(--text-muted)" }}
            />
          </button>
        </div>
      </div>

      {/* Dangerous Command Confirmation Modal */}
      {pendingDangerous && (
        <div
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-2xl p-5 animate-fade-in"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(239, 68, 68, 0.12)" }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: "#f87171" }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Dangerous Command
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {pendingDangerous.reason}
                </p>
              </div>
            </div>
            <pre
              className="px-3 py-2 rounded-lg mb-4 text-[12px] break-words"
              style={{
                background: "#0d1117",
                color: "#f87171",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
              }}
            >
              {pendingDangerous.cmd}
            </pre>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={handleCancelDangerous}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/[0.06]"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDangerous}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                }}
              >
                Execute Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
