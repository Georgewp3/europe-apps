import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpDown,
  Copy,
  ExternalLink,
  ListChecks,
  Pencil,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { EstimateBadge, PriorityBadge, StateBadge, StatusBadge } from "@/components/common/Badges";
import { ProgramFormDialog } from "@/components/programs/ProgramFormDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData } from "@/hooks/useStore";
import { cn } from "@/lib/utils";
import { StorageService } from "@/services/storage";
import {
  ADMISSION_ESTIMATES,
  APPLICATION_STATUSES,
  FIELDS,
  PRIORITIES,
  type Program,
} from "@/types";
import { daysUntil, formatDateShort } from "@/utils/dates";
import { programState } from "@/utils/deadlines";
import { flagEmoji, money, uid } from "@/utils/format";
import { checklistProgress, tuitionInEur } from "@/utils/scoring";

type SortKey =
  | "university"
  | "programme"
  | "country"
  | "priority"
  | "deadline"
  | "tuition"
  | "status"
  | "updated";

const ALL = "__all__";

const COLUMNS = [
  { key: "country", label: "Country" },
  { key: "university", label: "University" },
  { key: "programme", label: "Programme" },
  { key: "priority", label: "Priority" },
  { key: "fit", label: "Fit" },
  { key: "status", label: "Status" },
  { key: "opens", label: "Opens" },
  { key: "deadline", label: "Deadline" },
  { key: "start", label: "Start" },
  { key: "tuition", label: "Tuition" },
  { key: "days", label: "Days left" },
  { key: "docs", label: "Documents" },
  { key: "updated", label: "Updated" },
] as const;

export default function Applications() {
  const data = useAppData();
  const uniById = useMemo(
    () => new Map(data.universities.map((u) => [u.id, u])),
    [data.universities],
  );

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState(ALL);
  const [field, setField] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [estimate, setEstimate] = useState(ALL);
  const [startYear, setStartYear] = useState(ALL);
  const [institution, setInstitution] = useState(ALL);
  const [openState, setOpenState] = useState(ALL);
  const [within, setWithin] = useState(ALL);
  const [groupByCountry, setGroupByCountry] = useState(false);
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "deadline",
    dir: "asc",
  });
  const [page, setPage] = useState(0);
  const [hidden, setHidden] = useState<string[]>([]);
  const [editing, setEditing] = useState<Program | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const pageSize = 20;

  const countries = useMemo(
    () => Array.from(new Set(data.universities.map((u) => u.country))).sort(),
    [data.universities],
  );
  const startYears = useMemo(
    () =>
      Array.from(
        new Set(data.programs.map((p) => p.startDate?.slice(0, 4)).filter(Boolean) as string[]),
      ).sort(),
    [data.programs],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = data.programs.filter((p) => {
      const uni = uniById.get(p.universityId);
      if (q && !`${p.name} ${p.specialisation} ${uni?.name} ${uni?.country}`.toLowerCase().includes(q))
        return false;
      if (country !== ALL && uni?.country !== country) return false;
      if (field !== ALL && p.field !== field) return false;
      if (status !== ALL && p.status !== status) return false;
      if (priority !== ALL && p.priority !== priority) return false;
      if (estimate !== ALL && p.admissionEstimate !== estimate) return false;
      if (startYear !== ALL && p.startDate?.slice(0, 4) !== startYear) return false;
      if (institution !== ALL && uni?.institutionType !== institution) return false;
      if (openState !== ALL && programState(p) !== openState) return false;
      if (within !== ALL) {
        const d = daysUntil(p.applicationDeadline);
        if (d === null || d < 0 || d > Number(within)) return false;
      }
      return true;
    });

    const dir = sort.dir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      const ua = uniById.get(a.universityId);
      const ub = uniById.get(b.universityId);
      switch (sort.key) {
        case "university":
          return (ua?.name ?? "").localeCompare(ub?.name ?? "") * dir;
        case "country":
          return (ua?.country ?? "").localeCompare(ub?.country ?? "") * dir;
        case "programme":
          return a.name.localeCompare(b.name) * dir;
        case "priority":
          return (PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority)) * dir;
        case "status":
          return (
            (APPLICATION_STATUSES.indexOf(a.status) - APPLICATION_STATUSES.indexOf(b.status)) * dir
          );
        case "tuition":
          return (tuitionInEur(a) - tuitionInEur(b)) * dir;
        case "updated":
          return a.updatedAt.localeCompare(b.updatedAt) * dir;
        case "deadline":
        default: {
          const da = a.applicationDeadline ?? "9999";
          const db = b.applicationDeadline ?? "9999";
          return da.localeCompare(db) * dir;
        }
      }
    });
    return list;
  }, [
    data.programs,
    uniById,
    search,
    country,
    field,
    status,
    priority,
    estimate,
    startYear,
    institution,
    openState,
    within,
    sort,
  ]);

  const paged = groupByCountry ? rows : rows.slice(page * pageSize, page * pageSize + pageSize);
  const pageCount = Math.ceil(rows.length / pageSize);

  const groups = useMemo(() => {
    if (!groupByCountry) return null;
    const map = new Map<string, Program[]>();
    for (const p of rows) {
      const key = uniById.get(p.universityId)?.country ?? "Unknown";
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [groupByCountry, rows, uniById]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  const duplicate = (p: Program) => {
    const now = new Date().toISOString();
    StorageService.saveProgram({
      ...p,
      id: uid("prog"),
      name: `${p.name} (copy)`,
      createdAt: now,
      updatedAt: now,
    });
    toast.success("Programme duplicated");
  };

  const remove = (p: Program) => {
    StorageService.deleteProgram(p.id);
    toast.success("Programme deleted");
  };

  const visible = (key: string) => !hidden.includes(key);
  const cellPad = density === "compact" ? "px-3 py-1.5" : "px-3 py-3";

  const renderRow = (p: Program) => {
    const uni = uniById.get(p.universityId);
    const days = daysUntil(p.applicationDeadline);
    const progress = checklistProgress(p);
    return (
      <tr key={p.id} className="border-b transition-colors last:border-0 hover:bg-accent/40">
        {visible("country") ? (
          <td className={cn(cellPad, "whitespace-nowrap")}>
            <span className="mr-1.5">{flagEmoji(uni?.countryCode ?? "")}</span>
            <span className="text-xs text-muted-foreground">{uni?.country}</span>
          </td>
        ) : null}
        {visible("university") ? (
          <td className={cn(cellPad, "max-w-52")}>
            <Link
              to={`/universities/${p.universityId}`}
              className="truncate text-sm hover:underline"
            >
              {uni?.name}
            </Link>
          </td>
        ) : null}
        {visible("programme") ? (
          <td className={cn(cellPad, "max-w-72")}>
            <Link to={`/programmes/${p.id}`} className="text-sm font-medium hover:underline">
              {p.name}
            </Link>
            {p.specialisation ? (
              <p className="truncate text-xs text-muted-foreground">{p.specialisation}</p>
            ) : null}
          </td>
        ) : null}
        {visible("priority") ? (
          <td className={cellPad}>
            <PriorityBadge value={p.priority} />
          </td>
        ) : null}
        {visible("fit") ? (
          <td className={cellPad}>
            <EstimateBadge value={p.admissionEstimate} />
          </td>
        ) : null}
        {visible("status") ? (
          <td className={cellPad}>
            <Select
              value={p.status}
              onValueChange={(v) =>
                StorageService.saveProgram({ ...p, status: v as Program["status"] })
              }
            >
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </td>
        ) : null}
        {visible("opens") ? (
          <td className={cn(cellPad, "numeric text-xs whitespace-nowrap")}>
            {formatDateShort(p.applicationOpenDate)}
          </td>
        ) : null}
        {visible("deadline") ? (
          <td className={cn(cellPad, "numeric text-xs whitespace-nowrap")}>
            {formatDateShort(p.applicationDeadline)}
          </td>
        ) : null}
        {visible("start") ? (
          <td className={cn(cellPad, "text-xs whitespace-nowrap")}>
            {p.startLabel || formatDateShort(p.startDate)}
          </td>
        ) : null}
        {visible("tuition") ? (
          <td className={cn(cellPad, "numeric text-xs whitespace-nowrap")}>
            {money(p.finance.annualTuition, p.finance.currency)}
          </td>
        ) : null}
        {visible("days") ? (
          <td className={cellPad}>
            {days === null ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : days < 0 ? (
              <span className="text-xs font-medium text-danger/70">Closed</span>
            ) : (
              <span
                className={cn(
                  "numeric text-xs font-semibold",
                  days <= 7 ? "text-danger" : days <= 30 ? "text-warning" : "text-muted-foreground",
                )}
              >
                {days}d
              </span>
            )}
          </td>
        ) : null}
        {visible("docs") ? (
          <td className={cn(cellPad, "w-32")}>
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-1.5" />
              <span className="numeric text-[11px] text-muted-foreground">{progress}%</span>
            </div>
          </td>
        ) : null}
        {visible("updated") ? (
          <td className={cn(cellPad, "numeric text-xs whitespace-nowrap text-muted-foreground")}>
            {formatDateShort(p.updatedAt)}
          </td>
        ) : null}
        <td className={cn(cellPad, "whitespace-nowrap")}>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              onClick={() => {
                setEditing(p);
                setEditOpen(true);
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="size-7" onClick={() => duplicate(p)}>
              <Copy className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-danger"
              onClick={() => remove(p)}
            >
              <Trash2 className="size-3.5" />
            </Button>
            {p.programUrl ? (
              <a
                href={p.programUrl}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>
        </td>
      </tr>
    );
  };

  const header = (
    <thead className="sticky top-0 z-10 bg-surface-strong">
      <tr className="border-b text-left">
        {visible("country") ? <Th onClick={() => toggleSort("country")}>Country</Th> : null}
        {visible("university") ? <Th onClick={() => toggleSort("university")}>University</Th> : null}
        {visible("programme") ? <Th onClick={() => toggleSort("programme")}>Programme</Th> : null}
        {visible("priority") ? <Th onClick={() => toggleSort("priority")}>Priority</Th> : null}
        {visible("fit") ? <Th>Fit</Th> : null}
        {visible("status") ? <Th onClick={() => toggleSort("status")}>Status</Th> : null}
        {visible("opens") ? <Th>Opens</Th> : null}
        {visible("deadline") ? <Th onClick={() => toggleSort("deadline")}>Deadline</Th> : null}
        {visible("start") ? <Th>Start</Th> : null}
        {visible("tuition") ? <Th onClick={() => toggleSort("tuition")}>Tuition</Th> : null}
        {visible("days") ? <Th>Days</Th> : null}
        {visible("docs") ? <Th>Documents</Th> : null}
        {visible("updated") ? <Th onClick={() => toggleSort("updated")}>Updated</Th> : null}
        <Th>Actions</Th>
      </tr>
    </thead>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        subtitle={`${rows.length} of ${data.programs.length} programmes shown.`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))}
            >
              <SlidersHorizontal className="size-4" />
              {density === "compact" ? "Comfortable" : "Compact"}
            </Button>
            <Button
              variant={groupByCountry ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByCountry((v) => !v)}
            >
              Group by country
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                {COLUMNS.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.key}
                    checked={visible(c.key)}
                    onCheckedChange={(checked) =>
                      setHidden((h) => (checked ? h.filter((k) => k !== c.key) : [...h, c.key]))
                    }
                  >
                    {c.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="panel space-y-3 p-4">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search programmes and universities…"
        />
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <Filter label="Country" value={country} onChange={setCountry} options={countries} />
          <Filter label="Field" value={field} onChange={setField} options={[...FIELDS]} />
          <Filter
            label="Status"
            value={status}
            onChange={setStatus}
            options={[...APPLICATION_STATUSES]}
          />
          <Filter label="Priority" value={priority} onChange={setPriority} options={[...PRIORITIES]} />
          <Filter
            label="Admission"
            value={estimate}
            onChange={setEstimate}
            options={[...ADMISSION_ESTIMATES]}
          />
          <Filter label="Start year" value={startYear} onChange={setStartYear} options={startYears} />
          <Filter
            label="Institution"
            value={institution}
            onChange={setInstitution}
            options={["Public", "Private"]}
          />
          <Filter
            label="Application state"
            value={openState}
            onChange={setOpenState}
            options={["OPEN NOW", "OPENS LATER", "DEADLINE SOON", "CLOSED", "NO DATES"]}
          />
          <Filter
            label="Deadline within"
            value={within}
            onChange={setWithin}
            options={["7", "30", "90"]}
            format={(v) => `${v} days`}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No applications match these filters."
          description="Try clearing a filter or adding a new programme."
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="scrollbar-slim max-h-[70vh] overflow-auto">
            {groups ? (
              groups.map(([countryName, items]) => (
                <div key={countryName}>
                  <p className="sticky top-0 z-10 border-b bg-surface-strong px-4 py-2 text-xs font-semibold tracking-wide uppercase">
                    {countryName} · {items.length}
                  </p>
                  <table className="w-full min-w-[1100px] border-collapse">
                    {header}
                    <tbody>{items.map(renderRow)}</tbody>
                  </table>
                </div>
              ))
            ) : (
              <table className="w-full min-w-[1100px] border-collapse">
                {header}
                <tbody>{paged.map(renderRow)}</tbody>
              </table>
            )}
          </div>

          {!groupByCountry && pageCount > 1 ? (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                Page {page + 1} of {pageCount}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page + 1 >= pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <ProgramFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        program={editing}
        universities={data.universities}
      />
    </div>
  );
}

function Th({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <th className="px-3 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase">
      {onClick ? (
        <button onClick={onClick} className="inline-flex items-center gap-1 hover:text-foreground">
          {children}
          <ArrowUpDown className="size-3" />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
  format,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  format?: (v: string) => string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-xs">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: all</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {format ? format(o) : o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
