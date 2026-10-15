import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Generated components expose `data-ocid` hooks rather than ARIA roles for
// several controls, so make `getByTestId` resolve them.
configure({ testIdAttribute: "data-ocid" });

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// jsdom does not implement these browser APIs the studio relies on. They are
// stubbed here so component tests can exercise the real code paths without a
// browser; the stubs are inert and never assert on their own.
if (typeof URL.createObjectURL !== "function") {
  Object.defineProperty(URL, "createObjectURL", {
    writable: true,
    value: vi.fn(() => "blob:mock"),
  });
}
if (typeof URL.revokeObjectURL !== "function") {
  Object.defineProperty(URL, "revokeObjectURL", {
    writable: true,
    value: vi.fn(),
  });
}
if (typeof globalThis.requestAnimationFrame !== "function") {
  Object.defineProperty(globalThis, "requestAnimationFrame", {
    writable: true,
    value: (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0),
  });
}
