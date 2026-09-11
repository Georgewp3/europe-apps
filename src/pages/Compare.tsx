import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Columns3, X } from "lucide-react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
} from "recharts";

import { EstimateBadge, PriorityBadge, StatusBadge } from "@/components/common/Badges";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/hooks/useStore";
import { formatDate } from "@/utils/dates";
import { flagEmoji, money } from "@/utils/format";
import {
  SCORE_FIELDS,
  checklistProgress,
  estimatedAnnualCost,
  estimatedTotalCost,
  overallScore,
} from "@/utils/scoring";

const MAX = 5;
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function Compare() {
  const data = useAppData();
  const [selected, setSelected] = useState<string[]>(() =>
    data.programs.slice(0, 3).map((p) => p.id),
  );

  const uniById = useMemo(
    () => new Map(data.universities.map((u) => [u.id, u])),
    [data.universities],
  );
  const chosen = selected
    .map((id) => data.programs.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const radarData = SCORE_FIELDS.map((f) => {
    const row: Record<string, string | number> = { criterion: f.label };
    chosen.forEach((p) => {
      row[p.name] = p.scores[f.key];
    });
    return row;
  });

  const best = (values: (number | null)[], mode: "high" | "low") => {
    const valid = values.filter((v): v is number => v !== null && v > 0);
    if (valid.length === 0) return null;
    return mode === "high" ? Math.max(...valid) : Math.min(...valid);
  };

  const rows: {
    label: string;
    values: (string | number)[];
    numeric?: (number | null)[];
    mode?: "high" | "low";
  }[] = [
    {
      label: "University",
      values: chosen.map((p) => uniById.get(p.universityId)?.name ?? "—"),
    },
    {
      label: "Country",
      values: chosen.map((p) => {
        const u = uniById.get(p.universityId);
        return u ? `${flagEmoji(u.countryCode)} ${u.country}` : "—";
      }),
    },
    { label: "Field", values: chosen.map((p) => p.field) },
    { label: "Language", values: chosen.map((p) => p.language) },
    { label: "Duration", values: chosen.map((p) => `${p.durationMonths} months`) },
    { label: "ECTS", values: chosen.map((p) => p.ects) },
    { label: "Deadline", values: chosen.map((p) => formatDate(p.applicationDeadline)) },
    { label: "Start", values: chosen.map((p) => p.startLabel || formatDate(p.startDate)) },
    { label: "Priority", values: chosen.map((p) => p.priority) },
    { label: "Admission estimate", values: chosen.map((p) => p.admissionEstimate) },
    { label: "Status", values: chosen.map((p) => p.status) },
    {
      label: "Annual tuition",
      values: chosen.map((p) => money(p.finance.annualTuition, p.finance.currency)),
      numeric: chosen.map((p) => p.finance.annualTuition),
      mode: "low",
    },
    {
      label: "Est. annual cost",
      values: chosen.map((p) => money(estimatedAnnualCost(p))),
      numeric: chosen.map((p) => estimatedAnnualCost(p)),
      mode: "low",
    },
    {
      label: "Est. total cost",
      values: chosen.map((p) => money(estimatedTotalCost(p))),
      numeric: chosen.map((p) => estimatedTotalCost(p)),
      mode: "low",
    },
    {
      label: "Checklist progress",
      values: chosen.map((p) => `${checklistProgress(p)}%`),
      numeric: chosen.map((p) => checklistProgress(p)),
      mode: "high",
    },
    {
      label: "Overall score",
      values: chosen.map((p) => overallScore(p.scores)?.toFixed(1) ?? "—"),
      numeric: chosen.map((p) => overallScore(p.scores)),
      mode: "high",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Compare programmes"
        subtitle={`Pick up to ${MAX} programmes side by side. Best value in each row is highlighted.`}
      />

      <div className="panel flex flex-wrap items-center gap-2 p-4">
        <Select
          value=""
          onValueChange={(v) =>
            setSelected((prev) => (prev.includes(v) || prev.length >= MAX ? prev : [...prev, v]))
          }
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Add a programme to compare…" />
          </SelectTrigger>
          <SelectContent>
            {data.programs
              .filter((p) => !selected.includes(p.id))
              .map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {uniById.get(p.universityId)?.name} — {p.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {chosen.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1.5 rounded-md border bg-surface px-2.5 py-1 text-xs"
          >
            {p.name}
            <button
              onClick={() => setSelected((prev) => prev.filter((id) => id !== p.id))}
              className="text-muted-foreground hover:text-danger"
              aria-label={`Remove ${p.name}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {chosen.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
            Clear all
          </Button>
        ) : null}
      </div>

      {chosen.length === 0 ? (
        <EmptyState
          icon={Columns3}
          title="Nothing selected yet"
          description="Choose two or more programmes above to see them side by side."
        />
      ) : (
        <>
          <div className="panel scrollbar-slim overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-surface">
                  <th className="sticky left-0 z-10 bg-surface p-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Criterion
                  </th>
                  {chosen.map((p) => (
                    <th key={p.id} className="min-w-[200px] p-3 text-left align-top">
                      <Link to={`/programmes/${p.id}`} className="font-display font-semibold hover:underline">
                        {p.name}
                      </Link>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <PriorityBadge value={p.priority} />
                        <EstimateBadge value={p.admissionEstimate} />
                        <StatusBadge value={p.status} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const winner = row.numeric && row.mode ? best(row.numeric, row.mode) : null;
                  return (
                    <tr key={row.label} className="border-b last:border-0">
                      <th className="sticky left-0 z-10 bg-card p-3 text-left text-xs font-medium text-muted-foreground">
                        {row.label}
                      </th>
                      {row.values.map((value, i) => {
                        const isBest =
                          winner !== null && row.numeric?.[i] === winner && (row.numeric[i] ?? 0) > 0;
                        return (
                          <td
                            key={i}
                            className={`p-3 align-top ${
                              isBest ? "bg-success-soft font-semibold text-success" : ""
                            }`}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <section className="panel p-5">
            <h2 className="font-display mb-3 text-sm font-semibold tracking-wide uppercase">
              Score comparison
            </h2>
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                  {chosen.map((p, i) => (
                    <Radar
                      key={p.id}
                      name={p.name}
                      dataKey={p.name}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      fillOpacity={0.15}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <RTooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Ratings come from the “Personal score” tab of each programme.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
