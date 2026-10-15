import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDimensions, formatTimestamp, modeLabel } from "@/lib/format";
import type { JobSummary } from "@/types/jobs";
import { Maximize2, Trash2 } from "lucide-react";

interface JobCardProps {
  job: JobSummary;
  index: number;
  onOpen: (job: JobSummary) => void;
  onDelete: (job: JobSummary) => void;
}

/**
 * One history entry: result thumbnail on a checkerboard canvas, file name,
 * mode / scale / date metadata, and open + delete actions.
 */
export function JobCard({ job, index, onOpen, onDelete }: JobCardProps) {
  const thumbnailUrl = job.thumbnailBlob.getDirectURL();

  return (
    <article
      data-ocid={`history.item.${index}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-subtle transition-smooth hover:border-primary/40 hover:shadow-elevated"
    >
      <button
        type="button"
        onClick={() => onOpen(job)}
        data-ocid={`history.open_button.${index}`}
        aria-label={`ดูรายละเอียดงาน ${job.fileName}`}
        className="canvas-checkerboard-sm relative block aspect-[4/3] w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <img
          src={thumbnailUrl}
          alt={`ภาพย่อผลลัพธ์ของ ${job.fileName}`}
          loading="lazy"
          className="size-full object-contain transition-smooth group-hover:scale-[1.02]"
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/0 opacity-0 transition-smooth group-hover:bg-background/40 group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            <Maximize2 className="size-3.5" aria-hidden="true" />
            ดูรายละเอียด
          </span>
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3
            className="truncate font-display text-sm font-semibold text-foreground"
            title={job.fileName}
          >
            {job.fileName}
          </h3>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {formatDimensions(job.resultWidth, job.resultHeight)} px
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="secondary"
            className="rounded-full border-transparent bg-muted text-muted-foreground"
          >
            {modeLabel(job.mode)}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full border-primary/40 font-mono text-primary"
          >
            ×{job.scaleFactor.toString()}
          </Badge>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          <time
            dateTime={new Date(Number(job.createdAt)).toISOString()}
            className="truncate text-xs text-muted-foreground"
          >
            {formatTimestamp(job.createdAt)}
          </time>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(job)}
            data-ocid={`history.delete_button.${index}`}
            aria-label={`ลบงาน ${job.fileName}`}
            className="size-8 shrink-0 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
}
