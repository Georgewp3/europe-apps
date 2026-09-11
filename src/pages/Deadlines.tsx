import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, CalendarDays, Download, List } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppData } from "@/hooks/useStore";
import { exportCsv, exportIcs, deadlinesToRows } from "@/services/export";
import type { DeadlineEntry } from "@/types";
import { daysUntil, formatDate, relativeDays } from "@/utils/dates";
import {
  DEADLINE_TYPE_COLOR,
  URGENCY_LABEL,
  collectDeadlines,
  urgencyBucket,
  type UrgencyBucket,
} from "@/utils/deadlines";
import { flagEmoji } from "@/utils/format";

const BUCKET_ORDER: UrgencyBucket[] = ["critical", "urgent", "soon", "later", "passed"];

export default function Deadlines() {
  const data = useAppData();
  const [type, setType] = useState("all");
  const [country, setCountry] = useState("all");
  const [range, setRange] = useState("upcoming");

  const all = useMemo(
    () => collectDeadlines(data.programs, data.universities),
    [data.programs, data.universities],
  );

  const filtered = useMemo(
    () =>
      all.filter((d) => {
        if (type !== "all" && d.type !== type) return false;
        if (country !== "all" && d.country !== country) return false;
        const days = daysUntil(d.date);
        if (range === "upcoming") return days !== null && days >= 0;
        if (range === "passed") return days !== null && days < 0;
        if (range === "30") return days !== null && days >= 0 && days <= 30;
        if (range === "90") return days !== null && days >= 0 && days <= 90;
        return true;
      }),
    [all, type, country, range],
  );

  const grouped = useMemo(() => {
    const map = new Map<UrgencyBucket, DeadlineEntry[]>();
    for (const d of filtered) {
      const bucket = urgencyBucket(daysUntil(d.date));
      map.set(bucket, [...(map.get(bucket) ?? []), d]);
    }
    return map;
  }, [filtered]);

  const byMonth = useMemo(() => {
    const map = new Map<string, DeadlineEntry[]>();
    for (const d of filtered) {
      const key = d.date.slice(0, 7);
      map.set(key, [...(map.get(key) ?? []), d]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const types = Array.from(new Set(all.map((d) => d.type)));
  const countries = Array.from(new Set(all.map((d) => d.country))).sort();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Deadlines"
        subtitle={`${filtered.length} dates in view — recalculated from today every time you open the app`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCsv(deadlinesToRows(filtered), "deadlines.csv")}
            >
              <Download className="size-4" /> CSV
            </Button>
            <Button size="sm" onClick={() => exportIcs(filtered, "ai-masters-deadlines.ics")}>
              <CalendarDays className="size-4" /> Export calendar
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="30">Next 30 days</SelectItem>
            <SelectItem value="90">Next 90 days</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
            <SelectItem value="all">All dates</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No deadlines in this view"
          description="Add application dates to your programmes, or widen the filters."
        />
      ) : (
        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list">
              <List className="size-4" /> Grouped list
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarDays className="size-4" /> By month
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4 space-y-6">
            {BUCKET_ORDER.filter((b) => grouped.get(b)?.length).map((bucket) => (
              <section key={bucket}>
                <h2 className="font-display mb-2 text-sm font-semibold tracking-wide uppercase">
                  {URGENCY_LABEL[bucket]}
                  <span className="numeric ml-2 text-muted-foreground">
                    {grouped.get(bucket)!.length}
                  </span>
                </h2>
                <ul className="space-y-2">
                  {grouped.get(bucket)!.map((d) => (
                    <DeadlineRow key={d.id} entry={d} />
                  ))}
                </ul>
              </section>
            ))}
          </TabsContent>

          <TabsContent value="calendar" className="mt-4 space-y-6">
            {byMonth.map(([month, entries]) => (
              <section key={month}>
                <h2 className="font-display mb-2 text-sm font-semibold tracking-wide uppercase">
                  {new Date(`${month}-01`).toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <ul className="space-y-2">
                  {entries.map((d) => (
                    <DeadlineRow key={d.id} entry={d} />
                  ))}
                </ul>
              </section>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function DeadlineRow({ entry }: { entry: DeadlineEntry }) {
  const days = daysUntil(entry.date);
  return (
    <li className="panel flex flex-wrap items-center gap-3 p-3.5">
      <div className="w-24 shrink-0">
        <p className="numeric text-sm font-semibold">{formatDate(entry.date)}</p>
        <p className="text-xs text-muted-foreground">{relativeDays(days)}</p>
      </div>
      <span
        className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
          DEADLINE_TYPE_COLOR[entry.type] ?? "bg-neutralsoft text-muted-foreground border-border"
        }`}
      >
        {entry.type}
      </span>
      <div className="min-w-0 flex-1">
        <Link to={`/programmes/${entry.programId}`} className="text-sm font-medium hover:underline">
          {entry.programName}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {flagEmoji(entry.countryCode)} {entry.universityName}
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => exportIcs([entry], `${entry.programName.replace(/\s+/g, "-")}.ics`)}
      >
        <CalendarDays className="size-3.5" /> Add to calendar
      </Button>
    </li>
  );
}
