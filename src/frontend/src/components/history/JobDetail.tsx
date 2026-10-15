import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useJob } from "@/hooks/use-jobs";
import {
  formatBytes,
  formatDimensions,
  formatTimestamp,
  modeLabel,
  modelStyleLabel,
} from "@/lib/format";
import type { JobId } from "@/types/jobs";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  Loader2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface JobDetailProps {
  jobId: JobId;
  onBack: () => void;
  onDelete: (jobId: JobId, fileName: string) => void;
}

type DownloadFormat = "png" | "jpg";

function stripExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

/** Re-encode a blob URL into the requested format and trigger a save. */
async function downloadAs(
  sourceUrl: string,
  fileName: string,
  format: DownloadFormat,
): Promise<void> {
  const response = await fetch(sourceUrl);
  const sourceBlob = await response.blob();
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("ไม่สามารถอ่านภาพผลลัพธ์ได้"));
    element.src = URL.createObjectURL(sourceBlob);
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("เบราว์เซอร์ไม่รองรับการบันทึกภาพ");
  if (format === "jpg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0);

  const mime = format === "jpg" ? "image/jpeg" : "image/png";
  const output = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, 0.95),
  );
  if (!output) throw new Error("ไม่สามารถสร้างไฟล์ภาพได้");

  const objectUrl = URL.createObjectURL(output);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${stripExtension(fileName)}-pixellift.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="text-right font-mono text-sm text-foreground">{value}</dd>
    </div>
  );
}

/**
 * Full detail view for a single saved job: the result image on a checkerboard
 * canvas, the job's settings, and a re-download action in PNG or JPG.
 */
export function JobDetail({ jobId, onBack, onDelete }: JobDetailProps) {
  const { data: job, isLoading, isError } = useJob(jobId);
  const [downloading, setDownloading] = useState<DownloadFormat | null>(null);

  const handleDownload = async (format: DownloadFormat) => {
    if (!job) return;
    setDownloading(format);
    try {
      await downloadAs(job.resultBlob.getDirectURL(), job.fileName, format);
      toast.success(`บันทึกไฟล์ ${format.toUpperCase()} แล้ว`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "ดาวน์โหลดไม่สำเร็จ");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div data-ocid="history.detail" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          data-ocid="history.detail_back_button"
          className="rounded-xl text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" />
          กลับไปยังประวัติ
        </Button>
        {job && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onDelete(job.id, job.fileName)}
            data-ocid="history.detail_delete_button"
            className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 aria-hidden="true" />
            ลบรายการนี้
          </Button>
        )}
      </div>

      {isLoading && (
        <div
          data-ocid="history.detail.loading_state"
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      )}

      {isError && (
        <div
          data-ocid="history.detail.error_state"
          className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 px-6 py-16 text-center"
        >
          <AlertTriangle
            className="size-6 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            ไม่สามารถโหลดรายละเอียดงานนี้ได้
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="rounded-xl"
          >
            กลับไปยังประวัติ
          </Button>
        </div>
      )}

      {!isLoading && !isError && !job && (
        <div
          data-ocid="history.detail.empty_state"
          className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center text-sm text-muted-foreground"
        >
          ไม่พบงานนี้ อาจถูกลบไปแล้ว
        </div>
      )}

      {job && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-4">
            <div className="canvas-checkerboard overflow-hidden rounded-2xl border border-border shadow-canvas">
              <img
                src={job.resultBlob.getDirectURL()}
                alt={`ภาพผลลัพธ์ของ ${job.fileName}`}
                className="mx-auto max-h-[70vh] w-full object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => handleDownload("png")}
                disabled={downloading !== null}
                data-ocid="history.download_png_button"
                className="rounded-xl"
              >
                {downloading === "png" ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Download aria-hidden="true" />
                )}
                ดาวน์โหลด PNG
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDownload("jpg")}
                disabled={downloading !== null}
                data-ocid="history.download_jpg_button"
                className="rounded-xl"
              >
                {downloading === "jpg" ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Download aria-hidden="true" />
                )}
                ดาวน์โหลด JPG
              </Button>
            </div>
          </div>

          <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-subtle">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                ไฟล์
              </p>
              <h2
                className="mt-1 break-words font-display text-lg font-bold tracking-tight text-foreground"
                title={job.fileName}
              >
                {job.fileName}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatTimestamp(job.createdAt)}
              </p>
            </div>

            <dl className="flex flex-col">
              <DetailRow label="โหมด" value={modeLabel(job.mode)} />
              <DetailRow
                label="อัตราขยาย"
                value={`×${job.scaleFactor.toString()}`}
              />
              <DetailRow
                label="สไตล์โมเดล"
                value={modelStyleLabel(job.modelStyle)}
              />
              <DetailRow
                label="ขนาดต้นฉบับ"
                value={`${formatDimensions(job.originalWidth, job.originalHeight)} px`}
              />
              <DetailRow
                label="ขนาดผลลัพธ์"
                value={`${formatDimensions(job.resultWidth, job.resultHeight)} px`}
              />
              <DetailRow
                label="ขนาดไฟล์ต้นฉบับ"
                value={formatBytes(job.originalByteSize)}
              />
              <DetailRow
                label="ขนาดไฟล์ผลลัพธ์"
                value={formatBytes(job.resultByteSize)}
              />
            </dl>
          </aside>
        </div>
      )}
    </div>
  );
}
