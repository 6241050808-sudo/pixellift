import type { ExternalBlob } from "@caffeineai/object-storage";

export type { ExternalBlob };

/** Backend enum values — re-exported as values so pages can switch on them. */
export { ModelStyle, UpscaleMode } from "@/backend";

export type JobId = bigint;
export type Timestamp = bigint;

/** A completed upscaling job as stored by the backend. */
export interface Job {
  id: JobId;
  fileName: string;
  mode: import("@/backend").UpscaleMode;
  scaleFactor: bigint;
  modelStyle: import("@/backend").ModelStyle;
  originalWidth: bigint;
  originalHeight: bigint;
  resultWidth: bigint;
  resultHeight: bigint;
  originalByteSize: bigint;
  resultByteSize: bigint;
  createdAt: Timestamp;
  resultBlob: ExternalBlob;
  thumbnailBlob: ExternalBlob;
}

/** Lightweight job record used in the History list. */
export interface JobSummary {
  id: JobId;
  fileName: string;
  mode: import("@/backend").UpscaleMode;
  scaleFactor: bigint;
  modelStyle: import("@/backend").ModelStyle;
  resultWidth: bigint;
  resultHeight: bigint;
  createdAt: Timestamp;
  thumbnailBlob: ExternalBlob;
}

/** Payload for persisting a finished job. */
export interface CreateJobInput {
  fileName: string;
  mode: import("@/backend").UpscaleMode;
  scaleFactor: bigint;
  modelStyle: import("@/backend").ModelStyle;
  originalWidth: bigint;
  originalHeight: bigint;
  resultWidth: bigint;
  resultHeight: bigint;
  originalByteSize: bigint;
  resultByteSize: bigint;
  resultBlob: ExternalBlob;
  thumbnailBlob: ExternalBlob;
}
