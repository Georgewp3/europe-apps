import { useEffect } from "react";
import { useSettings } from "./useStore";

export function useTheme() {
  const [settings, update] = useSettings();
  const theme = settings.theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  return {
    theme,
    toggleTheme: () => update({ theme: theme === "dark" ? "light" : "dark" }),
    setTheme: (next: "light" | "dark") => update({ theme: next }),
  };
}
