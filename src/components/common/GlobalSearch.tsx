import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, GraduationCap, MapPin, NotebookPen, FileText } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAppData } from "@/hooks/useStore";
import { collectDeadlines } from "@/utils/deadlines";
import { formatDate } from "@/utils/dates";
import { flagEmoji } from "@/utils/format";

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const data = useAppData();
  const navigate = useNavigate();

  const countries = useMemo(
    () => Array.from(new Set(data.universities.map((u) => u.country))).sort(),
    [data.universities],
  );
  const deadlines = useMemo(
    () => collectDeadlines(data.programs, data.universities).slice(0, 40),
    [data.programs, data.universities],
  );
  const uniById = useMemo(
    () => new Map(data.universities.map((u) => [u.id, u])),
    [data.universities],
  );

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search universities, programmes, countries, notes, deadlines…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Universities">
          {data.universities.map((u) => (
            <CommandItem key={u.id} value={`uni ${u.name} ${u.country} ${u.city}`} onSelect={() => go(`/universities/${u.id}`)}>
              <GraduationCap className="size-4" />
              <span>{u.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {flagEmoji(u.countryCode)} {u.country}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Programmes">
          {data.programs.map((p) => (
            <CommandItem
              key={p.id}
              value={`prog ${p.name} ${uniById.get(p.universityId)?.name ?? ""} ${p.field}`}
              onSelect={() => go(`/programmes/${p.id}`)}
            >
              <FileText className="size-4" />
              <span className="truncate">{p.name}</span>
              <span className="ml-auto truncate text-xs text-muted-foreground">
                {uniById.get(p.universityId)?.name}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Countries">
          {countries.map((c) => (
            <CommandItem key={c} value={`country ${c}`} onSelect={() => go(`/countries/${encodeURIComponent(c)}`)}>
              <MapPin className="size-4" />
              <span>{c}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Notes">
          {data.notes.map((n) => (
            <CommandItem key={n.id} value={`note ${n.title} ${n.body} ${n.tags.join(" ")}`} onSelect={() => go("/notes")}>
              <NotebookPen className="size-4" />
              <span className="truncate">{n.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Deadlines">
          {deadlines.map((d) => (
            <CommandItem
              key={d.id}
              value={`deadline ${d.type} ${d.programName} ${d.universityName}`}
              onSelect={() => go(`/programmes/${d.programId}`)}
            >
              <CalendarClock className="size-4" />
              <span className="truncate">
                {d.type} · {d.programName}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">{formatDate(d.date)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
