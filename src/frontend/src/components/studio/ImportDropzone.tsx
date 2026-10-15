import { Button } from "@/components/ui/button";
import type { SourceImage } from "@/hooks/use-upscaler";
import { formatBytes, formatDimensions } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FileImage, ImageUp, RefreshCw, X } from "lucide-react";
import { useRef, useState } from "react";

const ACCEPT = "image/png,image/jpeg,image/webp";

interface ImportDropzoneProps {
  source: SourceImage | null;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
}

/** Import zone: drag-and-drop or file picker with an immediate preview. */
export function ImportDropzone({
  source,
  disabled,
  onSelect,
  onClear,
}: ImportDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onSelect(file);
  };

  return (
    <section
      data-ocid="studio.import_panel"
      aria-labelledby="import-heading"
      className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ImageUp className="size-4 text-primary" aria-hidden="true" />
          <h2
            id="import-heading"
            className="font-display text-sm font-semibold tracking-wide text-foreground"
          >
            นำเข้าภาพ
          </h2>
        </div>
        {source ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={disabled}
            data-ocid="studio.clear_button"
            className="rounded-xl text-muted-foreground"
          >
            <X aria-hidden="true" />
            ล้าง
          </Button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        data-ocid="studio.file_input"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {source ? (
        <div className="flex flex-col gap-4">
          <div className="canvas-checkerboard-sm relative overflow-hidden rounded-xl border border-border">
            <img
              src={source.url}
              alt={`ภาพต้นฉบับ ${source.file.name}`}
              className="mx-auto max-h-72 w-auto object-contain"
            />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                ขนาดพิกเซล
              </dt>
              <dd className="mt-0.5 truncate font-mono text-foreground">
                {formatDimensions(BigInt(source.width), BigInt(source.height))}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                ขนาดไฟล์
              </dt>
              <dd className="mt-0.5 truncate font-mono text-foreground">
                {formatBytes(BigInt(source.byteSize))}
              </dd>
            </div>
            <div className="col-span-2 min-w-0 sm:col-span-1">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                ประเภทไฟล์
              </dt>
              <dd className="mt-0.5 truncate font-mono text-foreground">
                {source.file.type.replace("image/", "").toUpperCase()}
              </dd>
            </div>
          </dl>
          <Button
            type="button"
            variant="outline"
            onClick={openPicker}
            disabled={disabled}
            data-ocid="studio.replace_button"
            className="rounded-xl"
          >
            <RefreshCw aria-hidden="true" />
            เปลี่ยนภาพ
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          data-ocid="studio.dropzone"
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            if (!disabled) handleFiles(event.dataTransfer.files);
          }}
          className={cn(
            "canvas-checkerboard-sm flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center outline-none transition-smooth",
            "focus-visible:ring-2 focus-visible:ring-ring",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/60",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-primary">
            <FileImage className="size-6" aria-hidden="true" />
          </span>
          <span className="font-display text-base font-semibold text-foreground">
            ลากภาพมาวางที่นี่
          </span>
          <span className="text-sm text-muted-foreground">
            หรือคลิกเพื่อเลือกไฟล์ — รองรับ PNG, JPG และ WebP
          </span>
          <span className="mt-1 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
            ประมวลผลในเบราว์เซอร์ ภาพไม่ออกจากอุปกรณ์
          </span>
        </button>
      )}
    </section>
  );
}
