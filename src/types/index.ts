export type ID = string;
export type ISODate = string;

export const APPLICATION_STATUSES = [
  "Researching",
  "Shortlisted",
  "Preparing",
  "Ready to Apply",
  "Submitted",
  "Under Review",
  "Interview",
  "Offer",
  "Accepted",
  "Waitlisted",
  "Rejected",
  "Withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const PRIORITIES = ["Must Apply", "High", "Medium", "Low", "Backup"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const ADMISSION_ESTIMATES = [
  "Very Strong",
  "Strong Target",
  "Target",
  "Competitive",
  "Reach",
  "Very Difficult",
] as const;
export type AdmissionEstimate = (typeof ADMISSION_ESTIMATES)[number];

export const FIELDS = [
  "AI",
  "ML",
  "Data Science",
  "Computer Science",
  "Robotics",
  "Business Analytics",
  "Other",
] as const;
export type ProgramField = (typeof FIELDS)[number];

export const INSTITUTION_TYPES = ["Public", "Private"] as const;
export type InstitutionType = (typeof INSTITUTION_TYPES)[number];

export const CURRENCIES = ["EUR", "CHF", "SEK", "DKK"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DOCUMENT_STATUSES = ["Missing", "Preparing", "Ready", "Submitted"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const NOTE_TAGS = [
  "Admission",
  "Deadline",
  "Tuition",
  "Documents",
  "Housing",
  "Visa",
  "Curriculum",
  "Research",
] as const;

export const DEADLINE_TYPES = [
  "Application opening",
  "Application deadline",
  "Scholarship deadline",
  "Document deadline",
  "Programme start",
  "Interview",
  "Decision date",
  "Enrolment deadline",
] as const;
export type DeadlineType = (typeof DEADLINE_TYPES)[number];

export interface University {
  id: ID;
  name: string;
  country: string;
  countryCode: string;
  city: string;
  institutionType: InstitutionType;
  institutionLabel: string;
  website: string;
  rankingNotes: string;
  tuitionNotes: string;
  livingCostNotes: string;
  notes: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface ChecklistItem {
  id: ID;
  label: string;
  done: boolean;
  notes: string;
  dueDate?: ISODate | null;
  attachment?: string;
}

export interface TimelineEvent {
  id: ID;
  label: string;
  date?: ISODate | null;
  done: boolean;
  notes: string;
}

export interface ProgramScores {
  academicReputation: number;
  aiDepth: number;
  curriculum: number;
  career: number;
  universityReputation: number;
  location: number;
  costValue: number;
  admissionProbability: number;
  personalInterest: number;
}

export interface ProgramFinance {
  currency: Currency;
  annualTuition: number;
  annualTuitionEur?: number | null;
  applicationFee: number;
  monthlyRent: number;
  monthlyLiving: number;
}

export interface ProgramOffer {
  received: boolean;
  offerDate?: ISODate | null;
  acceptanceDeadline?: ISODate | null;
  deposit: number;
  tuition: number;
  scholarship: string;
  conditions: string;
  conditional: boolean;
  letterUrl: string;
  decision: "Pending" | "Accepted" | "Rejected";
}

export interface Program {
  id: ID;
  universityId: ID;
  name: string;
  degreeType: string;
  field: ProgramField;
  specialisation: string;
  programUrl: string;
  admissionsUrl: string;
  portalUrl: string;
  scholarshipsUrl: string;
  language: string;
  durationMonths: number;
  ects: number;

  applicationOpenDate?: ISODate | null;
  applicationDeadline?: ISODate | null;
  secondDeadline?: ISODate | null;
  startDate?: ISODate | null;
  startLabel: string;

  status: ApplicationStatus;
  priority: Priority;
  admissionEstimate: AdmissionEstimate;

  entryRequirements: string;
  englishRequirement: string;
  greRequirement: string;
  gmatRequirement: string;
  minGrade: string;
  prerequisites: string;

  description: string;
  whyInterested: string;
  advantages: string;
  disadvantages: string;
  notes: string;

  aiRelevance: number;
  researchStrength: number;
  technicalDepth: number;

  scores: ProgramScores;
  finance: ProgramFinance;
  offer: ProgramOffer;
  checklist: ChecklistItem[];
  timeline: TimelineEvent[];
  requiredDocumentIds: ID[];

  lastVerified: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface TrackedDocument {
  id: ID;
  name: string;
  status: DocumentStatus;
  expiryDate?: ISODate | null;
  notes: string;
  link: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Note {
  id: ID;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  scope: "global" | "university" | "program";
  refId?: ID | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface AppSettings {
  theme: "light" | "dark";
  defaultCurrency: Currency;
  staleAfterDays: number;
  density: "compact" | "comfortable";
}

export interface AppData {
  schemaVersion: number;
  universities: University[];
  programs: Program[];
  documents: TrackedDocument[];
  notes: Note[];
  settings: AppSettings;
}

export interface DeadlineEntry {
  id: string;
  type: DeadlineType;
  date: ISODate;
  programId: ID;
  programName: string;
  universityId: ID;
  universityName: string;
  countryCode: string;
  country: string;
  status: ApplicationStatus;
}
