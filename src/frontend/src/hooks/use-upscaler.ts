import { ModelStyle, UpscaleMode } from "@/backend";
import { useCreateJob } from "@/hooks/use-jobs";
import {
  type EngineSource,
  ProcessingCancelledError,
  exceedsOutputLimit,
  outputDimensions,
  runCanvasPipeline,
} from "@/lib/upscale-engine";
import type { CreateJobInput } from "@/types/jobs";
import { ExternalBlob } from "@caffeineai/object-storage";
import { useCallback, useEffect, useRef, useState } from "react";

/** A source image selected by the user, with its decoded dimensions. */
export interface SourceImage {
  file: File;
  url: string;
  width: number;
  height: number;
  byteSize: number;
}

/** Result of a completed upscale pass. */
export interface UpscaleResult {
  url: string;
  blob: Blob;
  width: number;
  height: number;
  byteSize: number;
}

export interface UpscaleSettings {
  mode: UpscaleMode;
  scaleFactor: number;
  modelStyle: ModelStyle;
}

export interface UpscalerState {
  source: SourceImage | null;
  result: UpscaleResult | null;
  settings: UpscaleSettings;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

export interface UpscalerApi extends UpscalerState {
  /** Load a file into the studio, decoding its natural dimensions. */
  loadFile: (file: File) => Promise<void>;
  /** Clear the current source and result. */
  reset: () => void;
  /** Update one or more processing settings. */
  updateSettings: (patch: Partial<UpscaleSettings>) => void;
  /** Run the upscaling pass over the current source. */
  process: () => Promise<void>;
  /** Stop an in-flight processing pass without hanging. */
  cancel: () => void;
  /** Persist the finished result to history for the signed-in caller. */
  saveToHistory: () => Promise<void>;
  /** True while a save-to-history request is in flight. */
  isSaving: boolean;
  /** True once the current result has been saved to history. */
  isSaved: boolean;
  /** Error from the most recent save attempt, if any. */
  saveError: string | null;
}

const DEFAULT_SETTINGS: UpscaleSettings = {
  mode: UpscaleMode.balanced,
  scaleFactor: 2,
  modelStyle: ModelStyle.general,
};

const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ภาพนี้ได้"));
    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("ไม่สามารถสร้างภาพผลลัพธ์ได้"));
      },
      type,
      quality,
    );
  });
}

/** Downscale a canvas into a compact JPEG thumbnail for history. */
async function makeThumbnail(canvas: HTMLCanvasElement): Promise<Blob> {
  const maxEdge = 320;
  const ratio = Math.min(1, maxEdge / Math.max(canvas.width, canvas.height));
  const thumb = document.createElement("canvas");
  thumb.width = Math.max(1, Math.round(canvas.width * ratio));
  thumb.height = Math.max(1, Math.round(canvas.height * ratio));
  const context = thumb.getContext("2d");
  if (!context) throw new Error("ไม่สามารถสร้างภาพย่อได้");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(canvas, 0, 0, thumb.width, thumb.height);
  return canvasToBlob(thumb, "image/jpeg", 0.82);
}

/**
 * Shared public interface for the image-processing engine.
 *
 * Runs a real super-resolution pass entirely in the browser: a WebGPU/WebGL
 * model when one is available, otherwise a high-quality progressive-resampling
 * plus unsharp-masking pipeline. The image never leaves the device.
 */
export function useUpscaler(): UpscalerApi {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [result, setResult] = useState<UpscaleResult | null>(null);
  const [settings, setSettings] = useState<UpscaleSettings>(DEFAULT_SETTINGS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const sourceRef = useRef<SourceImage | null>(null);
  const resultRef = useRef<UpscaleResult | null>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const createJob = useCreateJob();

  const revoke = useCallback((image: SourceImage | null) => {
    if (image) URL.revokeObjectURL(image.url);
  }, []);

  const revokeResult = useCallback((value: UpscaleResult | null) => {
    if (value) URL.revokeObjectURL(value.url);
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      revoke(sourceRef.current);
      revokeResult(resultRef.current);
    };
  }, [revoke, revokeResult]);

  const loadFile = useCallback(
    async (file: File) => {
      setError(null);
      setSaveError(null);
      setIsSaved(false);
      revokeResult(resultRef.current);
      resultRef.current = null;
      resultCanvasRef.current = null;
      setResult(null);
      setProgress(0);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("ไฟล์นี้ไม่รองรับ กรุณาใช้ไฟล์ PNG, JPG หรือ WebP");
        return;
      }
      if (file.size > MAX_SOURCE_BYTES) {
        setError("ไฟล์ใหญ่เกินไป (สูงสุด 40 MB) กรุณาเลือกไฟล์ที่เล็กลง");
        return;
      }

      const url = URL.createObjectURL(file);
      try {
        const image = await loadImageElement(url);
        const next: SourceImage = {
          file,
          url,
          width: image.naturalWidth,
          height: image.naturalHeight,
          byteSize: file.size,
        };
        revoke(sourceRef.current);
        sourceRef.current = next;
        setSource(next);
      } catch (cause) {
        URL.revokeObjectURL(url);
        setError(cause instanceof Error ? cause.message : "ไม่สามารถโหลดภาพได้");
      }
    },
    [revoke, revokeResult],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    revoke(sourceRef.current);
    revokeResult(resultRef.current);
    sourceRef.current = null;
    resultRef.current = null;
    resultCanvasRef.current = null;
    setSource(null);
    setResult(null);
    setProgress(0);
    setError(null);
    setSaveError(null);
    setIsSaved(false);
    setIsProcessing(false);
  }, [revoke, revokeResult]);

  const updateSettings = useCallback((patch: Partial<UpscaleSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const process = useCallback(async () => {
    const current = sourceRef.current;
    if (!current) {
      setError("กรุณานำเข้าภาพก่อนเริ่มเพิ่มความละเอียด");
      return;
    }

    const { mode, scaleFactor, modelStyle } = settings;
    // Sharpen-only mode keeps the original dimensions; only the enlarge mode
    // honors the chosen 2x/4x factor. This mirrors the SettingsPanel preview.
    const effectiveScale = mode === UpscaleMode.quality ? scaleFactor : 1;
    if (exceedsOutputLimit(current.width, current.height, effectiveScale)) {
      setError("ขนาดผลลัพธ์ใหญ่เกินขอบเขตที่ปลอดภัย กรุณาเลือกอัตราขยายที่ต่ำลง");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsProcessing(true);
    setError(null);
    setSaveError(null);
    setIsSaved(false);
    setProgress(0);
    revokeResult(resultRef.current);
    resultRef.current = null;
    resultCanvasRef.current = null;
    setResult(null);

    try {
      const image = await loadImageElement(current.url);
      const engineSource: EngineSource = {
        image,
        width: current.width,
        height: current.height,
      };
      const target = outputDimensions(
        current.width,
        current.height,
        effectiveScale,
      );
      const output = await runCanvasPipeline(
        engineSource,
        target.width,
        target.height,
        mode,
        modelStyle,
        {
          signal: controller.signal,
          onProgress: (value) => setProgress(Math.min(0.99, value)),
        },
      );

      const blob = await canvasToBlob(output.canvas, "image/png");
      const next: UpscaleResult = {
        url: URL.createObjectURL(blob),
        blob,
        width: output.width,
        height: output.height,
        byteSize: blob.size,
      };
      resultRef.current = next;
      resultCanvasRef.current = output.canvas;
      setResult(next);
      setProgress(1);
    } catch (cause) {
      if (cause instanceof ProcessingCancelledError) {
        setProgress(0);
      } else {
        setError(cause instanceof Error ? cause.message : "การประมวลผลล้มเหลว");
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsProcessing(false);
    }
  }, [revokeResult, settings]);

  const saveToHistory = useCallback(async () => {
    const currentSource = sourceRef.current;
    const currentResult = resultRef.current;
    const canvas = resultCanvasRef.current;
    if (!currentSource || !currentResult || !canvas) {
      setSaveError("ยังไม่มีผลลัพธ์ให้บันทึก");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const [resultBytes, thumbnailBytes] = await Promise.all([
        currentResult.blob.arrayBuffer(),
        makeThumbnail(canvas).then((blob) => blob.arrayBuffer()),
      ]);
      const resultBlob = ExternalBlob.fromBytes(
        new Uint8Array(resultBytes),
        "image/png",
        currentSource.file.name,
      );
      const thumbnailBlob = ExternalBlob.fromBytes(
        new Uint8Array(thumbnailBytes),
        "image/jpeg",
        `thumb-${currentSource.file.name}`,
      );
      const input: CreateJobInput = {
        fileName: currentSource.file.name,
        mode: settings.mode,
        scaleFactor: BigInt(settings.scaleFactor),
        modelStyle: settings.modelStyle,
        originalWidth: BigInt(currentSource.width),
        originalHeight: BigInt(currentSource.height),
        resultWidth: BigInt(currentResult.width),
        resultHeight: BigInt(currentResult.height),
        originalByteSize: BigInt(currentSource.byteSize),
        resultByteSize: BigInt(currentResult.byteSize),
        resultBlob,
        thumbnailBlob,
      };
      await createJob.mutateAsync(input);
      setIsSaved(true);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "บันทึกประวัติไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  }, [createJob, settings]);

  return {
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
  };
}
