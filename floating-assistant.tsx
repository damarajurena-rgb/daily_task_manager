import { useState, useRef } from "react";
import { X, Sparkles, Loader2, Upload, FileText, AlertCircle } from "lucide-react";

const ACCEPTED = ".txt,.md,.csv,.log,.json,.yaml,.yml,.html,.xml,.rtf";
const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? "");
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

interface LoadedFile {
  name: string;
  size: number;
  error?: string;
}

type AIMode = "summarize" | "explain";

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [resultMode, setResultMode] = useState<AIMode>("summarize");
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<AIMode>("summarize");
  const [error, setError] = useState("");
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  async function processFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setResult("");
    setError("");

    const results: LoadedFile[] = [];
    const chunks: string[] = text ? [text] : [];

    for (const file of list) {
      if (file.size > MAX_SIZE_BYTES) {
        results.push({ name: file.name, size: file.size, error: `Exceeds ${MAX_SIZE_MB}MB limit` });
        continue;
      }
      try {
        const content = await readFileAsText(file);
        chunks.push(`--- ${file.name} ---\n${content}`);
        results.push({ name: file.name, size: file.size });
      } catch {
        results.push({ name: file.name, size: file.size, error: "Could not read file" });
      }
    }

    setText(chunks.join("\n\n"));
    setLoadedFiles((prev) => [...prev, ...results]);
    setUploading(false);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function runAI(mode: AIMode) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setLoadingMode(mode);
    setResult("");
    setError("");
    try {
      const endpoint = mode === "summarize" ? "/api/ai/summarize" : "/api/ai/explain";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      const data = await res.json();
      setResult(mode === "summarize" ? data.summary : data.explanation);
      setResultMode(mode);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setText("");
    setResult("");
    setError("");
    setLoadedFiles([]);
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-5 w-80 bg-card border border-card-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
          style={{ maxHeight: "80dvh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-card-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <img src="/robot.png" alt="AI Robot" className="w-5 h-5 object-contain" />
              <span className="text-sm font-medium text-foreground">AI Study Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-3 p-4 overflow-y-auto">

            {/* Drop zone / upload button */}
            <div
              ref={dropRef}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl py-4 px-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              <p className="text-xs text-muted-foreground text-center leading-snug">
                {uploading
                  ? "Reading files..."
                  : "Drop files here or click to upload"}
              </p>
              <p className="text-xs text-muted-foreground/60 text-center">
                .txt, .md, .csv, .json and more · max {MAX_SIZE_MB}MB each
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED}
              className="hidden"
              onChange={onFileChange}
            />

            {/* Loaded file chips */}
            {loadedFiles.length > 0 && (
              <div className="flex flex-col gap-1">
                {loadedFiles.map((f, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                      f.error
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {f.error ? (
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                    )}
                    <span className="truncate flex-1">{f.name}</span>
                    {f.error && <span className="flex-shrink-0">{f.error}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Textarea */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Paste or write your notes here, or upload files above..."
              className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
            />

            {/* Actions */}
            <div className="flex gap-2">
              {(text || loadedFiles.length > 0) && (
                <button
                  onClick={clearAll}
                  className="px-3 py-2 rounded-xl bg-muted text-muted-foreground text-sm hover:text-foreground transition-all duration-200"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => runAI("summarize")}
                disabled={loading || !text.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && loadingMode === "summarize" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Summarizing...</>
                ) : (
                  <><Sparkles className="w-4 h-4" />Summarize</>
                )}
              </button>
              <button
                onClick={() => runAI("explain")}
                disabled={loading || !text.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 border border-border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && loadingMode === "explain" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Explaining...</>
                ) : (
                  <><Sparkles className="w-4 h-4 text-primary" />Explain</>
                )}
              </button>
            </div>

            {error && (
              <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 leading-relaxed">
                {error}
              </div>
            )}

            {result && (
              <div className="animate-in fade-in duration-300">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                  {resultMode === "summarize" ? "Summary" : "Explanation"}
                </p>
                <div className="bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {result}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-5 right-5 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-200 active:scale-95 ${
          open
            ? "bg-primary/80 hover:bg-primary/70"
            : "bg-primary hover:bg-primary/90"
        }`}
        title="AI Study Assistant"
      >
        {open ? (
          <X className="w-6 h-6 text-primary-foreground" />
        ) : (
          <img src="/robot.png" alt="AI Assistant" className="w-8 h-8 object-contain" />
        )}
      </button>
    </>
  );
}
