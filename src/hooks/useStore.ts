import { useCallback, useMemo, useSyncExternalStore } from "react";
import { StorageService } from "@/services/storage";
import type { AppData, Program, University } from "@/types";

export function useAppData(): AppData {
  return useSyncExternalStore(
    StorageService.subscribe,
    StorageService.getSnapshot,
    StorageService.getSnapshot,
  );
}

export function useUniversities(): University[] {
  return useAppData().universities;
}

export function usePrograms(): Program[] {
  return useAppData().programs;
}

export function useUniversityMap() {
  const universities = useUniversities();
  return useMemo(() => new Map(universities.map((u) => [u.id, u])), [universities]);
}

export function useSettings() {
  const settings = useAppData().settings;
  const update = useCallback(
    (partial: Partial<AppData["settings"]>) => StorageService.saveSettings(partial),
    [],
  );
  return [settings, update] as const;
}
