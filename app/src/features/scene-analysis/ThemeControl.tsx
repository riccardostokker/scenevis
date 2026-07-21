import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ThemePreference = "system" | "light" | "dark";

const THEMES: ThemePreference[] = ["system", "light", "dark"];
const STORAGE_KEY = "scenevis-theme";

export function useThemePreference(): [ThemePreference, (theme: ThemePreference) => void] {
  const [theme, setTheme] = useState<ThemePreference>(readTheme);

  useEffect(() => {
    const media =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && (media?.matches ?? false));
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    window.localStorage.setItem(STORAGE_KEY, theme);
    media?.addEventListener("change", apply);
    return () => media?.removeEventListener("change", apply);
  }, [theme]);

  return [theme, setTheme];
}

export function ThemeControl({
  value,
  onChange,
}: {
  value: ThemePreference;
  onChange: (theme: ThemePreference) => void;
}) {
  return (
    <div className="theme-control">
      <span className="sr-only">Theme</span>
      <Select value={value} onValueChange={(theme) => onChange(theme as ThemePreference)}>
        <SelectTrigger aria-label="Theme" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {THEMES.map((theme) => (
            <SelectItem value={theme} key={theme}>
              <ThemeIcon theme={theme} />
              {title(theme)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ThemeIcon({ theme }: { theme: ThemePreference }) {
  if (theme === "light") return <Sun aria-hidden="true" />;
  if (theme === "dark") return <Moon aria-hidden="true" />;
  return <Monitor aria-hidden="true" />;
}

function readTheme(): ThemePreference {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return THEMES.includes(stored as ThemePreference) ? (stored as ThemePreference) : "system";
}

function title(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
