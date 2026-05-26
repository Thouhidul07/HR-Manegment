import { Moon, Sun } from "lucide-react";

export function ThemeToggleInfo() {
  return (
    <div className="fixed bottom-6 right-6 bg-card border border-border rounded-xl shadow-lg p-4 max-w-xs z-50">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <div className="flex gap-1">
            <Sun className="w-4 h-4 text-primary" />
            <Moon className="w-4 h-4 text-primary" />
          </div>
        </div>
        <div>
          <h4 className="text-sm text-foreground mb-1">Theme Switching</h4>
          <p className="text-xs text-muted-foreground">
            Click the theme toggle in the header to switch between light and dark modes. All UI components adapt automatically!
          </p>
        </div>
      </div>
    </div>
  );
}
