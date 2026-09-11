import { Link, useParams } from "react-router-dom";

import { EstimateBadge, PriorityBadge, StateBadge, StatusBadge } from "@/components/common/Badges";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/hooks/useStore";
import { Building2, CalendarClock, GraduationCap, Wallet } from "lucide-react";
import { daysUntil, formatDate } from "@/utils/dates";
import { programState } from "@/utils/deadlines";
import { flagEmoji, money } from "@/utils/format";
import { estimatedTotalCost } from "@/utils/scoring";

export default function CountryDetail() {
  const { name } = useParams();
  const country = decodeURIComponent(name ?? "");
  const data = useAppData();

  const universities = data.universities.filter((u) => u.country === country);
  const programs = data.programs.filter((p) =>
    universities.some((u) => u.id === p.universityId),
  );

  if (universities.length === 0) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-display text-lg font-semibold">No data for {country}</p>
        <Button asChild className="mt-4">
          <Link to="/countries">Back to countries</Link>
        </Button>
      </div>
    );
  }

  const costs = programs.map(estimatedTotalCost).filter((n) => n > 0);
  const avg = costs.length ? Math.round(costs.reduce((a, b) => a + b, 0) / costs.length) : 0;
  const soon = programs.filter((p) => {
    const d = daysUntil(p.applicationDeadline);
    return d !== null && d >= 0 && d <= 30;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${flagEmoji(universities[0]!.countryCode)} ${country}`}
        subtitle="Universities and programmes you are tracking in this country"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Universities" value={universities.length} icon={Building2} />
        <StatCard label="Programmes" value={programs.length} icon={GraduationCap} />
        <StatCard
          label="Avg. total cost"
          value={avg ? money(avg) : "—"}
          icon={Wallet}
          hint="Fill in tuition and living costs to refine"
        />
        <StatCard
          label="Deadlines ≤ 30 days"
          value={soon}
          icon={CalendarClock}
          tone={soon > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-display mb-3 text-sm font-semibold tracking-wide uppercase">
            Universities
          </h2>
          <ul className="space-y-2">
            {universities.map((u) => (
              <li key={u.id}>
                <Link
                  to={`/universities/${u.id}`}
                  className="flex items-center justify-between rounded-lg border bg-surface px-3 py-2.5 text-sm transition-colors hover:bg-accent"
                >
                  <span>
                    {u.name}
                    <span className="ml-2 text-xs text-muted-foreground">{u.city}</span>
                  </span>
                  <span className="numeric text-xs text-muted-foreground">
                    {data.programs.filter((p) => p.universityId === u.id).length}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="font-display mb-3 text-sm font-semibold tracking-wide uppercase">
            Programmes
          </h2>
          <ul className="space-y-2">
            {programs.map((p) => (
              <li key={p.id}>
                <Link to={`/programmes/${p.id}`} className="block rounded-lg border bg-surface p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(p.applicationDeadline)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <PriorityBadge value={p.priority} />
                    <EstimateBadge value={p.admissionEstimate} />
                    <StateBadge value={programState(p)} />
                    <StatusBadge value={p.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
