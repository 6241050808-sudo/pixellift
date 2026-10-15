import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, X } from "lucide-react";

interface ProgressBarProps {
  progress: number;
  onCancel: () => void;
  className?: string;
}

/** Determinate progress bar with a working cancel action. */
export function ProgressBar({
  progress,
  onCancel,
  className,
}: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <output
      data-ocid="studio.progress"
      aria-live="polite"
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Loader2
            className="size-4 animate-spin text-primary"
            aria-hidden="true"
          />
          <span className="animate-pulse-soft">กำลังเพิ่มความละเอียด…</span>
        </span>
        <span className="font-mono text-sm text-muted-foreground">
          {percent}%
        </span>
      </div>

      <progress
        value={percent}
        max={100}
        aria-label="ความคืบหน้าการประมวลผล"
        className="h-2 w-full overflow-hidden rounded-full bg-secondary [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-secondary [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCancel}
        data-ocid="studio.cancel_button"
        className="self-start rounded-xl"
      >
        <X aria-hidden="true" />
        ยกเลิกงาน
      </Button>
    </output>
  );
}
