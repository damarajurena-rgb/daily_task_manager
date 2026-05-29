import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListNotes,
  getListNotesQueryKey,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from "@workspace/api-client-react";
import type { Note } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { BookOpen, Plus, Trash2, Save, Youtube, FileText, Loader2, Sparkles } from "lucide-react";

function youtubeEmbedUrl(input: string): string | null {
  try {
    const url = new URL(input);
    let videoId: string | null = null;
    if (url.hostname === "youtu.be") {
      videoId = url.pathname.slice(1);
    } else if (url.hostname.includes("youtube.com")) {
      videoId = url.searchParams.get("v");
      if (!videoId) {
        const match = url.pathname.match(/\/embed\/([^/?]+)/);
        if (match) videoId = match[1];
      }
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

function NoteEditor({
  note,
  onClose,
}: {
  note: Note;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [saved, setSaved] = useState(false);

  async function save() {
    await updateNote.mutateAsync({ id: note.id, data: { title, content } });
    await queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function remove() {
    await deleteNote.mutateAsync({ id: note.id });
    await queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
    onClose();
  }

  return (
    <div className="flex flex-col gap-3 bg-card border border-card-border rounded-2xl p-5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-transparent text-foreground font-medium text-base border-none outline-none placeholder:text-muted-foreground"
        placeholder="Note title"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className="bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
        placeholder="Write your summary notes here..."
      />
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={remove}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
        <button
          onClick={save}
          disabled={updateNote.isPending}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

export function ResourcesPage() {
  const queryClient = useQueryClient();
  const { data: notes, isLoading } = useListNotes({
    query: { queryKey: getListNotesQueryKey() },
  });
  const createNote = useCreateNote();

  const [videoUrl, setVideoUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState("");
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiLabel, setAiLabel] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  function loadVideo() {
    const url = videoUrl.trim();
    if (!url) return;
    const embed = youtubeEmbedUrl(url);
    if (embed) {
      setEmbedUrl(embed);
      setUrlError(false);
      setTranscript(null);
      setTranscriptError("");
      setAiResult("");
    } else {
      setUrlError(true);
    }
  }

  async function fetchTranscript() {
    setTranscriptLoading(true);
    setTranscriptError("");
    setTranscript(null);
    setAiResult("");
    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTranscriptError(data.error ?? "Could not fetch transcript.");
      } else {
        setTranscript(data.transcript);
        setTranscriptExpanded(false);
      }
    } catch {
      setTranscriptError("Could not reach the server. Please try again.");
    } finally {
      setTranscriptLoading(false);
    }
  }

  async function runAI(mode: "summarize" | "explain") {
    if (!transcript) return;
    setAiLoading(true);
    setAiResult("");
    setAiError("");
    setAiLabel(mode === "summarize" ? "Summary" : "Explanation");
    try {
      const endpoint = mode === "summarize" ? "/api/ai/summarize" : "/api/ai/explain";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error ?? "Something went wrong.");
      } else {
        setAiResult(mode === "summarize" ? data.summary : data.explanation);
      }
    } catch {
      setAiError("Could not reach the server.");
    } finally {
      setAiLoading(false);
    }
  }

  async function addNote() {
    const note = await createNote.mutateAsync({
      data: { title: "New note", content: "" },
    });
    await queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
    setExpandedId(note.id);
  }

  return (
    <Layout>
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-4xl md:text-5xl font-serif text-foreground">
            Study Resources
          </h1>
        </div>
        <p className="text-muted-foreground">Watch, read, and take notes.</p>
      </header>

      <div className="flex flex-col gap-10">
        {/* YouTube section */}
        <section>
          <h2 className="text-lg font-serif text-foreground mb-4 flex items-center gap-2">
            <Youtube className="w-5 h-5 text-primary" />
            Video
          </h2>

          <div className="flex gap-2 mb-4">
            <input
              ref={inputRef}
              type="url"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                setUrlError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && loadVideo()}
              placeholder="Paste a YouTube URL..."
              className={`flex-1 px-4 py-2.5 rounded-xl bg-muted border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                urlError ? "border-destructive" : "border-border"
              }`}
            />
            <button
              onClick={loadVideo}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
            >
              Load
            </button>
          </div>

          {urlError && (
            <p className="text-destructive text-xs mb-3">
              That doesn't look like a valid YouTube URL. Try a link like
              youtube.com/watch?v=... or youtu.be/...
            </p>
          )}

          {embedUrl ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl overflow-hidden border border-card-border bg-card aspect-video w-full animate-in fade-in duration-300">
                <iframe
                  src={embedUrl}
                  title="Study video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* Transcript panel */}
              <div className="bg-card border border-card-border rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Transcript</span>
                    {transcript && (
                      <span className="text-xs text-muted-foreground">
                        ({Math.round(transcript.split(" ").length / 200)} min read)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={fetchTranscript}
                    disabled={transcriptLoading}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
                  >
                    {transcriptLoading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" />Fetching...</>
                    ) : (
                      transcript ? "Refresh" : "Get Transcript"
                    )}
                  </button>
                </div>

                {transcriptError && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{transcriptError}</p>
                )}

                {transcript && (
                  <>
                    {/* Transcript text toggle */}
                    <div>
                      <button
                        onClick={() => setTranscriptExpanded((v) => !v)}
                        className="text-xs text-primary hover:underline mb-2"
                      >
                        {transcriptExpanded ? "Hide transcript" : "Show transcript"}
                      </button>
                      {transcriptExpanded && (
                        <div className="max-h-48 overflow-y-auto bg-muted rounded-xl px-4 py-3 text-xs text-foreground leading-relaxed animate-in fade-in duration-200">
                          {transcript}
                        </div>
                      )}
                    </div>

                    {/* AI actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => runAI("summarize")}
                        disabled={aiLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
                      >
                        {aiLoading && aiLabel === "Summary" ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />Summarizing...</>
                        ) : (
                          <><Sparkles className="w-4 h-4" />Summarize</>
                        )}
                      </button>
                      <button
                        onClick={() => runAI("explain")}
                        disabled={aiLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted text-foreground text-sm font-medium border border-border hover:bg-muted/80 transition-all duration-200 disabled:opacity-50"
                      >
                        {aiLoading && aiLabel === "Explanation" ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />Explaining...</>
                        ) : (
                          <><Sparkles className="w-4 h-4 text-primary" />Explain</>
                        )}
                      </button>
                    </div>

                    {aiError && (
                      <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{aiError}</p>
                    )}

                    {aiResult && (
                      <div className="animate-in fade-in duration-300">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{aiLabel}</p>
                        <div className="bg-muted rounded-xl px-4 py-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {aiResult}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card aspect-video flex items-center justify-center text-muted-foreground text-sm">
              Paste a YouTube link above to load a video
            </div>
          )}
        </section>

        {/* Notes section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif text-foreground">Notes</h2>
            <button
              onClick={addNote}
              disabled={createNote.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              New note
            </button>
          </div>

          {isLoading ? (
            <div className="animate-pulse flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-muted rounded-2xl" />
              ))}
            </div>
          ) : notes && notes.length > 0 ? (
            <div className="flex flex-col gap-3 animate-in fade-in duration-300">
              {[...notes].reverse().map((note) =>
                expandedId === note.id ? (
                  <NoteEditor
                    key={note.id}
                    note={note}
                    onClose={() => setExpandedId(null)}
                  />
                ) : (
                  <button
                    key={note.id}
                    onClick={() => setExpandedId(note.id)}
                    className="text-left bg-card border border-card-border rounded-2xl px-5 py-4 hover:border-primary/40 transition-all duration-200 group"
                  >
                    <p className="font-medium text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                      {note.title}
                    </p>
                    <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
                      {note.content || "No content yet — click to edit."}
                    </p>
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-2xl">
              <BookOpen className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                No notes yet. Add one to start capturing your thoughts.
              </p>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
