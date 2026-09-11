import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarClock,
  Euro,
  FileText,
  GraduationCap,
  ListChecks,
  Sparkles,
  Trophy,
} from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { PriorityBadge, StatusBadge } from "@/components/common/Badges";
import { ProgramFormDialog } from "@/components/programs/ProgramFormDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppData } from "@/hooks/useStore";
import { cn } from "@/lib/utils";
import type { Program } from "@/types";
import { daysUntil, formatDate } from "@/utils/dates";
import { URGENCY_LABEL, urgencyBucket, type UrgencyBucket } from "@/utils/deadlines";
import { flagEmoji, money } from "@/utils/format";
import { checklistProgress, tuitionInEur } from "@/utils/scoring";

const SUBMITTED_OR_LATER = [
  "Submitted",
  "Under Review",
  "Interview",
  "Offer",
  "Accepted",
  "Waitlisted",
  "Rejected",
];

const PIPELINE = ["Researching", "Preparing", "Submitted", "Offer", "Accepted"] as const;

export default function Dashboard() {
  const data = useAppData();
  const [addOpen, setAddOpen] = useState(false);
  const uniById = useMemo(
    () => new Map(data.universities.map((u) => [u.id, u])),
    [data.universities],
  );

  const programs = data.programs;
  const submitted = programs.filter((p) => SUBMITTED_OR_LATER.includes(p.status)).length;
  const offers = programs.filter((p) => ["Offer", "Accepted"].includes(p.status)).length;
  const upcoming = programs.filter((p) => {
    const d = daysUntil(p.applicationDeadline);
    return d !== null && d >= 0 && d <= 30;
  }).length;
  const plannedTuition = programs
    .filter((p) => ["Shortlisted", "Preparing", "Ready to Apply", "Submitted"].includes(p.status))
    .reduce((sum, p) => sum + tuitionInEur(p), 0);

  const deadlineGroups = useMemo(() => {
    const groups: Record<UrgencyBucket, Program[]> = {
      critical: [],
      urgent: [],
      soon: [],
      later: [],
      passed: [],
    };
    for (const p of programs) {
      if (!p.applicationDeadline) continue;
      groups[urgencyBucket(daysUntil(p.applicationDeadline))].push(p);
    }
    for (const key of Object.keys(groups) as UrgencyBucket[]) {
      groups[key].sort((a, b) =>
        (a.applicationDeadline ?? "").localeCompare(b.applicationDeadline ?? ""),
      );
    }
    return groups;
  }, [programs]);

  const nextActions = useMemo(() => buildNextActions(programs), [programs]);

  if (programs.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AI Masters Application Tracker"
          subtitle="Track universities, programmes, applications and deadlines across Europe."
        />
        <EmptyState
          icon={GraduationCap}
          title="No applications yet."
          description="Add your first programme, or restore the seeded European AI master's list from Settings."
          action={<Button onClick={() => setAddOpen(true)}>Add Your First Programme</Button>}
        />
        <ProgramFormDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          universities={data.universities}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Masters Application Tracker"
        subtitle="Track universities, programmes, applications and deadlines across Europe."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Universities" value={data.universities.length} icon={GraduationCap} />
        <StatCard label="Programmes" value={programs.length} icon={FileText} />
        <StatCard
          label="Submitted"
          value={submitted}
          icon={ListChecks}
          tone={submitted > 0 ? "success" : "default"}
        />
        <StatCard label="Offers" value={offers} icon={Trophy} tone="success" />
        <StatCard
          label="Deadlines ≤ 30d"
          value={upcoming}
          icon={CalendarClock}
          tone={upcoming > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Est. tuition"
          value={money(plannedTuition)}
          hint="Planned & submitted"
          icon={Euro}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Upcoming deadlines</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/deadlines">
                All deadlines <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-5">
            {(["critical", "urgent", "soon", "later"] as UrgencyBucket[]).map((bucket) => {
              const items = deadlineGroups[bucket];
              if (items.length === 0) return null;
              return (
                <div key={bucket}>
                  <p className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    <span className={cn("size-2 rounded-full", BUCKET_DOT[bucket])} />
                    {URGENCY_LABEL[bucket]}
                    <span className="numeric text-muted-foreground">({items.length})</span>
                  </p>
                  <ul className="space-y-2">
                    {items.slice(0, bucket === "later" ? 4 : 8).map((p) => {
                      const uni = uniById.get(p.universityId);
                      const days = daysUntil(p.applicationDeadline);
                      return (
                        <li
                          key={p.id}
                          className="flex flex-wrap items-center gap-3 rounded-lg border bg-surface px-3 py-2.5"
                        >
                          <span className="text-lg">{flagEmoji(uni?.countryCode ?? "")}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{p.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {uni?.name} · {formatDate(p.applicationDeadline)}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "numeric text-xs font-semibold",
                              bucket === "critical" ? "text-danger" : "text-muted-foreground",
                            )}
                          >
                            {days} days left
                          </span>
                          <StatusBadge value={p.status} />
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/programmes/${p.id}`}>View</Link>
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

            {deadlineGroups.passed.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Closed
                </p>
                <ul className="space-y-1.5">
                  {deadlineGroups.passed.slice(0, 5).map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-sm"
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="ml-auto text-xs font-medium text-danger/70">Closed</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="font-display mb-1 flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="size-4 text-primary" /> What should I do next?
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Generated from your dates, priorities and checklist progress.
          </p>
          {nextActions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing urgent. Add deadlines to your programmes to get suggestions.
            </p>
          ) : (
            <ol className="space-y-2.5">
              {nextActions.slice(0, 8).map((a) => (
                <li key={a.id} className="rounded-lg border bg-surface p-3">
                  <Link to={`/programmes/${a.programId}`} className="text-sm font-medium hover:underline">
                    {a.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-display mb-4 text-lg font-semibold">Application pipeline</h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PIPELINE.map((stage) => {
            const count = programs.filter((p) => p.status === stage).length;
            return (
              <div key={stage} className="rounded-xl border bg-surface p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {stage}
                </p>
                <p className="numeric mt-1 text-2xl font-semibold">{count}</p>
                <Progress
                  className="mt-3 h-1.5"
                  value={programs.length ? (count / programs.length) * 100 : 0}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Priority programmes</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/applications">
              Open applications <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {programs
            .filter((p) => p.priority === "Must Apply")
            .slice(0, 6)
            .map((p) => {
              const uni = uniById.get(p.universityId);
              return (
                <li key={p.id} className="rounded-xl border bg-surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to={`/programmes/${p.id}`}
                        className="font-display truncate text-sm font-semibold hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {flagEmoji(uni?.countryCode ?? "")} {uni?.name}
                      </p>
                    </div>
                    <PriorityBadge value={p.priority} />
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={checklistProgress(p)} className="h-1.5" />
                    <span className="numeric text-xs text-muted-foreground">
                      {checklistProgress(p)}%
                    </span>
                  </div>
                </li>
              );
            })}
        </ul>
      </section>
    </div>
  );
}

const BUCKET_DOT: Record<UrgencyBucket, string> = {
  critical: "bg-danger",
  urgent: "bg-warning",
  soon: "bg-chart-4",
  later: "bg-success",
  passed: "bg-muted",
};

type NextAction = { id: string; programId: string; title: string; detail: string; rank: number };

const PRIORITY_RANK: Record<string, number> = {
  "Must Apply": 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Backup: 4,
};

function buildNextActions(programs: Program[]): NextAction[] {
  const actions: NextAction[] = [];

  for (const p of programs) {
    const toDeadline = daysUntil(p.applicationDeadline);
    const toOpen = daysUntil(p.applicationOpenDate);
    const progress = checklistProgress(p);
    const priorityRank = PRIORITY_RANK[p.priority] ?? 5;
    const done = ["Submitted", "Under Review", "Interview", "Offer", "Accepted", "Rejected", "Withdrawn"];

    if (toDeadline !== null && toDeadline >= 0 && toDeadline <= 14 && !done.includes(p.status)) {
      actions.push({
        id: `${p.id}-apply`,
        programId: p.id,
        title: `Apply to ${p.name}`,
        detail: `Deadline in ${toDeadline} day${toDeadline === 1 ? "" : "s"} · checklist ${progress}% complete`,
        rank: priorityRank * 1000 + toDeadline,
      });
      continue;
    }

    if (toDeadline !== null && toDeadline > 14 && toDeadline <= 60 && !done.includes(p.status)) {
      actions.push({
        id: `${p.id}-prepare`,
        programId: p.id,
        title: `Prepare ${p.name}`,
        detail: `Deadline in ${toDeadline} days · checklist ${progress}% complete`,
        rank: priorityRank * 1000 + toDeadline,
      });
      continue;
    }

    if (toOpen !== null && toOpen > 0 && toOpen <= 60) {
      actions.push({
        id: `${p.id}-opens`,
        programId: p.id,
        title: `${p.name} applications open in ${toOpen} days`,
        detail: `Opens ${formatDate(p.applicationOpenDate)}`,
        rank: priorityRank * 1000 + 100 + toOpen,
      });
    }
  }

  return actions.sort((a, b) => a.rank - b.rank);
}
