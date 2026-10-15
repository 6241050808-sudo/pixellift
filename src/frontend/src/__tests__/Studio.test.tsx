import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type MockActor, makeActor } from "@/__tests__/helpers";
import { StudioPage } from "@/pages/Studio";

// The studio talks to the backend only through `useActor`/`createActor`, and to
// auth only through `useInternetIdentity`. Both are mocked at the module seam
// so the component tree runs unmodified against a typed local actor.
const actorRef: { current: MockActor } = { current: makeActor() };
const authRef: { current: { isAuthenticated: boolean } } = {
  current: { isAuthenticated: false },
};

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: actorRef.current, isFetching: false }),
  useInternetIdentity: () => ({
    isAuthenticated: authRef.current.isAuthenticated,
    login: vi.fn(),
    clear: vi.fn(),
    isInitializing: false,
    isLoggingIn: false,
    identity: undefined,
  }),
}));

vi.mock("@/backend", async () => {
  const actual = await vi.importActual<typeof import("@/backend")>("@/backend");
  return { ...actual, createActor: vi.fn(() => actorRef.current) };
});

// jsdom has no canvas 2D implementation. The engine's real pipeline is covered
// by the dimension-math tests; here we stub the canvas surface so the studio's
// state machine (progress, cancel, result, download) can be exercised.
function stubCanvas() {
  const context = {
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    })),
    putImageData: vi.fn(),
    fillRect: vi.fn(),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
    filter: "none",
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    (callback: BlobCallback, type?: string) => {
      callback(makeBlob(type ?? "image/png"));
    },
  );
}

/**
 * jsdom's `Blob` does not reliably expose `arrayBuffer()` in this environment,
 * and the studio calls it when persisting a result. This shim carries the
 * surface the app touches: `arrayBuffer`, `size`, `type`, and `slice`.
 */
function makeBlob(type = "image/png", bytes = 3): Blob {
  const data = new Uint8Array(bytes);
  return {
    type,
    size: bytes,
    arrayBuffer: async () => data.buffer,
    slice: () => makeBlob(type, bytes),
  } as unknown as Blob;
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** A PNG File whose decoded natural size is reported as `width × height`. */
function imageFile(name = "photo.png", width = 256, height = 192): File {
  const file = new File([new Uint8Array([137, 80, 78, 71])], name, {
    type: "image/png",
  });
  Object.defineProperty(file, "size", { value: 20_000 });
  // jsdom never decodes images; report the natural size the hook reads.
  Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(HTMLImageElement.prototype, "naturalHeight", {
    configurable: true,
    get: () => height,
  });
  return file;
}

/** Import an image and wait until the preview replaces the dropzone. */
async function importImage(
  user: ReturnType<typeof userEvent.setup>,
  file = imageFile(),
) {
  await user.upload(screen.getByTestId("studio.file_input"), file);
  await waitFor(() =>
    expect(screen.getByTestId("studio.replace_button")).toBeInTheDocument(),
  );
}

beforeEach(() => {
  actorRef.current = makeActor();
  authRef.current = { isAuthenticated: false };
  stubCanvas();
  // `loadImageElement` waits for `onload`; fire it as soon as `src` is set.
  vi.spyOn(HTMLImageElement.prototype, "src", "set").mockImplementation(
    function (this: HTMLImageElement) {
      queueMicrotask(() => this.onload?.(new Event("load")));
    },
  );
});

describe("StudioPage", () => {
  it("renders the import zone and settings panel on first load", () => {
    render(<StudioPage />, { wrapper });
    expect(screen.getByTestId("studio.page")).toBeInTheDocument();
    expect(screen.getByTestId("studio.import_panel")).toBeInTheDocument();
    expect(screen.getByTestId("studio.settings_panel")).toBeInTheDocument();
    expect(screen.getByTestId("studio.dropzone")).toBeInTheDocument();
  });

  it("shows the source preview and its pixel/file metadata after import", async () => {
    const user = userEvent.setup();
    render(<StudioPage />, { wrapper });

    await importImage(user, imageFile("holiday.png", 256, 192));

    const importPanel = screen.getByTestId("studio.import_panel");
    expect(within(importPanel).getByText("256 × 192")).toBeInTheDocument();
    expect(within(importPanel).getByText("19.5 KB")).toBeInTheDocument();
    expect(within(importPanel).getByText("PNG")).toBeInTheDocument();
    expect(
      within(importPanel).getByAltText("ภาพต้นฉบับ holiday.png"),
    ).toBeInTheDocument();
  });

  it("rejects a non-image file with a clear message and no crash", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<StudioPage />, { wrapper });

    const bad = new File(["hello"], "notes.txt", { type: "text/plain" });
    await user.upload(screen.getByTestId("studio.file_input"), bad);

    const alert = await screen.findByTestId("studio.error_state");
    expect(alert).toHaveTextContent("ไฟล์นี้ไม่รองรับ");
    // The dropzone is still usable — the app did not hang.
    expect(screen.getByTestId("studio.dropzone")).toBeInTheDocument();
  });

  it("previews the expected output dimensions for the chosen mode and scale", async () => {
    const user = userEvent.setup();
    render(<StudioPage />, { wrapper });

    await importImage(user, imageFile("photo.png", 256, 192));

    // Default mode is "เพิ่มความคมชัดเท่าเดิม" (sharpen-only), which keeps 1x.
    expect(screen.getByTestId("studio.expected_dimensions")).toHaveTextContent(
      "256 × 192",
    );

    // Switching to "เพิ่มความละเอียด" (enlarge) honors the 2x default.
    await user.click(screen.getByTestId("studio.mode.quality"));
    expect(screen.getByTestId("studio.expected_dimensions")).toHaveTextContent(
      "512 × 384",
    );

    await user.click(screen.getByTestId("studio.scale.4x"));
    expect(screen.getByTestId("studio.expected_dimensions")).toHaveTextContent(
      "1024 × 768",
    );
  });

  it("processes at 4x and reports the result dimensions", async () => {
    const user = userEvent.setup();
    render(<StudioPage />, { wrapper });

    await importImage(user, imageFile("photo.png", 256, 192));

    await user.click(screen.getByTestId("studio.mode.quality"));
    await user.click(screen.getByTestId("studio.scale.4x"));
    await user.click(screen.getByTestId("studio.process_button"));

    // The result readout shows before/after dimensions once processing ends.
    await waitFor(() =>
      expect(
        screen.getByTestId("studio.download_png_button"),
      ).toBeInTheDocument(),
    );
    const resultPanel = screen.getByTestId("studio.result_panel");
    expect(within(resultPanel).getByText("1024 × 768")).toBeInTheDocument();
    expect(screen.getByTestId("studio.compare_slider")).toBeInTheDocument();
  });

  it("hides the save-to-history action for signed-out users", async () => {
    const user = userEvent.setup();
    render(<StudioPage />, { wrapper });

    await importImage(user, imageFile("photo.png", 256, 192));
    await user.click(screen.getByTestId("studio.process_button"));
    await waitFor(() =>
      expect(
        screen.getByTestId("studio.download_png_button"),
      ).toBeInTheDocument(),
    );

    expect(
      screen.queryByTestId("studio.save_history_button"),
    ).not.toBeInTheDocument();
    // Download remains available without signing in.
    expect(screen.getByTestId("studio.download_png_button")).toBeEnabled();
  });

  it("saves a completed job to history when signed in", async () => {
    authRef.current = { isAuthenticated: true };
    // Type the parameter so `mock.calls[0][0]` is the persisted input, not `[]`.
    const createJob = vi.fn(async (_input: unknown) => 7n);
    actorRef.current = makeActor({ createJob });

    const user = userEvent.setup();
    render(<StudioPage />, { wrapper });

    await importImage(user, imageFile("photo.png", 256, 192));
    // Enlarge mode at the default 2x so the persisted dimensions are 512 × 384.
    await user.click(screen.getByTestId("studio.mode.quality"));
    await user.click(screen.getByTestId("studio.process_button"));
    await waitFor(() =>
      expect(
        screen.getByTestId("studio.save_history_button"),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByTestId("studio.save_history_button"));

    await waitFor(() => {
      expect(createJob).toHaveBeenCalledTimes(1);
    });
    const input = createJob.mock.calls[0][0] as {
      fileName: string;
      scaleFactor: bigint;
      resultWidth: bigint;
      resultHeight: bigint;
    };
    expect(input.fileName).toBe("photo.png");
    expect(input.scaleFactor).toBe(2n);
    expect(input.resultWidth).toBe(512n);
    expect(input.resultHeight).toBe(384n);
    await waitFor(() =>
      expect(
        screen.getByTestId("studio.save_history_button"),
      ).toHaveTextContent("บันทึกแล้ว"),
    );
  });
});
