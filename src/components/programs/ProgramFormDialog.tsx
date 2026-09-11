import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EUROPEAN_COUNTRIES, countryCodeFor } from "@/data/countries";
import { defaultChecklist, defaultFinance, defaultOffer, defaultTimeline } from "@/data/defaults";
import { StorageService } from "@/services/storage";
import {
  ADMISSION_ESTIMATES,
  APPLICATION_STATUSES,
  CURRENCIES,
  FIELDS,
  PRIORITIES,
  type Program,
  type University,
} from "@/types";
import { toInputDate } from "@/utils/dates";
import { uid } from "@/utils/format";
import { emptyScores } from "@/utils/scoring";

const NEW_UNIVERSITY = "__new__";

type FormValues = {
  universityId: string;
  newUniversityName: string;
  newUniversityCountry: string;
  newUniversityCity: string;
  newUniversityType: "Public" | "Private";
  newUniversityWebsite: string;

  name: string;
  degreeType: string;
  field: string;
  specialisation: string;
  language: string;
  durationMonths: number;
  ects: number;

  applicationOpenDate: string;
  applicationDeadline: string;
  secondDeadline: string;
  startDate: string;
  startLabel: string;
  status: string;
  priority: string;
  admissionEstimate: string;
  lastVerified: string;

  currency: string;
  annualTuition: number;
  annualTuitionEur: number;
  applicationFee: number;
  monthlyRent: number;
  monthlyLiving: number;

  entryRequirements: string;
  englishRequirement: string;
  greRequirement: string;
  gmatRequirement: string;
  minGrade: string;
  prerequisites: string;

  aiRelevance: number;
  researchStrength: number;
  technicalDepth: number;

  programUrl: string;
  admissionsUrl: string;
  portalUrl: string;
  scholarshipsUrl: string;

  description: string;
  whyInterested: string;
  advantages: string;
  disadvantages: string;
  notes: string;
};

function toValues(program: Program | null, universities: University[]): FormValues {
  return {
    universityId: program?.universityId ?? universities[0]?.id ?? NEW_UNIVERSITY,
    newUniversityName: "",
    newUniversityCountry: "Netherlands",
    newUniversityCity: "",
    newUniversityType: "Public",
    newUniversityWebsite: "",
    name: program?.name ?? "",
    degreeType: program?.degreeType ?? "MSc",
    field: program?.field ?? "AI",
    specialisation: program?.specialisation ?? "",
    language: program?.language ?? "English",
    durationMonths: program?.durationMonths ?? 24,
    ects: program?.ects ?? 120,
    applicationOpenDate: toInputDate(program?.applicationOpenDate),
    applicationDeadline: toInputDate(program?.applicationDeadline),
    secondDeadline: toInputDate(program?.secondDeadline),
    startDate: toInputDate(program?.startDate),
    startLabel: program?.startLabel ?? "",
    status: program?.status ?? "Researching",
    priority: program?.priority ?? "High",
    admissionEstimate: program?.admissionEstimate ?? "Target",
    lastVerified: toInputDate(program?.lastVerified ?? new Date().toISOString()),
    currency: program?.finance.currency ?? "EUR",
    annualTuition: program?.finance.annualTuition ?? 0,
    annualTuitionEur: program?.finance.annualTuitionEur ?? 0,
    applicationFee: program?.finance.applicationFee ?? 0,
    monthlyRent: program?.finance.monthlyRent ?? 0,
    monthlyLiving: program?.finance.monthlyLiving ?? 0,
    entryRequirements: program?.entryRequirements ?? "",
    englishRequirement: program?.englishRequirement ?? "",
    greRequirement: program?.greRequirement ?? "",
    gmatRequirement: program?.gmatRequirement ?? "",
    minGrade: program?.minGrade ?? "",
    prerequisites: program?.prerequisites ?? "",
    aiRelevance: program?.aiRelevance ?? 0,
    researchStrength: program?.researchStrength ?? 0,
    technicalDepth: program?.technicalDepth ?? 0,
    programUrl: program?.programUrl ?? "",
    admissionsUrl: program?.admissionsUrl ?? "",
    portalUrl: program?.portalUrl ?? "",
    scholarshipsUrl: program?.scholarshipsUrl ?? "",
    description: program?.description ?? "",
    whyInterested: program?.whyInterested ?? "",
    advantages: program?.advantages ?? "",
    disadvantages: program?.disadvantages ?? "",
    notes: program?.notes ?? "",
  };
}

export function ProgramFormDialog({
  open,
  onOpenChange,
  program = null,
  universities,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: Program | null;
  universities: University[];
  onSaved?: (program: Program) => void;
}) {
  const [tab, setTab] = useState("university");
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: toValues(program, universities),
  });

  useEffect(() => {
    if (open) {
      reset(toValues(program, universities));
      setTab("university");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, program?.id]);

  const universityId = watch("universityId");

  const onSubmit = (values: FormValues) => {
    if (!values.name.trim()) {
      toast.error("Programme name is required");
      setTab("programme");
      return;
    }

    let resolvedUniversityId = values.universityId;
    if (values.universityId === NEW_UNIVERSITY) {
      if (!values.newUniversityName.trim()) {
        toast.error("Enter a name for the new university");
        setTab("university");
        return;
      }
      const now = new Date().toISOString();
      const university: University = {
        id: uid("uni"),
        name: values.newUniversityName.trim(),
        country: values.newUniversityCountry,
        countryCode: countryCodeFor(values.newUniversityCountry),
        city: values.newUniversityCity,
        institutionType: values.newUniversityType,
        institutionLabel: values.newUniversityType,
        website: values.newUniversityWebsite,
        rankingNotes: "",
        tuitionNotes: "",
        livingCostNotes: "",
        notes: "",
        createdAt: now,
        updatedAt: now,
      };
      StorageService.saveUniversity(university);
      resolvedUniversityId = university.id;
    }

    const now = new Date().toISOString();
    const next: Program = {
      ...(program ?? {
        id: uid("prog"),
        scores: emptyScores(),
        finance: defaultFinance(),
        offer: defaultOffer(),
        checklist: defaultChecklist(),
        timeline: defaultTimeline(),
        requiredDocumentIds: [],
        createdAt: now,
      }),
      universityId: resolvedUniversityId,
      name: values.name.trim(),
      degreeType: values.degreeType,
      field: values.field as Program["field"],
      specialisation: values.specialisation,
      language: values.language,
      durationMonths: Number(values.durationMonths) || 24,
      ects: Number(values.ects) || 120,
      applicationOpenDate: values.applicationOpenDate || null,
      applicationDeadline: values.applicationDeadline || null,
      secondDeadline: values.secondDeadline || null,
      startDate: values.startDate || null,
      startLabel: values.startLabel,
      status: values.status as Program["status"],
      priority: values.priority as Program["priority"],
      admissionEstimate: values.admissionEstimate as Program["admissionEstimate"],
      entryRequirements: values.entryRequirements,
      englishRequirement: values.englishRequirement,
      greRequirement: values.greRequirement,
      gmatRequirement: values.gmatRequirement,
      minGrade: values.minGrade,
      prerequisites: values.prerequisites,
      programUrl: values.programUrl,
      admissionsUrl: values.admissionsUrl,
      portalUrl: values.portalUrl,
      scholarshipsUrl: values.scholarshipsUrl,
      description: values.description,
      whyInterested: values.whyInterested,
      advantages: values.advantages,
      disadvantages: values.disadvantages,
      notes: values.notes,
      aiRelevance: Number(values.aiRelevance) || 0,
      researchStrength: Number(values.researchStrength) || 0,
      technicalDepth: Number(values.technicalDepth) || 0,
      finance: {
        ...(program?.finance ?? defaultFinance()),
        currency: values.currency as Program["finance"]["currency"],
        annualTuition: Number(values.annualTuition) || 0,
        annualTuitionEur: Number(values.annualTuitionEur) || null,
        applicationFee: Number(values.applicationFee) || 0,
        monthlyRent: Number(values.monthlyRent) || 0,
        monthlyLiving: Number(values.monthlyLiving) || 0,
      },
      lastVerified: values.lastVerified
        ? new Date(values.lastVerified).toISOString()
        : (program?.lastVerified ?? now),
      updatedAt: now,
    } as Program;

    StorageService.saveProgram(next);
    toast.success(program ? "Programme updated" : "Programme added");
    onSaved?.(next);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="font-display">
            {program ? "Edit programme" : "Add programme"}
          </DialogTitle>
          <DialogDescription>
            Everything here is editable later — leave anything you have not verified blank.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs value={tab} onValueChange={setTab}>
            <div className="scrollbar-slim overflow-x-auto border-b px-6 py-2">
              <TabsList className="w-max">
                <TabsTrigger value="university">University</TabsTrigger>
                <TabsTrigger value="programme">Programme</TabsTrigger>
                <TabsTrigger value="admissions">Admissions</TabsTrigger>
                <TabsTrigger value="cost">Cost</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="assessment">Assessment</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
            </div>

            <div className="scrollbar-slim max-h-[55vh] overflow-y-auto px-6 py-5">
              <TabsContent value="university" className="mt-0 space-y-4">
                <Field label="University">
                  <Select
                    value={universityId}
                    onValueChange={(v) => setValue("universityId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a university" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                      <SelectItem value={NEW_UNIVERSITY}>+ Create new university</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                {universityId === NEW_UNIVERSITY ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="University name">
                      <Input {...register("newUniversityName")} placeholder="e.g. Aarhus University" />
                    </Field>
                    <Field label="Country">
                      <Select
                        value={watch("newUniversityCountry")}
                        onValueChange={(v) => setValue("newUniversityCountry", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EUROPEAN_COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="City">
                      <Input {...register("newUniversityCity")} />
                    </Field>
                    <Field label="Institution type">
                      <Select
                        value={watch("newUniversityType")}
                        onValueChange={(v) =>
                          setValue("newUniversityType", v as "Public" | "Private")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Public">Public</SelectItem>
                          <SelectItem value="Private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Website" className="sm:col-span-2">
                      <Input {...register("newUniversityWebsite")} placeholder="https://" />
                    </Field>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="programme" className="mt-0 grid gap-4 sm:grid-cols-2">
                <Field label="Programme name" className="sm:col-span-2">
                  <Input {...register("name")} placeholder="MSc Artificial Intelligence" />
                </Field>
                <Field label="Degree type">
                  <Input {...register("degreeType")} />
                </Field>
                <Field label="Field">
                  <Select value={watch("field")} onValueChange={(v) => setValue("field", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELDS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Specialisation" className="sm:col-span-2">
                  <Input {...register("specialisation")} />
                </Field>
                <Field label="Language">
                  <Input {...register("language")} />
                </Field>
                <Field label="Duration (months)">
                  <Input type="number" {...register("durationMonths")} />
                </Field>
                <Field label="ECTS">
                  <Input type="number" {...register("ects")} />
                </Field>
                <Field label="Start label">
                  <Input {...register("startLabel")} placeholder="September 2027" />
                </Field>
              </TabsContent>

              <TabsContent value="admissions" className="mt-0 grid gap-4 sm:grid-cols-2">
                <Field label="Application opens">
                  <Input type="date" {...register("applicationOpenDate")} />
                </Field>
                <Field label="Application deadline">
                  <Input type="date" {...register("applicationDeadline")} />
                </Field>
                <Field label="Second deadline (optional)">
                  <Input type="date" {...register("secondDeadline")} />
                </Field>
                <Field label="Programme start date">
                  <Input type="date" {...register("startDate")} />
                </Field>
                <Field label="Application status">
                  <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
                    <SelectTrigger>
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
                </Field>
                <Field label="Priority">
                  <Select value={watch("priority")} onValueChange={(v) => setValue("priority", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Admission estimate">
                  <Select
                    value={watch("admissionEstimate")}
                    onValueChange={(v) => setValue("admissionEstimate", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMISSION_ESTIMATES.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Last verified">
                  <Input type="date" {...register("lastVerified")} />
                </Field>
              </TabsContent>

              <TabsContent value="cost" className="mt-0 grid gap-4 sm:grid-cols-2">
                <Field label="Currency">
                  <Select value={watch("currency")} onValueChange={(v) => setValue("currency", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Annual tuition (EU citizen)">
                  <Input type="number" {...register("annualTuition")} />
                </Field>
                <Field label="Manual EUR equivalent (optional)">
                  <Input type="number" {...register("annualTuitionEur")} />
                </Field>
                <Field label="Application fee">
                  <Input type="number" {...register("applicationFee")} />
                </Field>
                <Field label="Estimated monthly rent">
                  <Input type="number" {...register("monthlyRent")} />
                </Field>
                <Field label="Estimated monthly living expenses">
                  <Input type="number" {...register("monthlyLiving")} />
                </Field>
              </TabsContent>

              <TabsContent value="requirements" className="mt-0 grid gap-4 sm:grid-cols-2">
                <Field label="Entry requirements" className="sm:col-span-2">
                  <Textarea rows={3} {...register("entryRequirements")} />
                </Field>
                <Field label="English requirement">
                  <Input {...register("englishRequirement")} />
                </Field>
                <Field label="Minimum grade">
                  <Input {...register("minGrade")} />
                </Field>
                <Field label="GRE">
                  <Input {...register("greRequirement")} />
                </Field>
                <Field label="GMAT">
                  <Input {...register("gmatRequirement")} />
                </Field>
                <Field label="Prerequisite modules" className="sm:col-span-2">
                  <Textarea rows={3} {...register("prerequisites")} />
                </Field>
              </TabsContent>

              <TabsContent value="assessment" className="mt-0 grid gap-4 sm:grid-cols-3">
                <Field label="AI relevance (1–10)">
                  <Input type="number" min={0} max={10} {...register("aiRelevance")} />
                </Field>
                <Field label="Research strength (1–10)">
                  <Input type="number" min={0} max={10} {...register("researchStrength")} />
                </Field>
                <Field label="Technical depth (1–10)">
                  <Input type="number" min={0} max={10} {...register("technicalDepth")} />
                </Field>
                <Field label="Advantages" className="sm:col-span-3">
                  <Textarea rows={3} {...register("advantages")} />
                </Field>
                <Field label="Disadvantages" className="sm:col-span-3">
                  <Textarea rows={3} {...register("disadvantages")} />
                </Field>
              </TabsContent>

              <TabsContent value="links" className="mt-0 grid gap-4 sm:grid-cols-2">
                <Field label="Programme URL" className="sm:col-span-2">
                  <Input {...register("programUrl")} placeholder="https://" />
                </Field>
                <Field label="Admissions URL">
                  <Input {...register("admissionsUrl")} placeholder="https://" />
                </Field>
                <Field label="Application portal URL">
                  <Input {...register("portalUrl")} placeholder="https://" />
                </Field>
                <Field label="Scholarships URL" className="sm:col-span-2">
                  <Input {...register("scholarshipsUrl")} placeholder="https://" />
                </Field>
              </TabsContent>

              <TabsContent value="notes" className="mt-0 space-y-4">
                <Field label="Programme description">
                  <Textarea rows={3} {...register("description")} />
                </Field>
                <Field label="Why I am interested">
                  <Textarea rows={3} {...register("whyInterested")} />
                </Field>
                <Field label="Personal notes">
                  <Textarea rows={4} {...register("notes")} />
                </Field>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{program ? "Save changes" : "Add programme"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
