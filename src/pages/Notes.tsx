import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pin, PinOff, Plus, Search, StickyNote, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/hooks/useStore";
import { StorageService } from "@/services/storage";
import { NOTE_TAGS, type Note } from "@/types";
import { formatDate } from "@/utils/dates";
import { uid } from "@/utils/format";

export default function Notes() {
  const data = useAppData();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("all");
  const [editing, setEditing] = useState<Note | null>(null);

  const notes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.notes
      .filter((n) => {
        const matchQ = !q || `${n.title} ${n.body} ${n.tags.join(" ")}`.toLowerCase().includes(q);
        const matchT = tag === "all" || n.tags.includes(tag);
        return matchQ && matchT;
      })
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt),
      );
  }, [data.notes, query, tag]);

  const blank = (): Note => {
    const now = new Date().toISOString();
    return {
      id: uid("note"),
      title: "",
      body: "",
      tags: [],
      pinned: false,
      scope: "global",
      refId: null,
      createdAt: now,
      updatedAt: now,
    };
  };

  const refLabel = (note: Note) => {
    if (note.scope === "university") {
      const u = data.universities.find((x) => x.id === note.refId);
      return u ? { label: u.name, to: `/universities/${u.id}` } : null;
    }
    if (note.scope === "program") {
      const p = data.programs.find((x) => x.id === note.refId);
      return p ? { label: p.name, to: `/programmes/${p.id}` } : null;
    }
    return null;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notes"
        subtitle="Research notes, reminders and thoughts — pinned notes stay on top."
        actions={
          <Button onClick={() => setEditing(blank())}>
            <Plus className="size-4" /> New note
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
          />
        </div>
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {NOTE_TAGS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Capture research findings, contacts or reminders as you go."
          action={<Button onClick={() => setEditing(blank())}>Write your first note</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => {
            const ref = refLabel(note);
            return (
              <article key={note.id} className="panel flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <button
                    className="text-left"
                    onClick={() => setEditing(note)}
                    aria-label={`Edit ${note.title}`}
                  >
                    <p className="font-display font-semibold">{note.title || "Untitled note"}</p>
                  </button>
                  <button
                    onClick={() => StorageService.saveNote({ ...note, pinned: !note.pinned })}
                    className={note.pinned ? "text-primary" : "text-muted-foreground"}
                    aria-label={note.pinned ? "Unpin note" : "Pin note"}
                  >
                    {note.pinned ? <Pin className="size-4" /> : <PinOff className="size-4" />}
                  </button>
                </div>
                <p className="line-clamp-5 text-sm whitespace-pre-wrap text-muted-foreground">
                  {note.body}
                </p>
                {ref ? (
                  <Link to={ref.to} className="text-xs text-primary hover:underline">
                    {ref.label}
                  </Link>
                ) : null}
                <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t pt-3">
                  {note.tags.map((t) => (
                    <span key={t} className="rounded-md border bg-surface px-2 py-0.5 text-xs">
                      {t}
                    </span>
                  ))}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDate(note.updatedAt)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-danger"
                    onClick={() => StorageService.deleteNote(note.id)}
                    aria-label="Delete note"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <NoteDialog note={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function NoteDialog({ note, onClose }: { note: Note | null; onClose: () => void }) {
  const data = useAppData();
  const [draft, setDraft] = useState<Note | null>(note);

  if (note && draft?.id !== note.id) setDraft(note);
  if (!note || !draft) return null;

  const toggleTag = (tag: string) =>
    setDraft({
      ...draft,
      tags: draft.tags.includes(tag)
        ? draft.tags.filter((t) => t !== tag)
        : [...draft.tags, tag],
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{note.title ? "Edit note" : "New note"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Title</Label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Note title"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Note</Label>
            <Textarea
              rows={6}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">Linked to</Label>
              <Select
                value={draft.scope}
                onValueChange={(v) =>
                  setDraft({ ...draft, scope: v as Note["scope"], refId: null })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Nothing in particular</SelectItem>
                  <SelectItem value="university">A university</SelectItem>
                  <SelectItem value="program">A programme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {draft.scope !== "global" ? (
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Which one</Label>
                <Select
                  value={draft.refId ?? ""}
                  onValueChange={(v) => setDraft({ ...draft, refId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(draft.scope === "university" ? data.universities : data.programs).map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        {x.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                    draft.tags.includes(t)
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "bg-surface text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              StorageService.saveNote(draft);
              onClose();
            }}
          >
            Save note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
