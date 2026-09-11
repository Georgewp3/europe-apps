import { useRef } from "react";
import { Download, RotateCcw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppData, useSettings } from "@/hooks/useStore";
import { useTheme } from "@/hooks/useTheme";
import {
  deadlinesToRows,
  exportCsv,
  exportJson,
  programsToRows,
  universitiesToRows,
} from "@/services/export";
import { StorageService } from "@/services/storage";
import { CURRENCIES, type Currency } from "@/types";
import { collectDeadlines } from "@/utils/deadlines";

export default function Settings() {
  const data = useAppData();
  const [settings, update] = useSettings();
  const { theme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const onImport = async (file: File) => {
    try {
      const result = StorageService.importData(JSON.parse(await file.text()));
      if (result.ok) toast.success("Backup restored");
      else toast.error(`Could not restore backup: ${result.message}`);
    } catch {
      toast.error("That file isn't a valid backup");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        subtitle="Everything is stored in this browser only. Export a backup before switching device."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel space-y-4 p-5">
          <h2 className="font-display text-sm font-semibold tracking-wide uppercase">Appearance</h2>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Theme</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Table density</Label>
            <Select
              value={settings.density}
              onValueChange={(v) => update({ density: v as "compact" | "comfortable" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="panel space-y-4 p-5">
          <h2 className="font-display text-sm font-semibold tracking-wide uppercase">Preferences</h2>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Display currency</Label>
            <Select
              value={settings.defaultCurrency}
              onValueChange={(v) => update({ defaultCurrency: v as Currency })}
            >
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
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">
              Warn that information is out of date after (days)
            </Label>
            <Input
              type="number"
              min={7}
              defaultValue={settings.staleAfterDays}
              onBlur={(e) => update({ staleAfterDays: Number(e.target.value) || 60 })}
            />
          </div>
        </section>

        <section className="panel space-y-3 p-5">
          <h2 className="font-display text-sm font-semibold tracking-wide uppercase">
            Backup &amp; export
          </h2>
          <p className="text-sm text-muted-foreground">
            {data.universities.length} universities · {data.programs.length} programmes ·{" "}
            {data.documents.length} documents · {data.notes.length} notes
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => exportJson(data)}>
              <Download className="size-4" /> Full backup (JSON)
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                exportCsv(programsToRows(data.programs, data.universities), "programmes.csv")
              }
            >
              Programmes CSV
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                exportCsv(universitiesToRows(data.universities, data.programs), "universities.csv")
              }
            >
              Universities CSV
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                exportCsv(
                  deadlinesToRows(collectDeadlines(data.programs, data.universities)),
                  "deadlines.csv",
                )
              }
            >
              Deadlines CSV
            </Button>
          </div>

          <div className="border-t pt-3">
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onImport(file);
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> Restore from backup
            </Button>
          </div>
        </section>

        <section className="panel space-y-3 p-5">
          <h2 className="font-display text-sm font-semibold tracking-wide uppercase">Data</h2>
          <p className="text-sm text-muted-foreground">
            Reset restores the starting list of European AI/ML programmes. Clearing removes
            everything you have entered.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("Replace everything with the starting data?")) {
                  StorageService.resetDemoData();
                  toast.success("Starting data restored");
                }
              }}
            >
              <RotateCcw className="size-4" /> Reset to starting data
            </Button>
            <Button
              variant="outline"
              className="text-danger"
              onClick={() => {
                if (confirm("Delete all universities, programmes and notes? This cannot be undone.")) {
                  StorageService.clearAll();
                  toast.success("All data cleared");
                }
              }}
            >
              <Trash2 className="size-4" /> Clear everything
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
