import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type MockActor, makeActor } from "@/__tests__/helpers";

/**
 * Characterization of the app shell and routing seam.
 *
 * The Studio and History pages are covered in isolation elsewhere; this file
 * protects the layer the new `/download` route will touch: the router's default
 * route must render the Studio (never a blank screen), `/history` must render
 * the History page, and the navigation must expose the right links per auth
 * state. The backend actor and auth are mocked at the module seam so the real
 * router, Layout, and NavBar run unmodified.
 */

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

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/**
 * Render the real `App` router at `path`. `App.tsx` builds its router at module
 * load, so the URL is set first and the module registry reset per render to get
 * a fresh router pointed at the requested location.
 */
async function renderAppAt(path: string) {
  window.history.pushState({}, "", path);
  vi.resetModules();
  const { default: App } = await import("@/App");
  return render(<App />, { wrapper });
}

beforeEach(() => {
  actorRef.current = makeActor();
  authRef.current = { isAuthenticated: false };
});

afterEach(() => {
  window.history.pushState({}, "", "/");
});

describe("app shell routing", () => {
  it("renders the Studio at the default route instead of a blank screen", async () => {
    await renderAppAt("/");

    // The shell (nav + footer) and the routed Studio page both mount.
    expect(await screen.findByTestId("studio.page")).toBeInTheDocument();
    expect(screen.getByTestId("nav.home_link")).toBeInTheDocument();
    expect(screen.getByTestId("studio.import_panel")).toBeInTheDocument();
  });

  it("renders the History page at /history", async () => {
    authRef.current = { isAuthenticated: true };
    await renderAppAt("/history");

    expect(await screen.findByTestId("history.page")).toBeInTheDocument();
    expect(screen.queryByTestId("studio.page")).not.toBeInTheDocument();
  });

  it("shows the PixelLift wordmark and the Studio link on every route", async () => {
    await renderAppAt("/");

    const nav = await screen.findByRole("navigation", { name: "เมนูหลัก" });
    expect(within(nav).getByTestId("nav.studio_link")).toHaveTextContent(
      "สตูดิโอ",
    );
    expect(screen.getByTestId("nav.home_link")).toHaveTextContent("PixelLift");
  });

  it("hides the History link from signed-out visitors and shows it when signed in", async () => {
    const { unmount } = await renderAppAt("/");
    await screen.findByTestId("studio.page");
    expect(screen.queryByTestId("nav.history_link")).not.toBeInTheDocument();
    unmount();

    authRef.current = { isAuthenticated: true };
    await renderAppAt("/");
    await screen.findByTestId("studio.page");
    expect(screen.getByTestId("nav.history_link")).toHaveTextContent(
      "ประวัติงาน",
    );
  });

  it("navigates from the Studio to History via the nav link", async () => {
    authRef.current = { isAuthenticated: true };
    const user = userEvent.setup();
    await renderAppAt("/");
    await screen.findByTestId("studio.page");

    await user.click(screen.getByTestId("nav.history_link"));

    await waitFor(() =>
      expect(screen.getByTestId("history.page")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("studio.page")).not.toBeInTheDocument();
  });

  it("renders the Download page at /download", async () => {
    await renderAppAt("/download");

    expect(await screen.findByTestId("download.page")).toBeInTheDocument();
    expect(screen.queryByTestId("studio.page")).not.toBeInTheDocument();
  });

  it("shows the Download link to signed-out visitors and navigates to it", async () => {
    const user = userEvent.setup();
    await renderAppAt("/");
    await screen.findByTestId("studio.page");

    // The download link is public — no sign-in required.
    const downloadLink = screen.getByTestId("nav.download_link");
    expect(downloadLink).toHaveTextContent("ดาวน์โหลดแอป");

    await user.click(downloadLink);

    await waitFor(() =>
      expect(screen.getByTestId("download.page")).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("studio.page")).not.toBeInTheDocument();
  });
});
