import { Link, useParams } from "react-router-dom";
import { ExternalLink, Pencil } from "lucide-react";

import { EstimateBadge, PriorityBadge, StateBadge, StatusBadge } from "@/components/common/Badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/hooks/useStore";
import { StorageService } from "@/services/storage";
import type { University } from "@/types";
import { formatDate } from "@/utils/dates";
import { programState } from "@/utils/deadlines";
import { flagEmoji, initials, money } from "@/utils/format";
import { estimatedTotalCost } from "@/utils/scoring";

export default function UniversityDetail() {
  const { id } = useParams();
  const data = useAppData();
  const uni = data.universities.find((u) => u.id === id);

  if (!uni) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-display text-lg font-semibold">University not found</p>
        <Button asChild className="mt-4">
          <Link to="/universities">Back to universities</Link>
        </Button>
      </div>
    );
  }

  const programs = data.programs.filter((p) => p.universityId === uni.id);
  const save = (patch: Partial<University>) => StorageService.saveUniversity({ ...uni, ...patch });

  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="font-display flex size-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary">
            {initials(uni.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{uni.name}</h1>
            <p className="text-sm text-muted-foreground">
              {flagEmoji(uni.countryCode)}{" "}
              <Link to={`/countries/${encodeURIComponent(uni.country)}`} className="hover:underline">
                {uni.country}
              </Link>{" "}
              · {uni.city} · {uni.institutionLabel}
            </p>
            {uni.website ? (
              <a
                href={uni.website}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" /> Visit website
              </a>
            ) : null}
          </div>
          <div className="text-right text-sm">
            <p className="numeric font-display text-2xl font-semibold">{programs.length}</p>
            <p className="text-xs text-muted-foreground">programmes tracked</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel space-y-4 p-5 lg:col-span-1">
          <h2 className="font-display text-sm font-semibold tracking-wide uppercase">
            Editable details
          </h2>
          <Field label="City" value={uni.city} onSave={(v) => save({ city: v })} />
          <Field label="Country" value={uni.country} onSave={(v) => save({ country: v })} />
          <Field
            label="Country code"
            value={uni.countryCode}
            onSave={(v) => save({ countryCode: v.toUpperCase().slice(0, 2) })}
          />
          <Field label="Type" value={uni.institutionLabel} onSave={(v) => save({ institutionLabel: v })} />
          <Field label="Website" value={uni.website} onSave={(v) => save({ website: v })} />
          <Area label="Ranking notes" value={uni.rankingNotes} onSave={(v) => save({ rankingNotes: v })} />
          <Area label="Tuition notes" value={uni.tuitionNotes} onSave={(v) => save({ tuitionNotes: v })} />
          <Area
            label="Living cost notes"
            value={uni.livingCostNotes}
            onSave={(v) => save({ livingCostNotes: v })}
          />
          <Area label="My notes" value={uni.notes} onSave={(v) => save({ notes: v })} />
        </section>

        <section className="panel p-5 lg:col-span-2">
          <h2 className="font-display mb-3 text-sm font-semibold tracking-wide uppercase">
            Programmes at this university
          </h2>
          {programs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No programmes tracked here yet.</p>
          ) : (
            <ul className="space-y-3">
              {programs.map((p) => (
                <li key={p.id}>
                  <Link to={`/programmes/${p.id}`} className="panel panel-hover block p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{p.name}</p>
                      <span className="text-xs text-muted-foreground">
                        Deadline {formatDate(p.applicationDeadline)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <PriorityBadge value={p.priority} />
                      <EstimateBadge value={p.admissionEstimate} />
                      <StateBadge value={programState(p)} />
                      <StatusBadge value={p.status} />
                      <span className="numeric ml-auto text-xs text-muted-foreground">
                        {money(estimatedTotalCost(p))} est. total
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t pt-4 text-xs text-muted-foreground">
            <Pencil className="mr-1.5 inline size-3" />
            Every field on this page is editable — changes save to your browser instantly.
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      <Input defaultValue={value} onBlur={(e) => onSave(e.target.value)} />
    </div>
  );
}

function Area({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      <Textarea rows={3} defaultValue={value} onBlur={(e) => onSave(e.target.value)} />
    </div>
  );
}
