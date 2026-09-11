import type { Program, ProgramScores } from "@/types";

export const SCORE_FIELDS: { key: keyof ProgramScores; label: string }[] = [
  { key: "academicReputation", label: "Academic reputation" },
  { key: "aiDepth", label: "AI / ML depth" },
  { key: "curriculum", label: "Curriculum" },
  { key: "career", label: "Career opportunities" },
  { key: "universityReputation", label: "University reputation" },
  { key: "location", label: "Location" },
  { key: "costValue", label: "Cost / value" },
  { key: "admissionProbability", label: "Admission probability" },
  { key: "personalInterest", label: "Personal interest" },
];

export function emptyScores(): ProgramScores {
  return {
    academicReputation: 0,
    aiDepth: 0,
    curriculum: 0,
    career: 0,
    universityReputation: 0,
    location: 0,
    costValue: 0,
    admissionProbability: 0,
    personalInterest: 0,
  };
}

/** Average of the scores the user actually rated (0 = unrated). Null when nothing rated. */
export function overallScore(scores: ProgramScores): number | null {
  const values = SCORE_FIELDS.map((f) => scores[f.key]).filter((v) => v > 0);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function checklistProgress(program: Program): number {
  if (program.checklist.length === 0) return 0;
  const done = program.checklist.filter((i) => i.done).length;
  return Math.round((done / program.checklist.length) * 100);
}

export function estimatedAnnualCost(program: Program): number {
  const { annualTuition, annualTuitionEur, monthlyRent, monthlyLiving } = program.finance;
  const tuition = annualTuitionEur ?? annualTuition;
  return tuition + (monthlyRent + monthlyLiving) * 12;
}

export function estimatedTotalCost(program: Program): number {
  const years = Math.max(program.durationMonths, 1) / 12;
  return Math.round(estimatedAnnualCost(program) * years + program.finance.applicationFee);
}

export function tuitionInEur(program: Program): number {
  return program.finance.annualTuitionEur ?? program.finance.annualTuition;
}
