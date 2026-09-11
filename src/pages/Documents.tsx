import { useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
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
import { DOCUMENT_STATUSES, type DocumentStatus, type TrackedDocument } from "@/types";
import { daysUntil, formatDate, toInputDate } from "@/utils/dates";
import { uid } from "@/utils/format";

const STATUS_STYLE: Record<DocumentStatus, string> = {
  Missing: "bg-danger-soft text-danger border-danger/30",
  Preparing: "bg-warning-soft text-warning border-warning/30",
  Ready: "bg-info-soft text-info border-info/30",
  Submitted: "bg-success-soft text-success border-success/30",
};

export default function Documents() {
  const data = useAppData();
  const [name, setName] = useState("");

  const add = () => {
    if (!name.trim()) return;
    const now = new Date().toISOString();
    StorageService.saveDocument({
      id: uid("doc"),
      name: name.trim(),
      status: "Missing",
      expiryDate: null,
      notes: "",
      link: "",
      createdAt: now,
      updatedAt: now,
    });
    setName("");
  };

  const save = (doc: TrackedDocument, patch: Partial<TrackedDocument>) =>
    StorageService.saveDocument({ ...doc, ...patch });

  const usedBy = (docId: string) =>
    data.programs.filter((p) => p.requiredDocumentIds.includes(docId));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Documents"
        subtitle="Track the reusable documents behind every application — CV, transcripts, references and more."
      />

      <div className="panel flex flex-wrap gap-2 p-4">
        <Input
          className="min-w-[240px] flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a document, e.g. Bachelor transcript…"
        />
        <Button onClick={add}>
          <Plus className="size-4" /> Add document
        </Button>
      </div>

      {data.documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Add the documents you reuse across applications to track their status."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.documents.map((doc) => {
            const expiry = daysUntil(doc.expiryDate);
            const programs = usedBy(doc.id);
            return (
              <section key={doc.id} className="panel space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-semibold">{doc.name}</p>
                    {doc.expiryDate ? (
                      <p
                        className={`text-xs ${
                          expiry !== null && expiry < 90 ? "text-warning" : "text-muted-foreground"
                        }`}
                      >
                        Valid until {formatDate(doc.expiryDate)}
                        {expiry !== null && expiry < 0 ? " · expired" : ""}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[doc.status]}`}
                  >
                    {doc.status}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block text-xs text-muted-foreground">Status</Label>
                    <Select
                      value={doc.status}
                      onValueChange={(v) => save(doc, { status: v as DocumentStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs text-muted-foreground">
                      Expiry / valid until
                    </Label>
                    <Input
                      type="date"
                      defaultValue={toInputDate(doc.expiryDate)}
                      onChange={(e) => save(doc, { expiryDate: e.target.value || null })}
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">
                    Link or file reference
                  </Label>
                  <Input
                    defaultValue={doc.link}
                    placeholder="https://drive.google.com/…"
                    onBlur={(e) => save(doc, { link: e.target.value })}
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">Notes</Label>
                  <Textarea
                    rows={2}
                    defaultValue={doc.notes}
                    onBlur={(e) => save(doc, { notes: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                  <span>
                    Required by {programs.length} programme{programs.length === 1 ? "" : "s"}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger"
                    onClick={() => StorageService.deleteDocument(doc.id)}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
