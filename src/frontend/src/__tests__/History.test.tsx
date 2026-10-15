import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode, createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type MockActor,
  makeActor,
  makeJob,
  makeJobSummary,
} from "@/__tests__/helpers";
import { HistoryPage } from "@/pages/History";

// The empty state renders a TanStack Router `<Link>`, which needs a router
// context the isolated page does not have. Render it as a plain anchor so the
// page's own behavior is what gets exercised.
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router",
  );
  return {
    ...actual,
    Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) =>
      createElement("a", { href: to, ...rest }, children),
  };
});

// The history route reads auth from `useInternetIdentity` and data from the
// backend actor via `useActor`. Both are mocked at the module seam so the page
// runs unmodified against a typed local actor.
const actorRef: { current: MockActor } = { current: makeActor() };
const authRef: { current: { isAuthenticated: boolean } } = {
  current: { isAuthenticated: true },
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

beforeEach(() => {
  actorRef.current = makeActor();
  authRef.current = { isAuthenticated: true };
});

describe("HistoryPage", () => {
  it("prompts signed-out visitors to sign in instead of listing jobs", () => {
    authRef.current = { isAuthenticated: false };
    render(<HistoryPage />, { wrapper });

    expect(screen.getByTestId("history.signin_prompt")).toBeInTheDocument();
    expect(screen.getByTestId("history.signin_button")).toBeInTheDocument();
    expect(screen.queryByTestId("history.list")).not.toBeInTheDocument();
  });

  it("shows an empty state when the signed-in user has no jobs", async () => {
    render(<HistoryPage />, { wrapper });

    expect(
      await screen.findByTestId("history.empty_state"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("history.list")).not.toBeInTheDocument();
  });

  it("lists saved jobs as cards with thumbnail, name, mode and scale", async () => {
    actorRef.current = makeActor({
      listJobs: async () => [
        makeJobSummary({ id: 1n, fileName: "beach.png" }),
        makeJobSummary({ id: 2n, fileName: "poster.jpg" }),
      ],
    });
    render(<HistoryPage />, { wrapper });

    const list = await screen.findByTestId("history.list");
    expect(within(list).getAllByRole("article")).toHaveLength(2);
    expect(within(list).getByText("beach.png")).toBeInTheDocument();
    expect(within(list).getByText("poster.jpg")).toBeInTheDocument();
    // Mode label and scale badge from the fixture (quality, 4x).
    expect(within(list).getAllByText("เพิ่มความละเอียด")).toHaveLength(2);
    expect(within(list).getAllByText("×4")).toHaveLength(2);
    expect(
      within(list).getByAltText("ภาพย่อผลลัพธ์ของ beach.png"),
    ).toBeInTheDocument();
  });

  it("opens a job detail with its settings and a working re-download", async () => {
    actorRef.current = makeActor({
      listJobs: async () => [makeJobSummary({ id: 5n, fileName: "beach.png" })],
      getJob: async () => makeJob({ id: 5n, fileName: "beach.png" }),
    });
    const user = userEvent.setup();
    render(<HistoryPage />, { wrapper });

    await user.click(await screen.findByTestId("history.open_button.1"));

    const detail = await screen.findByTestId("history.detail");
    expect(within(detail).getByText("beach.png")).toBeInTheDocument();
    expect(within(detail).getByText("เพิ่มความละเอียด")).toBeInTheDocument();
    expect(within(detail).getByText("×4")).toBeInTheDocument();
    expect(within(detail).getByText("256 × 192 px")).toBeInTheDocument();
    expect(within(detail).getByText("1024 × 768 px")).toBeInTheDocument();
    expect(
      within(detail).getByAltText("ภาพผลลัพธ์ของ beach.png"),
    ).toBeInTheDocument();
    expect(
      within(detail).getByTestId("history.download_png_button"),
    ).toBeEnabled();
    expect(
      within(detail).getByTestId("history.download_jpg_button"),
    ).toBeEnabled();
  });

  it("confirms before deleting and removes the job from the list", async () => {
    // A stateful list so the post-delete refetch reflects the removal.
    let jobs = [
      makeJobSummary({ id: 1n, fileName: "keep.png" }),
      makeJobSummary({ id: 2n, fileName: "remove.png" }),
    ];
    const deleteJob = vi.fn(async (id: bigint) => {
      jobs = jobs.filter((job) => job.id !== id);
      return true;
    });
    actorRef.current = makeActor({
      listJobs: async () => jobs,
      deleteJob,
    });
    const user = userEvent.setup();
    render(<HistoryPage />, { wrapper });

    await screen.findByTestId("history.list");
    await user.click(screen.getByTestId("history.delete_button.2"));

    // A confirmation dialog gates the destructive action.
    const dialog = await screen.findByTestId("history.delete_dialog");
    expect(within(dialog).getByText(/remove\.png/)).toBeInTheDocument();
    expect(deleteJob).not.toHaveBeenCalled();

    // Cancelling leaves the job in place.
    await user.click(screen.getByTestId("history.delete_cancel_button"));
    await waitFor(() =>
      expect(
        screen.queryByTestId("history.delete_dialog"),
      ).not.toBeInTheDocument(),
    );
    expect(deleteJob).not.toHaveBeenCalled();

    // Confirming deletes the chosen job and drops it from the list.
    await user.click(screen.getByTestId("history.delete_button.2"));
    await user.click(
      await screen.findByTestId("history.delete_confirm_button"),
    );

    await waitFor(() => expect(deleteJob).toHaveBeenCalledWith(2n));
    await waitFor(() =>
      expect(screen.queryByText("remove.png")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("keep.png")).toBeInTheDocument();
  });
});
