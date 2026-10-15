import { ModelStyle, UpscaleMode } from "@/backend";
import type { Job, JobSummary } from "@/types/jobs";
import type { ExternalBlob } from "@caffeineai/object-storage";

/**
 * Test-only fixtures and typed actor mocks for the frontend suite.
 *
 * These mirror the shapes the generated bindings produce (`bigint` ids and
 * dimensions, `ExternalBlob` values) so component tests exercise the same
 * conversions the app performs at runtime.
 */

/** A minimal `ExternalBlob` stand-in exposing the methods components call. */
export function fakeBlob(url = "blob:mock-thumb"): ExternalBlob {
  return {
    getDirectURL: () => url,
    getBytes: async () => new Uint8Array([1, 2, 3]),
  } as unknown as ExternalBlob;
}

export function makeJobSummary(
  overrides: Partial<JobSummary> = {},
): JobSummary {
  return {
    id: 1n,
    fileName: "photo.png",
    mode: UpscaleMode.quality,
    scaleFactor: 4n,
    modelStyle: ModelStyle.photo,
    resultWidth: 1024n,
    resultHeight: 768n,
    createdAt: 1_700_000_000_000n,
    thumbnailBlob: fakeBlob(),
    ...overrides,
  };
}

export function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 1n,
    fileName: "photo.png",
    mode: UpscaleMode.quality,
    scaleFactor: 4n,
    modelStyle: ModelStyle.photo,
    originalWidth: 256n,
    originalHeight: 192n,
    resultWidth: 1024n,
    resultHeight: 768n,
    originalByteSize: 20_000n,
    resultByteSize: 80_000n,
    createdAt: 1_700_000_000_000n,
    resultBlob: fakeBlob("blob:mock-result"),
    thumbnailBlob: fakeBlob(),
    ...overrides,
  };
}

/** The subset of the backend actor the frontend actually calls. */
export interface MockActor {
  listJobs: () => Promise<JobSummary[]>;
  getJob: (id: bigint) => Promise<Job | null>;
  createJob: (input: unknown) => Promise<bigint>;
  deleteJob: (id: bigint) => Promise<boolean>;
}

/** A typed actor mock with every method stubbed to a safe default. */
export function makeActor(overrides: Partial<MockActor> = {}): MockActor {
  return {
    listJobs: async () => [],
    getJob: async () => null,
    createJob: async () => 1n,
    deleteJob: async () => true,
    ...overrides,
  };
}
