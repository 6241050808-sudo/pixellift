import { ImportDropzone } from "@/components/studio/ImportDropzone";
import { ProgressBar } from "@/components/studio/ProgressBar";
import { ResultCanvas } from "@/components/studio/ResultCanvas";
import { SettingsPanel } from "@/components/studio/SettingsPanel";
import { Button } from "@/components/ui/button";
import { useUpscaler } from "@/hooks/use-upscaler";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Studio workspace: import zone, settings panel, and result canvas.
 *
 * All processing runs in the browser — the image never leaves the device.
 */
export function StudioPage() {
  const {
    source,
    result,
    settings,
    isProcessing,
    progress,
    error,
    loadFile,
    reset,
    updateSettings,
    process,
    cancel,
    saveToHistory,
    isSaving,
    isSaved,
    saveError,
  } = useUpscaler();
  const { isAuthenticated } = useInternetIdentity();

  return (
    <div
      data-ocid="studio.page"
      className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
    >
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          สตูดิโอเพิ่มความละเอียด
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          ยกระดับภาพของคุณให้คมชัดขึ้น
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          เพิ่มความละเอียดและความคมชัดด้วยโมเดล AI ที่ทำงานในเบราว์เซอร์ของคุณเอง
          ภาพจะไม่ถูกส่งออกจากอุปกรณ์
        </p>
      </header>

      {error ? (
        <div
          data-ocid="studio.error_state"
          role="alert"
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 size-5 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void process()}
            disabled={!source || isProcessing}
            data-ocid="studio.retry_button"
            className="shrink-0 rounded-xl"
          >
            <RotateCcw aria-hidden="true" />
            ลองใหม่
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <ImportDropzone
            source={source}
            disabled={isProcessing}
            onSelect={(file) => void loadFile(file)}
            onClear={reset}
          />

          {isProcessing ? (
            <ProgressBar progress={progress} onCancel={cancel} />
          ) : null}

          <ResultCanvas
            source={source}
            result={result}
            isProcessing={isProcessing}
            isAuthenticated={isAuthenticated}
            isSaving={isSaving}
            isSaved={isSaved}
            saveError={saveError}
            onSave={() => void saveToHistory()}
          />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <SettingsPanel
            source={source}
            settings={settings}
            isProcessing={isProcessing}
            onChange={updateSettings}
            onProcess={() => void process()}
          />
        </aside>
      </div>
    </div>
  );
}
