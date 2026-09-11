import { Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Applications from "@/pages/Applications";
import Compare from "@/pages/Compare";
import Countries from "@/pages/Countries";
import CountryDetail from "@/pages/CountryDetail";
import Dashboard from "@/pages/Dashboard";
import Deadlines from "@/pages/Deadlines";
import Documents from "@/pages/Documents";
import NotFound from "@/pages/NotFound";
import Notes from "@/pages/Notes";
import ProgramDetail from "@/pages/ProgramDetail";
import Programs from "@/pages/Programs";
import Settings from "@/pages/Settings";
import UniversityDetail from "@/pages/UniversityDetail";
import Universities from "@/pages/Universities";

export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="universities" element={<Universities />} />
          <Route path="universities/:id" element={<UniversityDetail />} />
          <Route path="programmes" element={<Programs />} />
          <Route path="programmes/:id" element={<ProgramDetail />} />
          <Route path="deadlines" element={<Deadlines />} />
          <Route path="compare" element={<Compare />} />
          <Route path="countries" element={<Countries />} />
          <Route path="countries/:name" element={<CountryDetail />} />
          <Route path="documents" element={<Documents />} />
          <Route path="notes" element={<Notes />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster position="top-right" richColors />
    </TooltipProvider>
  );
}
