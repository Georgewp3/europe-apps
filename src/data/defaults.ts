import type {
  AppSettings,
  ChecklistItem,
  ProgramFinance,
  ProgramOffer,
  TimelineEvent,
  TrackedDocument,
} from "@/types";
import { uid } from "@/utils/format";

export const DEFAULT_CHECKLIST_LABELS = [
  "Check eligibility",
  "Review transcript requirements",
  "Prepare CV",
  "Prepare motivation letter",
  "Obtain transcript",
  "Obtain degree certificate",
  "Apostille / legalisation if required",
  "Prepare English-language evidence",
  "Request recommendation letters",
  "Upload passport / ID",
  "Pay application fee",
  "Complete application portal",
  "Submit application",
  "Save submission confirmation",
  "Monitor application portal",
  "Prepare interview if required",
];

export const DEFAULT_TIMELINE_LABELS = [
  "Research started",
  "Application opened",
  "Documents prepared",
  "Application submitted",
  "Application confirmation received",
  "Under review",
  "Interview",
  "Decision received",
  "Offer accepted",
];

export const DEFAULT_DOCUMENT_NAMES = [
  "CV",
  "Passport",
  "Bachelor Degree",
  "Transcript",
  "Diploma Supplement",
  "Apostille",
  "English Language Evidence",
  "Recommendation Letter 1",
  "Recommendation Letter 2",
  "Motivation Letter Template",
  "Portfolio",
  "GitHub Profile",
  "LinkedIn Profile",
];

export function defaultChecklist(): ChecklistItem[] {
  return DEFAULT_CHECKLIST_LABELS.map((label) => ({
    id: uid("chk"),
    label,
    done: false,
    notes: "",
    dueDate: null,
  }));
}

export function defaultTimeline(): TimelineEvent[] {
  return DEFAULT_TIMELINE_LABELS.map((label, index) => ({
    id: uid("tl"),
    label,
    date: null,
    done: index === 0,
    notes: "",
  }));
}

export function defaultDocuments(): TrackedDocument[] {
  const now = new Date().toISOString();
  return DEFAULT_DOCUMENT_NAMES.map((name) => ({
    id: uid("doc"),
    name,
    status: "Missing" as const,
    expiryDate: null,
    notes: "",
    link: "",
    createdAt: now,
    updatedAt: now,
  }));
}

export function defaultFinance(): ProgramFinance {
  return {
    currency: "EUR",
    annualTuition: 0,
    annualTuitionEur: null,
    applicationFee: 0,
    monthlyRent: 0,
    monthlyLiving: 0,
  };
}

export function defaultOffer(): ProgramOffer {
  return {
    received: false,
    offerDate: null,
    acceptanceDeadline: null,
    deposit: 0,
    tuition: 0,
    scholarship: "",
    conditions: "",
    conditional: true,
    letterUrl: "",
    decision: "Pending",
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  defaultCurrency: "EUR",
  staleAfterDays: 60,
  density: "comfortable",
};
