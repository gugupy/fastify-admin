import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sun01Icon,
  Moon01Icon,
  ComputerIcon,
} from "@hugeicons/core-free-icons";
import { useTheme } from "../lib/theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5 border p-0.5 bg-background">
      {(
        [
          { value: "light", icon: Sun01Icon },
          { value: "system", icon: ComputerIcon },
          { value: "dark", icon: Moon01Icon },
        ] as const
      ).map(({ value, icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={value}
          className={[
            "p-1 transition-colors",
            theme === value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          <HugeiconsIcon size={12} icon={icon} />
        </button>
      ))}
    </div>
  );
}
