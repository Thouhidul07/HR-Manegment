import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";
type ThemePreference = Theme | "system";

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: Theme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const savedTheme = localStorage.getItem("hrms-theme");
    return (savedTheme as ThemePreference) || "light";
  });
  const [resolvedTheme, setResolvedTheme] = useState<Theme>("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const root = document.documentElement;

    const applyTheme = () => {
      const nextResolvedTheme = theme === "system"
        ? mediaQuery.matches ? "dark" : "light"
        : theme;

      root.classList.toggle("dark", nextResolvedTheme === "dark");
      root.dataset.theme = theme;
      root.dataset.bsTheme = nextResolvedTheme;
      root.style.colorScheme = nextResolvedTheme;
      setResolvedTheme(nextResolvedTheme);
      localStorage.setItem("hrms-theme", theme);
    };

    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);

    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const effectiveTheme = prev === "system" ? resolvedTheme : prev;
      return effectiveTheme === "light" ? "dark" : "light";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
