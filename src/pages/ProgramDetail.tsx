import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  Trophy,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { EstimateBadge, PriorityBadge, StateBadge, StatusBadge } from "@/components/common/Badges";
import { ProgramFormDialog } from "@/components/programs/ProgramFormDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/hooks/useStore";
import { StorageService } from "@/services/storage";
import { APPLICATION_STATUSES, type ChecklistItem, type Program } from "@/types";
import { daysSince, formatDate, toInputDate } from "@/utils/dates";
import { programState } from "@/utils/deadlines";
import { flagEmoji, initials, money, uid } from "@/utils/format";
import {
  SCORE_FIELDS,
  checklistProgress,
  estimatedAnnualCost,
  estimatedTotalCost,
  overallScore,
} from "@/utils/scoring";

export default function ProgramDetail() {
  const { id } = useParams();
  const data = useAppData();
  const [editOpen, setEditOpen] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [newEvent, setNewEvent] = useState("");

  const program = data.programs.find((p) => p.id === id);
  if (!program) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-display text-lg font-semibold">Programme not found</p>
        <Button asChild className="mt-4">
          <Link to="/programmes">Back to programmes</Link>
        </Button>
      </div>
    );
  }

  const uni = data.universities.find((u) => u.id === program.universityId);
  const save = (patch: Partial<Program>) => StorageService.saveProgram({ ...program, ...patch });
  const progress = checklistProgress(program);
  const stale = (daysSince(program.lastVerified) ?? 0) > data.settings.staleAfterDays;
  const score = overallScore(program.scores);

  const scoreChart = SCORE_FIELDS.map((f) => ({
    name: f.label,
    value: program.scores[f.key],
  }));

  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="font-display flex size-14 items-center justify-center rounded-xl bg-primary/10 text-lg font-semibold text-primary">
            {initials(uni?.name ?? program.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-base">{flagEmoji(uni?.countryCode ?? "")}</span>
              <Link to={`/universities/${program.universityId}`} className="hover:underline">
                {uni?.name}
              </Link>
              <span>· {uni?.city}</span>
            </p>
            <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight">
              {program.name}
            </h1>
            {program.specialisation ? (
              <p className="text-sm text-muted-foreground">{program.specialisation}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PriorityBadge value={program.priority} />
              <EstimateBadge value={program.admissionEstimate} />
              <StateBadge value={programState(program)} />
              <StatusBadge value={program.status} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Edit
            </Button>
            <Select
              value={program.status}
              onValueChange={(v) => save({ status: v as Program["status"] })}
            >
              <SelectTrigger className="h-9 w-[180px] text-xs">
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
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t pt-4 text-xs text-muted-foreground">
          <span>Last verified: {formatDate(program.lastVerified)}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              save({ lastVerified: new Date().toISOString() });
              toast.success("Marked as verified today");
            }}
          >
            <CheckCircle2 className="size-3.5" /> Mark verified today
          </Button>
          {stale ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-warning-soft px-2 py-1 font-medium text-warning">
              <AlertTriangle className="size-3.5" /> Information may need re-verification.
            </span>
          ) : null}
          <span className="ml-auto flex items-center gap-2">
            Application checklist
            <Progress value={progress} className="h-1.5 w-28" />
            <span className="numeric font-semibold text-foreground">{progress}% complete</span>
          </span>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <div className="scrollbar-slim overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="scores">Personal score</TabsTrigger>
            <TabsTrigger value="finance">Finances</TabsTrigger>
            <TabsTrigger value="offer">Offer</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
        </div>

        {/* ------------------------------------------------------- overview */}
        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Programme details">
            <Facts
              rows={[
                ["University", uni?.name ?? "—"],
                ["Country", `${flagEmoji(uni?.countryCode ?? "")} ${uni?.country ?? "—"}`],
                ["City", uni?.city ?? "—"],
                ["Degree type", program.degreeType],
                ["Field", program.field],
                ["Institution", uni?.institutionLabel ?? "—"],
                ["Language", program.language],
                ["Duration", `${program.durationMonths} months`],
                ["ECTS", String(program.ects)],
              ]}
            />
          </Panel>

          <Panel title="Dates">
            <Facts
              rows={[
                ["Application opens", formatDate(program.applicationOpenDate)],
                ["Application deadline", formatDate(program.applicationDeadline)],
                ["Second deadline", formatDate(program.secondDeadline)],
                ["Programme start", program.startLabel || formatDate(program.startDate)],
              ]}
            />
          </Panel>

          <Panel title="Cost">
            <Facts
              rows={[
                [
                  "Tuition (EU citizen)",
                  money(program.finance.annualTuition, program.finance.currency),
                ],
                ["Application fee", money(program.finance.applicationFee, program.finance.currency)],
                ["Estimated annual cost", money(estimatedAnnualCost(program))],
                ["Estimated total study cost", money(estimatedTotalCost(program))],
              ]}
            />
          </Panel>

          <Panel title="Entry requirements">
            <Facts
              rows={[
                ["Requirements", program.entryRequirements || "—"],
                ["English", program.englishRequirement || "—"],
                ["GRE", program.greRequirement || "—"],
                ["GMAT", program.gmatRequirement || "—"],
                ["Minimum grade", program.minGrade || "—"],
                ["Prerequisites", program.prerequisites || "—"],
              ]}
            />
          </Panel>

          <Panel title="Links">
            <div className="flex flex-col gap-2 text-sm">
              {[
                ["Programme page", program.programUrl],
                ["Admissions", program.admissionsUrl],
                ["Application portal", program.portalUrl],
                ["Scholarships", program.scholarshipsUrl],
                ["University website", uni?.website ?? ""],
              ].map(([label, href]) =>
                href ? (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="size-3.5" /> {label}
                  </a>
                ) : (
                  <span key={label} className="text-muted-foreground">
                    {label}: —
                  </span>
                ),
              )}
            </div>
          </Panel>

          <Panel title="Assessment">
            <Facts
              rows={[
                ["AI relevance", program.aiRelevance ? `${program.aiRelevance}/10` : "Not rated"],
                [
                  "Research strength",
                  program.researchStrength ? `${program.researchStrength}/10` : "Not rated",
                ],
                [
                  "Technical depth",
                  program.technicalDepth ? `${program.technicalDepth}/10` : "Not rated",
                ],
                ["Advantages", program.advantages || "—"],
                ["Disadvantages", program.disadvantages || "—"],
                ["Why I am interested", program.whyInterested || "—"],
              ]}
            />
          </Panel>
        </TabsContent>

        {/* ------------------------------------------------------ checklist */}
        <TabsContent value="checklist" className="mt-4">
          <div className="panel p-5">
            <div className="mb-4 flex items-center gap-3">
              <ListChecks className="size-4 text-primary" />
              <Progress value={progress} className="h-2 flex-1" />
              <span className="numeric text-sm font-semibold">{progress}% complete</span>
            </div>

            <ul className="space-y-2">
              {program.checklist.map((item) => (
                <li key={item.id} className="rounded-lg border bg-surface p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.done}
                      onCheckedChange={(checked) =>
                        save({
                          checklist: program.checklist.map((c) =>
                            c.id === item.id ? { ...c, done: Boolean(checked) } : c,
                          ),
                        })
                      }
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className={item.done ? "text-sm line-through opacity-60" : "text-sm"}>
                        {item.label}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Input
                          className="h-8 text-xs"
                          placeholder="Notes"
                          defaultValue={item.notes}
                          onBlur={(e) => updateItem(item, { notes: e.target.value })}
                        />
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          defaultValue={toInputDate(item.dueDate)}
                          onChange={(e) => updateItem(item, { dueDate: e.target.value || null })}
                        />
                        <Input
                          className="h-8 text-xs"
                          placeholder="Attachment reference / link"
                          defaultValue={item.attachment ?? ""}
                          onBlur={(e) => updateItem(item, { attachment: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-danger"
                      onClick={() =>
                        save({ checklist: program.checklist.filter((c) => c.id !== item.id) })
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex gap-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add a checklist item…"
              />
              <Button
                onClick={() => {
                  if (!newItem.trim()) return;
                  save({
                    checklist: [
                      ...program.checklist,
                      { id: uid("chk"), label: newItem.trim(), done: false, notes: "", dueDate: null },
                    ],
                  });
                  setNewItem("");
                }}
              >
                <Plus className="size-4" /> Add
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------- timeline */}
        <TabsContent value="timeline" className="mt-4">
          <div className="panel p-5">
            <ol className="relative space-y-4 border-l pl-6">
              {program.timeline.map((ev) => (
                <li key={ev.id} className="relative">
                  <span
                    className={`absolute top-1.5 -left-[1.72rem] size-3 rounded-full border-2 border-background ${
                      ev.done ? "bg-success" : "bg-muted"
                    }`}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Checkbox
                      checked={ev.done}
                      onCheckedChange={(checked) =>
                        save({
                          timeline: program.timeline.map((t) =>
                            t.id === ev.id ? { ...t, done: Boolean(checked) } : t,
                          ),
                        })
                      }
                    />
                    <span className="text-sm font-medium">{ev.label}</span>
                    <Input
                      type="date"
                      className="h-8 w-40 text-xs"
                      defaultValue={toInputDate(ev.date)}
                      onChange={(e) =>
                        save({
                          timeline: program.timeline.map((t) =>
                            t.id === ev.id ? { ...t, date: e.target.value || null } : t,
                          ),
                        })
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-danger"
                      onClick={() =>
                        save({ timeline: program.timeline.filter((t) => t.id !== ev.id) })
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-5 flex gap-2">
              <Input
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value)}
                placeholder="Add a custom timeline event…"
              />
              <Button
                onClick={() => {
                  if (!newEvent.trim()) return;
                  save({
                    timeline: [
                      ...program.timeline,
                      { id: uid("tl"), label: newEvent.trim(), date: null, done: false, notes: "" },
                    ],
                  });
                  setNewEvent("");
                }}
              >
                <Plus className="size-4" /> Add
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* --------------------------------------------------------- scores */}
        <TabsContent value="scores" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Your ratings (1–10)">
            <div className="space-y-4">
              {SCORE_FIELDS.map((f) => (
                <div key={f.key}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <Label>{f.label}</Label>
                    <span className="numeric text-muted-foreground">
                      {program.scores[f.key] || "—"}
                    </span>
                  </div>
                  <Slider
                    value={[program.scores[f.key]]}
                    min={0}
                    max={10}
                    step={1}
                    onValueChange={([v]) =>
                      save({ scores: { ...program.scores, [f.key]: v ?? 0 } })
                    }
                  />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Overall score">
            <p className="numeric text-4xl font-semibold">
              {score === null ? "—" : score.toFixed(1)}
              <span className="text-base text-muted-foreground">/10</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Average of the criteria you have rated.
            </p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreChart} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                  />
                  <RTooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </TabsContent>

        {/* -------------------------------------------------------- finance */}
        <TabsContent value="finance" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Cost inputs">
            <div className="grid gap-3 sm:grid-cols-2">
              <NumberField
                label={`Annual tuition (${program.finance.currency})`}
                value={program.finance.annualTuition}
                onChange={(v) => save({ finance: { ...program.finance, annualTuition: v } })}
              />
              <NumberField
                label="Manual EUR equivalent"
                value={program.finance.annualTuitionEur ?? 0}
                onChange={(v) =>
                  save({ finance: { ...program.finance, annualTuitionEur: v || null } })
                }
              />
              <NumberField
                label="Application fee"
                value={program.finance.applicationFee}
                onChange={(v) => save({ finance: { ...program.finance, applicationFee: v } })}
              />
              <NumberField
                label="Monthly rent"
                value={program.finance.monthlyRent}
                onChange={(v) => save({ finance: { ...program.finance, monthlyRent: v } })}
              />
              <NumberField
                label="Monthly living expenses"
                value={program.finance.monthlyLiving}
                onChange={(v) => save({ finance: { ...program.finance, monthlyLiving: v } })}
              />
              <NumberField
                label="Duration (months)"
                value={program.durationMonths}
                onChange={(v) => save({ durationMonths: v })}
              />
            </div>
          </Panel>
          <Panel title="Calculated">
            <Facts
              rows={[
                ["Total tuition", money(estimatedAnnualCost(program) - (program.finance.monthlyRent + program.finance.monthlyLiving) * 12)],
                ["Estimated annual cost", money(estimatedAnnualCost(program))],
                ["Estimated total study cost", money(estimatedTotalCost(program))],
              ]}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Amounts are shown in the currency you entered. Enter a manual EUR equivalent for
              non-euro programmes — no exchange rate service is used.
            </p>
          </Panel>
        </TabsContent>

        {/* ---------------------------------------------------------- offer */}
        <TabsContent value="offer" className="mt-4">
          <Panel title="Offer tracking">
            <div className="mb-4 flex items-center gap-3">
              <Trophy className="size-4 text-success" />
              <Label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={program.offer.received}
                  onCheckedChange={(v) => save({ offer: { ...program.offer, received: v } })}
                />
                Offer received
              </Label>
            </div>

            {program.offer.received ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <DateField
                  label="Offer date"
                  value={program.offer.offerDate}
                  onChange={(v) => save({ offer: { ...program.offer, offerDate: v } })}
                />
                <DateField
                  label="Acceptance deadline"
                  value={program.offer.acceptanceDeadline}
                  onChange={(v) => save({ offer: { ...program.offer, acceptanceDeadline: v } })}
                />
                <NumberField
                  label="Deposit"
                  value={program.offer.deposit}
                  onChange={(v) => save({ offer: { ...program.offer, deposit: v } })}
                />
                <NumberField
                  label="Tuition stated in offer"
                  value={program.offer.tuition}
                  onChange={(v) => save({ offer: { ...program.offer, tuition: v } })}
                />
                <TextField
                  label="Scholarship"
                  value={program.offer.scholarship}
                  onChange={(v) => save({ offer: { ...program.offer, scholarship: v } })}
                />
                <TextField
                  label="Offer letter link"
                  value={program.offer.letterUrl}
                  onChange={(v) => save({ offer: { ...program.offer, letterUrl: v } })}
                />
                <div className="sm:col-span-2">
                  <Label className="mb-1.5 block text-xs text-muted-foreground">Conditions</Label>
                  <Textarea
                    rows={3}
                    defaultValue={program.offer.conditions}
                    onBlur={(e) => save({ offer: { ...program.offer, conditions: e.target.value } })}
                  />
                </div>
                <Label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={program.offer.conditional}
                    onCheckedChange={(v) => save({ offer: { ...program.offer, conditional: v } })}
                  />
                  Conditional offer
                </Label>
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">My decision</Label>
                  <Select
                    value={program.offer.decision}
                    onValueChange={(v) =>
                      save({ offer: { ...program.offer, decision: v as "Pending" } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Accepted">Accepted</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No offer recorded yet. Switch this on when a decision arrives.
              </p>
            )}
          </Panel>
        </TabsContent>

        {/* ---------------------------------------------------------- notes */}
        <TabsContent value="notes" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel title="Programme description">
            <Textarea
              rows={6}
              defaultValue={program.description}
              onBlur={(e) => save({ description: e.target.value })}
            />
          </Panel>
          <Panel title="Personal notes">
            <Textarea
              rows={6}
              defaultValue={program.notes}
              onBlur={(e) => save({ notes: e.target.value })}
            />
          </Panel>
          <Panel title="Advantages">
            <Textarea
              rows={4}
              defaultValue={program.advantages}
              onBlur={(e) => save({ advantages: e.target.value })}
            />
          </Panel>
          <Panel title="Disadvantages">
            <Textarea
              rows={4}
              defaultValue={program.disadvantages}
              onBlur={(e) => save({ disadvantages: e.target.value })}
            />
          </Panel>
        </TabsContent>
      </Tabs>

      <ProgramFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        program={program}
        universities={data.universities}
      />
    </div>
  );

  function updateItem(item: ChecklistItem, patch: Partial<ChecklistItem>) {
    save({
      checklist: program!.checklist.map((c) => (c.id === item.id ? { ...c, ...patch } : c)),
    });
  }
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <h2 className="font-display mb-3 text-sm font-semibold tracking-wide uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-4 py-2">
          <dt className="w-44 shrink-0 text-muted-foreground">{label}</dt>
          <dd className="min-w-0 flex-1 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        defaultValue={value}
        onBlur={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      <Input defaultValue={value} onBlur={(e) => onChange(e.target.value)} />
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs text-muted-foreground">{label}</Label>
      <Input
        type="date"
        defaultValue={toInputDate(value)}
        onChange={(e) => onChange(e.target.value || null)}
      />
    </div>
  );
}
