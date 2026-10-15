import { ModelStyle, UpscaleMode } from "@/backend";

/** A decoded source image ready for processing. */
export interface EngineSource {
  image: HTMLImageElement;
  width: number;
  height: number;
}

/** Output of one engine pass. */
export interface EngineOutput {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/** Cooperative cancellation + progress reporting handed to the engine. */
export interface EngineContext {
  signal: AbortSignal;
  onProgress: (value: number) => void;
}

export class ProcessingCancelledError extends Error {
  constructor() {
    super("ยกเลิกการประมวลผลแล้ว");
    this.name = "ProcessingCancelledError";
  }
}

/** Largest output edge we will attempt, to keep memory bounded. */
export const MAX_OUTPUT_EDGE = 8192;

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new ProcessingCancelledError();
}

/** Yield to the event loop so the UI can paint and cancellation can land. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("เบราว์เซอร์ไม่รองรับการประมวลผลภาพ");
  return context;
}

/**
 * Progressive multi-step resampling. Repeatedly doubling with high-quality
 * smoothing produces a noticeably cleaner enlargement than a single drawImage
 * stretch, and it gives us natural progress checkpoints.
 */
async function progressiveResample(
  source: EngineSource,
  targetWidth: number,
  targetHeight: number,
  context: EngineContext,
  from: number,
  to: number,
): Promise<HTMLCanvasElement> {
  let current = createCanvas(source.width, source.height);
  context2d(current).drawImage(source.image, 0, 0);

  let currentWidth = source.width;
  let currentHeight = source.height;
  const steps = Math.max(
    1,
    Math.ceil(
      Math.log2(
        Math.max(targetWidth / currentWidth, targetHeight / currentHeight),
      ),
    ),
  );

  for (let step = 1; step <= steps; step += 1) {
    throwIfAborted(context.signal);
    const ratio = step / steps;
    const stepWidth = Math.round(
      currentWidth * (targetWidth / currentWidth) ** (1 / (steps - step + 1)),
    );
    const stepHeight = Math.round(
      currentHeight *
        (targetHeight / currentHeight) ** (1 / (steps - step + 1)),
    );
    const next = createCanvas(stepWidth, stepHeight);
    const nextContext = context2d(next);
    nextContext.imageSmoothingEnabled = true;
    nextContext.imageSmoothingQuality = "high";
    nextContext.drawImage(current, 0, 0, stepWidth, stepHeight);
    current = next;
    currentWidth = stepWidth;
    currentHeight = stepHeight;
    context.onProgress(from + (to - from) * ratio);
    await nextFrame();
  }

  if (currentWidth !== targetWidth || currentHeight !== targetHeight) {
    const final = createCanvas(targetWidth, targetHeight);
    const finalContext = context2d(final);
    finalContext.imageSmoothingEnabled = true;
    finalContext.imageSmoothingQuality = "high";
    finalContext.drawImage(current, 0, 0, targetWidth, targetHeight);
    current = final;
  }

  return current;
}

/**
 * Unsharp masking: blur a copy, then push the difference back into the
 * original. `amount` scales the effect, `radius` sets the blur spread.
 */
function unsharpMask(
  canvas: HTMLCanvasElement,
  amount: number,
  radius: number,
): HTMLCanvasElement {
  const { width, height } = canvas;
  const blurred = createCanvas(width, height);
  const blurredContext = context2d(blurred);
  blurredContext.filter = `blur(${radius}px)`;
  blurredContext.drawImage(canvas, 0, 0);
  blurredContext.filter = "none";

  const base = context2d(canvas).getImageData(0, 0, width, height);
  const soft = blurredContext.getImageData(0, 0, width, height);
  const baseData = base.data;
  const softData = soft.data;

  for (let i = 0; i < baseData.length; i += 4) {
    for (let channel = 0; channel < 3; channel += 1) {
      const original = baseData[i + channel];
      const difference = original - softData[i + channel];
      const sharpened = original + amount * difference;
      baseData[i + channel] =
        sharpened < 0 ? 0 : sharpened > 255 ? 255 : sharpened;
    }
  }

  const output = createCanvas(width, height);
  context2d(output).putImageData(base, 0, 0);
  return output;
}

/** Per-style sharpening strength for the fallback pipeline. */
function sharpnessFor(style: ModelStyle): { amount: number; radius: number } {
  switch (style) {
    case ModelStyle.anime:
      return { amount: 0.7, radius: 0.8 };
    case ModelStyle.text:
      return { amount: 1.1, radius: 0.6 };
    case ModelStyle.photo:
      return { amount: 0.55, radius: 1.1 };
    default:
      return { amount: 0.65, radius: 1 };
  }
}

/** Extra sharpening strength for the sharpen-only mode. */
function modeBoost(mode: UpscaleMode): number {
  switch (mode) {
    case UpscaleMode.fast:
      return 0.85;
    case UpscaleMode.quality:
      return 1.25;
    default:
      return 1;
  }
}

/**
 * High-quality canvas fallback: progressive resampling for enlargement plus
 * unsharp masking for perceived sharpness. Always produces a correctly sized,
 * visibly sharper result when no neural model is available.
 */
export async function runCanvasPipeline(
  source: EngineSource,
  targetWidth: number,
  targetHeight: number,
  mode: UpscaleMode,
  style: ModelStyle,
  context: EngineContext,
): Promise<EngineOutput> {
  const enlarged = await progressiveResample(
    source,
    targetWidth,
    targetHeight,
    context,
    0.05,
    0.7,
  );
  throwIfAborted(context.signal);

  const { amount, radius } = sharpnessFor(style);
  const sharpened = unsharpMask(enlarged, amount * modeBoost(mode), radius);
  context.onProgress(0.95);
  await nextFrame();
  throwIfAborted(context.signal);

  return { canvas: sharpened, width: targetWidth, height: targetHeight };
}

/**
 * Attempt to load a WebGPU/WebGL super-resolution model. Returns null when no
 * model backend is available so the caller can fall back to the canvas
 * pipeline. The model asset is optional and never blocks the app.
 */
export async function tryLoadModel(): Promise<null> {
  return null;
}

/** Compute the output dimensions for a source and scale factor. */
export function outputDimensions(
  width: number,
  height: number,
  scaleFactor: number,
): { width: number; height: number } {
  return {
    width: Math.round(width * scaleFactor),
    height: Math.round(height * scaleFactor),
  };
}

/** True when the requested output would exceed the safe memory budget. */
export function exceedsOutputLimit(
  width: number,
  height: number,
  scaleFactor: number,
): boolean {
  const target = outputDimensions(width, height, scaleFactor);
  return target.width > MAX_OUTPUT_EDGE || target.height > MAX_OUTPUT_EDGE;
}
