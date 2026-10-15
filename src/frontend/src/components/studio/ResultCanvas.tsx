import { CompareSlider } from "@/components/studio/CompareSlider";
import { Button } from "@/components/ui/button";
import type { SourceImage, UpscaleResult } from "@/hooks/use-upscaler";
import { formatBytes, formatDimensions } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Check,
  Download,
  History,
  Loader2,
  Maximize,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

type ViewMode = "compare" | "original" | "result";

interface ResultCanvasProps {
  source: SourceImage | null;
  result: UpscaleResult | null;
  isProcessing: boolean;
  isAuthenticated: boolean;
  isSaving: boolean;
  isSaved: boolean;
  saveError: string | null;
  onSave: () => void;
}

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "compare", label: "เทียบ" },
  { value: "original", label: "ต้นฉบับ" },
  { value: "result", label: "ผลลัพธ์" },
];

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

/** Result zone: comparison, zoom/pan inspection, readout, and export. */
export function ResultCanvas({
  source,
  result,
  isProcessing,
  isAuthenticated,
  isSaving,
  isSaved,
  saveError,
  onSave,
}: ResultCanvasProps) {
  const [view, setView] = useState<ViewMode>("compare");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const panRef = useRef<{ x: number; y: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const resultUrl = result?.url ?? null;
  const [lastResultUrl, setLastResultUrl] = useState<string | null>(resultUrl);

  // Reset the inspection view whenever a new result arrives.
  if (resultUrl !== lastResultUrl) {
    setLastResultUrl(resultUrl);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setView("compare");
  }

  const clampOffset = useCallback(
    (next: { x: number; y: number }, currentZoom: number) => {
      const viewport = viewportRef.current;
      if (!viewport || currentZoom <= 1) return { x: 0, y: 0 };
      const maxX = (viewport.clientWidth * (currentZoom - 1)) / 2;
      const maxY = (viewport.clientHeight * (currentZoom - 1)) / 2;
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [],
  );

  const applyZoom = useCallback(
    (next: number) => {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
      setZoom(clamped);
      setOffset((current) => clampOffset(current, clamped));
    },
    [clampOffset],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      x: event.clientX - offset.x,
      y: event.clientY - offset.y,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!panRef.current || zoom <= 1) return;
    const next = {
      x: event.clientX - panRef.current.x,
      y: event.clientY - panRef.current.y,
    };
    setOffset(clampOffset(next, zoom));
  };

  const handlePointerUp = () => {
    panRef.current = null;
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    applyZoom(zoom - event.deltaY * 0.002);
  };

  const scaleLabel = source
    ? `${Math.round((result?.width ?? source.width) / source.width)}x`
    : "1x";

  const handleDownload = (type: "image/png" | "image/jpeg") => {
    if (!result || !source) return;
    const extension = type === "image/png" ? "png" : "jpg";
    const fileName = `${baseName(source.file.name)}-${scaleLabel}.${extension}`;
    if (result.blob.type === type) {
      downloadBlob(result.blob, fileName);
      return;
    }
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = result.width;
      canvas.height = result.height;
      const context = canvas.getContext("2d");
      if (!context) return;
      if (type === "image/jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) downloadBlob(blob, fileName);
        },
        type,
        type === "image/jpeg" ? 0.92 : undefined,
      );
    };
    image.src = result.url;
  };

  const showZoomControls = view !== "compare" && result;

  return (
    <section
      data-ocid="studio.result_panel"
      aria-labelledby="result-heading"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Maximize className="size-4 text-primary" aria-hidden="true" />
          <h2
            id="result-heading"
            className="font-display text-sm font-semibold tracking-wide text-foreground"
          >
            ผลลัพธ์
          </h2>
        </div>

        {result ? (
          <div
            role="tablist"
            aria-label="มุมมองผลลัพธ์"
            className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1"
          >
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={view === option.value}
                onClick={() => setView(option.value)}
                data-ocid={`studio.view.${option.value}`}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium outline-none transition-smooth focus-visible:ring-2 focus-visible:ring-ring",
                  view === option.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {!source ? (
        <div
          data-ocid="studio.result_empty_state"
          className="canvas-checkerboard flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border border-border px-6 py-12 text-center"
        >
          <p className="font-display text-base font-semibold text-foreground">
            ยังไม่มีภาพในสตูดิโอ
          </p>
          <p className="text-sm text-muted-foreground">
            นำเข้าภาพเพื่อเริ่มเพิ่มความละเอียด
          </p>
        </div>
      ) : isProcessing ? (
        <div
          data-ocid="studio.result_processing_state"
          className="canvas-checkerboard relative flex min-h-64 items-center justify-center overflow-hidden rounded-xl border border-border"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-scan-line bg-gradient-to-b from-primary/25 to-transparent" />
          <p className="animate-pulse-soft font-display text-sm font-medium text-foreground">
            กำลังประมวลผลภาพ…
          </p>
        </div>
      ) : !result ? (
        <div
          data-ocid="studio.result_ready_state"
          className="canvas-checkerboard-sm flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-border px-6 py-12 text-center"
        >
          <img
            src={source.url}
            alt={`ภาพต้นฉบับ ${source.file.name}`}
            className="max-h-56 w-auto rounded-lg object-contain"
          />
          <p className="text-sm text-muted-foreground">
            พร้อมประมวลผล — กด “เริ่มเพิ่มความละเอียด” เพื่อดูผลลัพธ์
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {view === "compare" ? (
            <CompareSlider
              beforeUrl={source.url}
              afterUrl={result.url}
              beforeAlt={`ภาพต้นฉบับ ${source.file.name}`}
              afterAlt={`ภาพผลลัพธ์ ${source.file.name}`}
            />
          ) : (
            <div
              ref={viewportRef}
              data-ocid="studio.zoom_viewport"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onWheel={handleWheel}
              className={cn(
                "canvas-checkerboard relative flex max-h-[70vh] min-h-64 items-center justify-center overflow-hidden rounded-xl border border-border",
                zoom > 1
                  ? "cursor-grab active:cursor-grabbing"
                  : "cursor-default",
              )}
            >
              <img
                src={view === "original" ? source.url : result.url}
                alt={
                  view === "original"
                    ? `ภาพต้นฉบับ ${source.file.name}`
                    : `ภาพผลลัพธ์ ${source.file.name}`
                }
                draggable={false}
                className="max-h-[70vh] w-auto select-none object-contain"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transition: panRef.current
                    ? "none"
                    : "transform 0.15s ease-out",
                }}
              />
            </div>
          )}

          {showZoomControls ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => applyZoom(zoom - 0.5)}
                  disabled={zoom <= MIN_ZOOM}
                  aria-label="ซูมออก"
                  data-ocid="studio.zoom_out_button"
                  className="size-8 rounded-lg"
                >
                  <Minus aria-hidden="true" />
                </Button>
                <span className="min-w-14 text-center font-mono text-sm text-foreground">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => applyZoom(zoom + 0.5)}
                  disabled={zoom >= MAX_ZOOM}
                  aria-label="ซูมเข้า"
                  data-ocid="studio.zoom_in_button"
                  className="size-8 rounded-lg"
                >
                  <Plus aria-hidden="true" />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                }}
                disabled={zoom === 1 && offset.x === 0 && offset.y === 0}
                data-ocid="studio.zoom_reset_button"
                className="rounded-xl text-muted-foreground"
              >
                <RotateCcw aria-hidden="true" />
                รีเซ็ตมุมมอง
              </Button>
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm sm:grid-cols-4">
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                ก่อน
              </dt>
              <dd className="mt-0.5 truncate font-mono text-foreground">
                {formatDimensions(BigInt(source.width), BigInt(source.height))}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                หลัง
              </dt>
              <dd className="mt-0.5 truncate font-mono text-primary">
                {formatDimensions(BigInt(result.width), BigInt(result.height))}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                ขนาดไฟล์ก่อน
              </dt>
              <dd className="mt-0.5 truncate font-mono text-foreground">
                {formatBytes(BigInt(source.byteSize))}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                ขนาดไฟล์หลัง
              </dt>
              <dd className="mt-0.5 truncate font-mono text-foreground">
                {formatBytes(BigInt(result.byteSize))}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 gap-2">
              <Button
                type="button"
                onClick={() => handleDownload("image/png")}
                data-ocid="studio.download_png_button"
                className="flex-1 rounded-xl"
              >
                <Download aria-hidden="true" />
                ดาวน์โหลด PNG
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDownload("image/jpeg")}
                data-ocid="studio.download_jpg_button"
                className="flex-1 rounded-xl"
              >
                <Download aria-hidden="true" />
                ดาวน์โหลด JPG
              </Button>
            </div>

            {isAuthenticated ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onSave}
                disabled={isSaving || isSaved}
                data-ocid="studio.save_history_button"
                className="rounded-xl sm:w-auto"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : isSaved ? (
                  <Check aria-hidden="true" />
                ) : (
                  <History aria-hidden="true" />
                )}
                {isSaving ? "กำลังบันทึก…" : isSaved ? "บันทึกแล้ว" : "บันทึกในประวัติ"}
              </Button>
            ) : null}
          </div>

          {saveError ? (
            <p
              data-ocid="studio.save_error_state"
              className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {saveError}
            </p>
          ) : null}

          {!isAuthenticated ? (
            <p className="text-xs text-muted-foreground">
              เข้าสู่ระบบเพื่อบันทึกงานไว้ในประวัติ —
              การประมวลผลและดาวน์โหลดใช้ได้โดยไม่ต้องเข้าสู่ระบบ
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
