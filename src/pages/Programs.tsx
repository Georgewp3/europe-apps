import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Euro, FileText, Plus } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { EstimateBadge, PriorityBadge, StateBadge } from "@/components/common/Badges";
import { ProgramFormDialog } from "@/components/programs/ProgramFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAppData } from "@/hooks/useStore";
import { formatDate } from "@/utils/dates";
import { programState } from "@/utils/deadlines";
import { flagEmoji, money } from "@/utils/format";
import { checklistProgress } from "@/utils/scoring";

export default function Programs() {
  const data = useAppData();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const uniById = useMemo(
    () => new Map(data.universities.map((u) => [u.id, u])),
    [data.universities],
  );

  const programs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.programs;
    return data.programs.filter((p) =>
      `${p.name} ${p.field} ${uniById.get(p.universityId)?.name ?? ""}`.toLowerCase().includes(q),
    );
  }, [data.programs, query, uniById]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programmes"
        subtitle="Every saved MSc programme, with live application state."
        actions={
          <Button onClick={() => setAddOpen(true)} size="sm">
            <Plus className="size-4" /> Add Programme
          </Button>
        }
      />

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search programmes…"
        className="max-w-md"
      />

      {programs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No programmes yet."
          description="Add a programme to start tracking its deadlines and documents."
          action={<Button onClick={() => setAddOpen(true)}>Add Your First Programme</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {programs.map((p) => {
            const uni = uniById.get(p.universityId);
            return (
              <Link
                key={p.id}
                to={`/programmes/${p.id}`}
                className="panel flex flex-col gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-lift)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {flagEmoji(uni?.countryCode ?? "")} {uni?.name} · {uni?.city}
                    </p>
                  </div>
                  <StateBadge value={programState(p)} />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <PriorityBadge value={p.priority} />
                  <EstimateBadge value={p.admissionEstimate} />
                  <span className="inline-flex items-center rounded-md border bg-muted px-2 py-0.5 text-xs">
                    {p.field}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CalendarClock className="size-3.5" />
                    {formatDate(p.applicationDeadline, "No deadline")}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Euro className="size-3.5" />
                    {money(p.finance.annualTuition, p.finance.currency)}
                  </div>
                </dl>

                <div className="flex items-center gap-2">
                  <Progress value={checklistProgress(p)} className="h-1.5" />
                  <span className="numeric text-[11px] text-muted-foreground">
                    {checklistProgress(p)}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <ProgramFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        universities={data.universities}
      />
    </div>
  );
}
