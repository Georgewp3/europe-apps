import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Search } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/hooks/useStore";
import { flagEmoji, initials, money } from "@/utils/format";
import { estimatedTotalCost } from "@/utils/scoring";

export default function Universities() {
  const data = useAppData();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [sort, setSort] = useState("name");

  const countries = useMemo(
    () => Array.from(new Set(data.universities.map((u) => u.country))).sort(),
    [data.universities],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = data.universities.filter((u) => {
      const matchQ =
        !q ||
        `${u.name} ${u.city} ${u.country} ${u.notes}`.toLowerCase().includes(q);
      const matchC = country === "all" || u.country === country;
      return matchQ && matchC;
    });
    list = [...list].sort((a, b) => {
      if (sort === "country") return a.country.localeCompare(b.country) || a.name.localeCompare(b.name);
      if (sort === "programmes") {
        const count = (id: string) => data.programs.filter((p) => p.universityId === id).length;
        return count(b.id) - count(a.id);
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [data.universities, data.programs, query, country, sort]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Universities"
        subtitle={`${data.universities.length} institutions across ${countries.length} countries`}
      />

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search universities…"
            className="pl-9"
          />
        </div>
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
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort: name</SelectItem>
            <SelectItem value="country">Sort: country</SelectItem>
            <SelectItem value="programmes">Sort: programmes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No universities match"
          description="Try a different search term or clear the country filter."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((u) => {
            const programs = data.programs.filter((p) => p.universityId === u.id);
            const cheapest = programs.length
              ? Math.min(...programs.map((p) => estimatedTotalCost(p)).filter((n) => n > 0))
              : 0;
            return (
              <Link
                key={u.id}
                to={`/universities/${u.id}`}
                className="panel panel-hover flex flex-col gap-3 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="font-display flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                    {initials(u.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display truncate font-semibold">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {flagEmoji(u.countryCode)} {u.city}, {u.country} · {u.institutionLabel}
                    </p>
                  </div>
                </div>

                {u.rankingNotes ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{u.rankingNotes}</p>
                ) : null}

                <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs">
                  <span className="numeric font-medium">
                    {programs.length} programme{programs.length === 1 ? "" : "s"}
                  </span>
                  <span className="text-muted-foreground">
                    {Number.isFinite(cheapest) && cheapest > 0
                      ? `from ${money(cheapest)} total`
                      : "Costs not filled in"}
                  </span>
                </div>

                {u.website ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-primary">
                    <ExternalLink className="size-3" /> {u.website.replace(/^https?:\/\//, "")}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
