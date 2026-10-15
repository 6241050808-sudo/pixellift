import { createIdentity, PocketIc } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type {
  _SERVICE,
  CreateJobInput,
} from "../../src/frontend/src/declarations/backend.did";

// The runner proves `@dfinity/pic` resolves from this directory before Vitest
// starts, and hands us a live replica. Every runtime import here stays within
// `@dfinity/pic`, `vitest`, Node built-ins, and the app's own declarations.
const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project: the last pre-EM revision whose schema this
// app's migration chain replays from.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

/** A minimal valid `CreateJobInput`; blobs are raw bytes in the declarations. */
function jobInput(overrides: Partial<CreateJobInput> = {}): CreateJobInput {
  return {
    fileName: "photo.png",
    mode: { quality: null },
    scaleFactor: 4n,
    modelStyle: { photo: null },
    originalWidth: 256n,
    originalHeight: 192n,
    resultWidth: 1024n,
    resultHeight: 768n,
    originalByteSize: 20_000n,
    resultByteSize: 80_000n,
    resultBlob: new Uint8Array([1, 2, 3]),
    thumbnailBlob: new Uint8Array([4, 5, 6]),
    ...overrides,
  };
}

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BACKEND_WASM,
    }));
    return;
  }
  // `[baseline, current]`, the same install contract the hosted deploy uses for
  // a converted project. The upgrade replays the chain from the legacy schema.
  const installed = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BASELINE_WASM,
  });
  await pic.upgradeCanister({
    canisterId: installed.canisterId,
    wasm: BACKEND_WASM,
    arg: new Uint8Array(),
  });
  ({ actor, canisterId } = installed);
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far.
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  const alice = createIdentity("alice-empty");
  actor.setIdentity(alice);
  await expect(actor.listJobs()).resolves.toEqual([]);
});

it("round-trips a job through the real canister", async () => {
  const alice = createIdentity("alice-roundtrip");
  actor.setIdentity(alice);

  const id = await actor.createJob(jobInput({ fileName: "beach.png" }));

  const summaries = await actor.listJobs();
  expect(summaries).toHaveLength(1);
  expect(summaries[0]).toMatchObject({
    id,
    fileName: "beach.png",
    scaleFactor: 4n,
    resultWidth: 1024n,
    resultHeight: 768n,
  });

  const job = await actor.getJob(id);
  expect(job).toHaveLength(1);
  expect(job[0]).toMatchObject({
    id,
    fileName: "beach.png",
    originalWidth: 256n,
    originalHeight: 192n,
    resultWidth: 1024n,
    resultHeight: 768n,
  });

  // The thumbnail blob is retrievable for the owner.
  const thumbnail = await actor.getThumbnail(id);
  expect(thumbnail).toHaveLength(1);
});

it("lists jobs newest first", async () => {
  const alice = createIdentity("alice-order");
  actor.setIdentity(alice);

  const first = await actor.createJob(jobInput({ fileName: "first.png" }));
  const second = await actor.createJob(jobInput({ fileName: "second.png" }));

  const summaries = await actor.listJobs();
  expect(summaries.map((summary) => summary.id)).toEqual([second, first]);
});

it("deletes a job and reports whether a record was removed", async () => {
  const alice = createIdentity("alice-delete");
  actor.setIdentity(alice);

  const id = await actor.createJob(jobInput({ fileName: "gone.png" }));
  await expect(actor.deleteJob(id)).resolves.toBe(true);
  await expect(actor.deleteJob(id)).resolves.toBe(false);
  await expect(actor.listJobs()).resolves.toEqual([]);
});

it("does not show one caller's jobs to another", async () => {
  const alice = createIdentity("alice-isolation");
  const bob = createIdentity("bob-isolation");

  actor.setIdentity(alice);
  const id = await actor.createJob(jobInput({ fileName: "private.png" }));

  actor.setIdentity(bob);
  await expect(actor.listJobs()).resolves.toEqual([]);
  await expect(actor.getJob(id)).resolves.toEqual([]);
  await expect(actor.deleteJob(id)).resolves.toBe(false);
});
