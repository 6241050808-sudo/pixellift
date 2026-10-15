import { ModelStyle, UpscaleMode } from "@/backend";
import { Button } from "@/components/ui/button";
import type { SourceImage, UpscaleSettings } from "@/hooks/use-upscaler";
import { formatDimensions } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Image as ImageIcon,
  Maximize2,
  Palette,
  ScanLine,
  Sparkles,
  Type,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SettingsPanelProps {
  source: SourceImage | null;
  settings: UpscaleSettings;
  isProcessing: boolean;
  onChange: (patch: Partial<UpscaleSettings>) => void;
  onProcess: () => void;
}

interface ModeOption {
  value: UpscaleMode;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface StyleOption {
  value: ModelStyle;
  label: string;
  description: string;
  icon: LucideIcon;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    value: UpscaleMode.quality,
    label: "เพิ่มความละเอียด",
    description: "ขยายขนาดภาพให้ใหญ่ขึ้น",
    icon: Maximize2,
  },
  {
    value: UpscaleMode.balanced,
    label: "เพิ่มความคมชัดเท่าเดิม",
    description: "ปรับความคมชัดโดยไม่เปลี่ยนขนาด",
    icon: Wand2,
  },
];

const STYLE_OPTIONS: StyleOption[] = [
  {
    value: ModelStyle.photo,
    label: "ภาพถ่ายทั่วไป",
    description: "ภาพถ่ายบุคคล วิว หรือสินค้า",
    icon: ImageIcon,
  },
  {
    value: ModelStyle.anime,
    label: "ภาพวาด-การ์ตูน",
    description: "ภาพวาด อนิเมะ หรือภาพประกอบ",
    icon: Palette,
  },
  {
    value: ModelStyle.text,
    label: "ตัวอักษรและกราฟิก",
    description: "ภาพที่มีข้อความ โลโก้ หรือกราฟิก",
    icon: Type,
  },
];

const SCALE_OPTIONS = [2, 4] as const;

/** Settings zone: mode, scale factor, and model style with a live preview. */
export function SettingsPanel({
  source,
  settings,
  isProcessing,
  onChange,
  onProcess,
}: SettingsPanelProps) {
  const isEnlarge = settings.mode === UpscaleMode.quality;
  const effectiveScale = isEnlarge ? settings.scaleFactor : 1;
  const targetWidth = source ? Math.round(source.width * effectiveScale) : 0;
  const targetHeight = source ? Math.round(source.height * effectiveScale) : 0;

  return (
    <section
      data-ocid="studio.settings_panel"
      aria-labelledby="settings-heading"
      className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-4 shadow-subtle sm:p-6"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" aria-hidden="true" />
        <h2
          id="settings-heading"
          className="font-display text-sm font-semibold tracking-wide text-foreground"
        >
          ตั้งค่าการประมวลผล
        </h2>
      </div>

      <fieldset className="flex flex-col gap-3" disabled={isProcessing}>
        <legend className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          โหมดประมวลผล
        </legend>
        <div className="grid gap-2">
          {MODE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = settings.mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ mode: option.value })}
                aria-pressed={active}
                data-ocid={`studio.mode.${option.value}`}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-left outline-none transition-smooth focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/30 hover:border-primary/50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {option.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset
        className={cn(
          "flex flex-col gap-3 transition-smooth",
          !isEnlarge && "opacity-50",
        )}
        disabled={isProcessing || !isEnlarge}
      >
        <legend className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          อัตราการขยาย
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {SCALE_OPTIONS.map((scale) => {
            const active = settings.scaleFactor === scale;
            return (
              <button
                key={scale}
                type="button"
                onClick={() => onChange({ scaleFactor: scale })}
                aria-pressed={active}
                data-ocid={`studio.scale.${scale}x`}
                className={cn(
                  "rounded-xl border px-3 py-2.5 font-display text-sm font-semibold outline-none transition-smooth focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50",
                )}
              >
                {scale}x
              </button>
            );
          })}
        </div>
        {!isEnlarge ? (
          <p className="text-xs text-muted-foreground">
            โหมดเพิ่มความคมชัดเท่าเดิมจะคงขนาดภาพไว้ที่ 1x
          </p>
        ) : null}
      </fieldset>

      <fieldset className="flex flex-col gap-3" disabled={isProcessing}>
        <legend className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          สไตล์โมเดล
        </legend>
        <div className="grid gap-2">
          {STYLE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = settings.modelStyle === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ modelStyle: option.value })}
                aria-pressed={active}
                data-ocid={`studio.style.${option.value}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left outline-none transition-smooth focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/30 hover:border-primary/50",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {option.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <ScanLine className="size-3.5" aria-hidden="true" />
          ขนาดผลลัพธ์ที่คาดไว้
        </div>
        <p
          data-ocid="studio.expected_dimensions"
          className="mt-1.5 font-mono text-sm text-foreground"
        >
          {source
            ? formatDimensions(BigInt(targetWidth), BigInt(targetHeight))
            : "— × —"}
        </p>
      </div>

      <Button
        type="button"
        onClick={onProcess}
        disabled={!source || isProcessing}
        data-ocid="studio.process_button"
        className="w-full rounded-xl"
      >
        <Sparkles aria-hidden="true" />
        {isProcessing ? "กำลังประมวลผล…" : "เริ่มเพิ่มความละเอียด"}
      </Button>
    </section>
  );
}
