import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { DownloadPage } from "@/pages/Download";

// The page renders a TanStack Router `<Link>` back to the studio, which needs a
// router context the isolated page does not have. Render it as a plain anchor so
// the page's own content is what gets exercised.
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

/**
 * The `/download` page is the single entry point for the Android APK. It must
 * explain the sideload flow, link to the project's GitHub Releases page, state
 * the "unknown sources" prerequisite, and carry the debug-build caveat.
 */
describe("DownloadPage", () => {
  it("renders the download guide with a link to GitHub Releases", () => {
    render(<DownloadPage />);

    expect(screen.getByTestId("download.page")).toBeInTheDocument();

    const releases = screen.getByTestId("download.releases_button");
    expect(releases).toHaveAttribute(
      "href",
      "https://github.com/caffeine-ai/pixellift/releases/latest",
    );
    // Opens in a new tab so the app is not navigated away from.
    expect(releases).toHaveAttribute("target", "_blank");
  });

  it("lists the install steps and the unknown-sources prerequisite", () => {
    render(<DownloadPage />);

    const steps = screen.getByTestId("download.steps_list");
    expect(within(steps).getAllByRole("listitem")).toHaveLength(4);
    expect(
      within(steps).getByText("อนุญาตติดตั้งจากแหล่งที่ไม่รู้จัก"),
    ).toBeInTheDocument();

    const requirements = screen.getByTestId("download.requirements_panel");
    expect(within(requirements).getByText(/แหล่งที่ไม่รู้จัก/)).toBeInTheDocument();
  });

  it("states that the APK is an unsigned debug build for testing", () => {
    render(<DownloadPage />);

    const notice = screen.getByTestId("download.notice_panel");
    expect(within(notice).getByText("debug build")).toBeInTheDocument();
    expect(within(notice).getByText(/Google Play/)).toBeInTheDocument();
  });
});
