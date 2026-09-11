import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Globe2 } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppData } from "@/hooks/useStore";
import { daysUntil } from "@/utils/dates";
import { flagEmoji, money } from "@/utils/format";
import { estimatedTotalCost } from "@/utils/scoring";

export default function Countries() {
  const data = useAppData();

  const countries = useMemo(() => {
    const map = new Map<
      string,
      { name: string; code: string; unis: number; programs: number; costs: number[]; soon: number }
    >();
    for (const u of data.universities) {
      const entry = map.get(u.country) ?? {
        name: u.country,
        code: u.countryCode,
        unis: 0,
        programs: 0,
        costs: [],
        soon: 0,
      };
      entry.unis += 1;
      for (const p of data.programs.filter((p) => p.universityId === u.id)) {
        entry.programs += 1;
        const cost = estimatedTotalCost(p);
        if (cost > 0) entry.costs.push(cost);
        const d = daysUntil(p.applicationDeadline);
        if (d !== null && d >= 0 && d <= 30) entry.soon += 1;
      }
      map.set(u.country, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.programs - a.programs || a.name.localeCompare(b.name));
  }, [data.universities, data.programs]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Countries"
        subtitle="Where your target programmes are, and how they compare at a glance"
      />

      {countries.length === 0 ? (
        <EmptyState
          icon={Globe2}
          title="No countries yet"
          description="Add a programme and its country will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {countries.map((c) => {
            const avg = c.costs.length
              ? Math.round(c.costs.reduce((a, b) => a + b, 0) / c.costs.length)
              : 0;
            return (
              <Link
                key={c.name}
                to={`/countries/${encodeURIComponent(c.name)}`}
                className="panel panel-hover p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{flagEmoji(c.code)}</span>
                  <div>
                    <p className="font-display font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.unis} universities · {c.programs} programmes
                    </p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Avg. total cost</dt>
                    <dd className="numeric mt-0.5 font-semibold">{avg ? money(avg) : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Deadlines ≤ 30 days</dt>
                    <dd className="numeric mt-0.5 font-semibold">{c.soon}</dd>
                  </div>
                </dl>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
