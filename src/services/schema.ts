import { z } from "zod";
import {
  ADMISSION_ESTIMATES,
  APPLICATION_STATUSES,
  CURRENCIES,
  DOCUMENT_STATUSES,
  FIELDS,
  INSTITUTION_TYPES,
  PRIORITIES,
} from "@/types";

const isoish = z.string().nullish().transform((v) => v ?? null);

export const universitySchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  city: z.string().default(""),
  institutionType: z.enum(INSTITUTION_TYPES).default("Public"),
  institutionLabel: z.string().default("Public"),
  website: z.string().default(""),
  rankingNotes: z.string().default(""),
  tuitionNotes: z.string().default(""),
  livingCostNotes: z.string().default(""),
  notes: z.string().default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  done: z.boolean().default(false),
  notes: z.string().default(""),
  dueDate: isoish,
  attachment: z.string().optional().default(""),
});

export const timelineEventSchema = z.object({
  id: z.string(),
  label: z.string(),
  date: isoish,
  done: z.boolean().default(false),
  notes: z.string().default(""),
});

export const scoresSchema = z.object({
  academicReputation: z.number().default(0),
  aiDepth: z.number().default(0),
  curriculum: z.number().default(0),
  career: z.number().default(0),
  universityReputation: z.number().default(0),
  location: z.number().default(0),
  costValue: z.number().default(0),
  admissionProbability: z.number().default(0),
  personalInterest: z.number().default(0),
});

export const financeSchema = z.object({
  currency: z.enum(CURRENCIES).default("EUR"),
  annualTuition: z.number().default(0),
  annualTuitionEur: z.number().nullish().transform((v) => v ?? null),
  applicationFee: z.number().default(0),
  monthlyRent: z.number().default(0),
  monthlyLiving: z.number().default(0),
});

export const offerSchema = z.object({
  received: z.boolean().default(false),
  offerDate: isoish,
  acceptanceDeadline: isoish,
  deposit: z.number().default(0),
  tuition: z.number().default(0),
  scholarship: z.string().default(""),
  conditions: z.string().default(""),
  conditional: z.boolean().default(true),
  letterUrl: z.string().default(""),
  decision: z.enum(["Pending", "Accepted", "Rejected"]).default("Pending"),
});

export const programSchema = z.object({
  id: z.string(),
  universityId: z.string(),
  name: z.string(),
  degreeType: z.string().default("MSc"),
  field: z.enum(FIELDS).default("Other"),
  specialisation: z.string().default(""),
  programUrl: z.string().default(""),
  admissionsUrl: z.string().default(""),
  portalUrl: z.string().default(""),
  scholarshipsUrl: z.string().default(""),
  language: z.string().default("English"),
  durationMonths: z.number().default(24),
  ects: z.number().default(120),
  applicationOpenDate: isoish,
  applicationDeadline: isoish,
  secondDeadline: isoish,
  startDate: isoish,
  startLabel: z.string().default(""),
  status: z.enum(APPLICATION_STATUSES).default("Researching"),
  priority: z.enum(PRIORITIES).default("Medium"),
  admissionEstimate: z.enum(ADMISSION_ESTIMATES).default("Target"),
  entryRequirements: z.string().default(""),
  englishRequirement: z.string().default(""),
  greRequirement: z.string().default(""),
  gmatRequirement: z.string().default(""),
  minGrade: z.string().default(""),
  prerequisites: z.string().default(""),
  description: z.string().default(""),
  whyInterested: z.string().default(""),
  advantages: z.string().default(""),
  disadvantages: z.string().default(""),
  notes: z.string().default(""),
  aiRelevance: z.number().default(0),
  researchStrength: z.number().default(0),
  technicalDepth: z.number().default(0),
  scores: scoresSchema,
  finance: financeSchema,
  offer: offerSchema,
  checklist: z.array(checklistItemSchema).default([]),
  timeline: z.array(timelineEventSchema).default([]),
  requiredDocumentIds: z.array(z.string()).default([]),
  lastVerified: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(DOCUMENT_STATUSES).default("Missing"),
  expiryDate: isoish,
  notes: z.string().default(""),
  link: z.string().default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().default(""),
  tags: z.array(z.string()).default([]),
  pinned: z.boolean().default(false),
  scope: z.enum(["global", "university", "program"]).default("global"),
  refId: z.string().nullish().transform((v) => v ?? null),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const settingsSchema = z.object({
  theme: z.enum(["light", "dark"]).default("dark"),
  defaultCurrency: z.enum(CURRENCIES).default("EUR"),
  staleAfterDays: z.number().default(60),
  density: z.enum(["compact", "comfortable"]).default("comfortable"),
});

export const appDataSchema = z.object({
  schemaVersion: z.number(),
  universities: z.array(universitySchema).default([]),
  programs: z.array(programSchema).default([]),
  documents: z.array(documentSchema).default([]),
  notes: z.array(noteSchema).default([]),
  settings: settingsSchema,
});

export type ParsedAppData = z.infer<typeof appDataSchema>;
