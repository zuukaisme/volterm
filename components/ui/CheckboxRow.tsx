import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CheckboxRowProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
  swatchColor?: string;
};

export function CheckboxRow({
  label,
  description,
  swatchColor,
  className,
  ...props
}: CheckboxRowProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-raised/60",
        className
      )}
    >
      <span className="flex items-center gap-2.5">
        {swatchColor ? (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: swatchColor }}
          />
        ) : null}
        <span className="text-sm text-foreground">{label}</span>
        {description ? (
          <span className="text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
      <input
        type="checkbox"
        className="h-4 w-4 shrink-0 rounded border-border bg-surface accent-accent"
        {...props}
      />
    </label>
  );
}
