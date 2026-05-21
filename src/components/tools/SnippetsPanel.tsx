import { useState } from "react";
import { Code, Plus, Search, Trash2, Copy, Check, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useToolStore } from "../../stores/toolStore";

export function SnippetsPanel() {
  const { snippets, addSnippet, deleteSnippet } = useToolStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newName.trim() || !newContent.trim()) return;
    addSnippet(newName.trim(), newContent.trim());
    setNewName("");
    setNewContent("");
    setShowAddForm(false);
  };

  const handleCopy = async (id: string, content: string) => {
    try {
      await invoke("set_clipboard_text", { content });
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Copy error:", err);
    }
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteSnippet(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const filtered = searchQuery
    ? snippets.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : snippets;

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))",
                border: "1px solid rgba(6, 182, 212, 0.12)",
              }}
            >
              <Code className="w-4 h-4" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Snippets
              </h2>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Quick access to code & text
              </p>
            </div>
          </div>

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-white/[0.04]"
              title="Add snippet"
            >
              <Plus className="w-4 h-4" style={{ color: "var(--accent)" }} />
            </button>
          )}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div
            className="mb-4 p-4 rounded-xl animate-fade-in"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                New Snippet
              </span>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewName("");
                  setNewContent("");
                }}
                className="p-1 rounded-md hover:bg-white/[0.06]"
              >
                <X className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Snippet name..."
              className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-2"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Snippet content..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none mb-3"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
              }}
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newContent.trim()}
              className="w-full py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 disabled:opacity-30"
              style={{
                background:
                  newName.trim() && newContent.trim()
                    ? "linear-gradient(135deg, #06b6d4, #0891b2)"
                    : "rgba(255,255,255,0.08)",
              }}
            >
              Add Snippet
            </button>
          </div>
        )}

        {/* Search */}
        {snippets.length > 0 && !showAddForm && (
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search snippets..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-300"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-light)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        )}
      </div>

      {/* Snippets List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filtered.map((snippet) => (
          <div
            key={snippet.id}
            className="group p-3 rounded-xl transition-all duration-200 mb-1"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "";
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {snippet.name}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(snippet.id, snippet.content)}
                  className="p-1.5 rounded-md transition-all duration-200 hover:bg-white/[0.06]"
                  title="Copy content"
                >
                  {copiedId === snippet.id ? (
                    <Check className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                  ) : (
                    <Copy className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(snippet.id)}
                  className="p-1.5 rounded-md transition-all duration-200 hover:bg-red-500/15"
                  title={deleteConfirm === snippet.id ? "Click again to confirm" : "Delete"}
                >
                  <Trash2
                    className="w-3.5 h-3.5"
                    style={{
                      color: deleteConfirm === snippet.id ? "#f87171" : "var(--text-muted)",
                    }}
                  />
                </button>
              </div>
            </div>
            <pre
              className="text-[12px] leading-relaxed whitespace-pre-wrap break-words"
              style={{
                color: "var(--text-secondary)",
                fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                maxHeight: "120px",
                overflow: "hidden",
              }}
            >
              {snippet.content.length > 500
                ? snippet.content.slice(0, 500) + "\n..."
                : snippet.content}
            </pre>
          </div>
        ))}

        {snippets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{
                background: "rgba(6, 182, 212, 0.06)",
                border: "1px dashed rgba(6, 182, 212, 0.15)",
              }}
            >
              <Code className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No snippets yet
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              Click + to add your first snippet
            </p>
          </div>
        )}

        {snippets.length > 0 && filtered.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No matches found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
