import type { AppData, AppSettings, Note, Program, TrackedDocument, University } from "@/types";
import { buildSeedData, SCHEMA_VERSION } from "@/data/seedData";
import { appDataSchema } from "./schema";

const STORAGE_KEY = "ai-masters-tracker:v1";

type Listener = () => void;

/**
 * Single storage abstraction for the whole app. The UI never touches
 * localStorage directly, so this can be swapped for a Supabase-backed
 * implementation later without changing any component.
 */
class StorageServiceImpl {
  private data: AppData;
  private listeners = new Set<Listener>();

  constructor() {
    this.data = this.read();
  }

  /* ---------------------------------------------------------------- core */

  private read(): AppData {
    if (typeof window === "undefined") return buildSeedData();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return buildSeedData();
      const parsed = migrate(JSON.parse(raw));
      const result = appDataSchema.safeParse(parsed);
      if (!result.success) {
        console.warn("Stored data failed validation, falling back to seed data", result.error);
        return buildSeedData();
      }
      return result.data as AppData;
    } catch (error) {
      console.error("Could not read stored data", error);
      return buildSeedData();
    }
  }

  private commit(next: AppData) {
    this.data = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Could not persist data", error);
    }
    this.listeners.forEach((l) => l());
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): AppData => this.data;

  /* -------------------------------------------------------- universities */

  getUniversities(): University[] {
    return this.data.universities;
  }

  getUniversity(id: string): University | undefined {
    return this.data.universities.find((u) => u.id === id);
  }

  saveUniversity(university: University) {
    const now = new Date().toISOString();
    const exists = this.data.universities.some((u) => u.id === university.id);
    const universities = exists
      ? this.data.universities.map((u) =>
          u.id === university.id ? { ...university, updatedAt: now } : u,
        )
      : [...this.data.universities, { ...university, createdAt: now, updatedAt: now }];
    this.commit({ ...this.data, universities });
  }

  deleteUniversity(id: string) {
    this.commit({
      ...this.data,
      universities: this.data.universities.filter((u) => u.id !== id),
      programs: this.data.programs.filter((p) => p.universityId !== id),
    });
  }

  /* ------------------------------------------------------------ programs */

  getPrograms(): Program[] {
    return this.data.programs;
  }

  getProgram(id: string): Program | undefined {
    return this.data.programs.find((p) => p.id === id);
  }

  saveProgram(program: Program) {
    const now = new Date().toISOString();
    const exists = this.data.programs.some((p) => p.id === program.id);
    const programs = exists
      ? this.data.programs.map((p) => (p.id === program.id ? { ...program, updatedAt: now } : p))
      : [...this.data.programs, { ...program, createdAt: now, updatedAt: now }];
    this.commit({ ...this.data, programs });
  }

  deleteProgram(id: string) {
    this.commit({ ...this.data, programs: this.data.programs.filter((p) => p.id !== id) });
  }

  /** Applications are the application-state facet of saved programmes. */
  getApplications(): Program[] {
    return this.data.programs;
  }

  saveApplication(program: Program) {
    this.saveProgram(program);
  }

  /* ----------------------------------------------------------- documents */

  getDocuments(): TrackedDocument[] {
    return this.data.documents;
  }

  saveDocument(doc: TrackedDocument) {
    const now = new Date().toISOString();
    const exists = this.data.documents.some((d) => d.id === doc.id);
    const documents = exists
      ? this.data.documents.map((d) => (d.id === doc.id ? { ...doc, updatedAt: now } : d))
      : [...this.data.documents, { ...doc, createdAt: now, updatedAt: now }];
    this.commit({ ...this.data, documents });
  }

  deleteDocument(id: string) {
    this.commit({ ...this.data, documents: this.data.documents.filter((d) => d.id !== id) });
  }

  /* --------------------------------------------------------------- notes */

  getNotes(): Note[] {
    return this.data.notes;
  }

  saveNote(note: Note) {
    const now = new Date().toISOString();
    const exists = this.data.notes.some((n) => n.id === note.id);
    const notes = exists
      ? this.data.notes.map((n) => (n.id === note.id ? { ...note, updatedAt: now } : n))
      : [{ ...note, createdAt: now, updatedAt: now }, ...this.data.notes];
    this.commit({ ...this.data, notes });
  }

  deleteNote(id: string) {
    this.commit({ ...this.data, notes: this.data.notes.filter((n) => n.id !== id) });
  }

  /* ------------------------------------------------------------ settings */

  getSettings(): AppSettings {
    return this.data.settings;
  }

  saveSettings(partial: Partial<AppSettings>) {
    this.commit({ ...this.data, settings: { ...this.data.settings, ...partial } });
  }

  /* ------------------------------------------------------ backup / reset */

  exportData(): AppData {
    return this.data;
  }

  validateImport(raw: unknown) {
    return appDataSchema.safeParse(migrate(raw));
  }

  importData(raw: unknown): { ok: true } | { ok: false; message: string } {
    const result = this.validateImport(raw);
    if (!result.success) {
      return { ok: false, message: result.error.issues[0]?.message ?? "Invalid backup file" };
    }
    this.commit(result.data as AppData);
    return { ok: true };
  }

  resetDemoData() {
    this.commit(buildSeedData());
  }

  clearAll() {
    this.commit({ ...buildSeedData(), universities: [], programs: [], notes: [] });
  }
}

/** Safe, additive migrations between schema versions. */
function migrate(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const data = { ...(raw as Record<string, unknown>) };
  const version = typeof data['schemaVersion'] === "number" ? (data['schemaVersion'] as number) : 0;

  if (version < 1) {
    data['schemaVersion'] = 1;
    data['universities'] ??= [];
    data['programs'] ??= [];
    data['documents'] ??= [];
    data['notes'] ??= [];
    data['settings'] ??= {};
  }

  data['schemaVersion'] = SCHEMA_VERSION;
  return data;
}

export const StorageService = new StorageServiceImpl();
