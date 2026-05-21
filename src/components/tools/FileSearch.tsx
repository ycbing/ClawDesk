import { useState, useEffect, useRef, useCallback } from "react";
import { Search, File, Folder, Copy, ChevronRight, Loader2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useChatStore } from "../../stores/chatStore";

interface FileInfo {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
}

interface FileSearchProps {
  onInsertToChat?: (content: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function FileSearch({ onInsertToChat }: FileSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FileInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const searchFiles = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await invoke<FileInfo[]>("search_files", { query: q });
      setResults(res);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedFile(null);
    setFileContent(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchFiles(value), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      searchFiles(query);
    }
    if (e.key === "Escape") {
      setQuery("");
      setResults([]);
      setSelectedFile(null);
      setFileContent(null);
    }
  };

  const handleFileClick = async (file: FileInfo) => {
    if (file.is_dir) {
      setQuery(file.path);
      searchFiles(file.path);
      return;
    }
    setSelectedFile(file.path);
    setFileContent(null);
    setLoadingContent(true);
    try {
      const content = await invoke<string>("read_file_content", { path: file.path });
      setFileContent(content);
    } catch (err: any) {
      setFileContent(`Error reading file: ${err}`);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleInsertToChat = () => {
    if (!fileContent || !onInsertToChat) return;
    onInsertToChat(fileContent);
  };

  const handleCopyPath = async (path: string) => {
    try {
      await invoke("set_clipboard_text", { content: path });
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 1500);
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
            <Search className="w-4 h-4" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              File Search
            </h2>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Search and preview files on your system
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files by name..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all duration-300"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
          />
          {isSearching && (
            <Loader2
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin"
              style={{ color: "var(--accent)" }}
            />
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 flex overflow-hidden">
        {/* File List */}
        <div className="flex-1 overflow-y-auto px-2">
          {results.length > 0 && (
            <p className="px-3 py-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
          )}
          {results.map((file, idx) => (
            <div
              key={file.path}
              onClick={() => handleFileClick(file)}
              className="group flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 mx-1"
              style={{
                background: selectedFile === file.path ? "rgba(6, 182, 212, 0.08)" : undefined,
              }}
              onMouseEnter={(e) => {
                if (selectedFile !== file.path) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedFile !== file.path) {
                  e.currentTarget.style.background = "";
                }
              }}
            >
              {file.is_dir ? (
                <Folder className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
              ) : (
                <File className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm truncate"
                  style={{
                    color: selectedFile === file.path ? "var(--accent-hover)" : "var(--text-primary)",
                  }}
                >
                  {file.name}
                </p>
                <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                  {file.path}
                  {!file.is_dir && ` · ${formatSize(file.size)}`}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyPath(file.path);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all duration-200 hover:bg-white/[0.06]"
                title="Copy path"
              >
                <Copy
                  className="w-3 h-3"
                  style={{
                    color: copiedPath === file.path ? "var(--accent)" : "var(--text-muted)",
                  }}
                />
              </button>
            </div>
          ))}

          {query && !isSearching && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Search className="w-8 h-8 mb-3" style={{ color: "var(--text-muted)", opacity: 0.3 }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No files found
              </p>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                Try a different search term
              </p>
            </div>
          )}

          {!query && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{
                  background: "rgba(6, 182, 212, 0.06)",
                  border: "1px dashed rgba(6, 182, 212, 0.15)",
                }}
              >
                <Search className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Type to search files
              </p>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                Supports filename and path search
              </p>
            </div>
          )}
        </div>

        {/* File Preview Panel */}
        {selectedFile && (
          <div
            className="w-72 shrink-0 flex flex-col border-l animate-slide-in-right"
            style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
          >
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 min-w-0">
                <File className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                <span className="text-xs truncate" style={{ color: "var(--text-primary)" }}>
                  {selectedFile.split("/").pop()}
                </span>
              </div>
              {onInsertToChat && fileContent && !fileContent.startsWith("Error") && (
                <button
                  onClick={handleInsertToChat}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all duration-200 hover:bg-white/[0.06]"
                  style={{ color: "var(--accent)" }}
                >
                  Insert
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {loadingContent ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--accent)" }} />
                </div>
              ) : fileContent ? (
                <pre
                  className="text-[11px] leading-relaxed whitespace-pre-wrap break-words"
                  style={{
                    color: "var(--text-secondary)",
                    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                  }}
                >
                  {fileContent.length > 10000 ? fileContent.slice(0, 10000) + "\n\n... (truncated)" : fileContent}
                </pre>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
