import { NavBar } from "@/components/NavBar";
import type { ReactNode } from "react";

const ATTRIBUTION_URL = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
  typeof window !== "undefined" ? window.location.hostname : "",
)}`;

/** Shared app shell: top navigation, content area, and attribution footer. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <NavBar />
      <main className="flex-1 bg-background">{children}</main>
      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <p>ประมวลผลภาพในเบราว์เซอร์ของคุณ — ภาพไม่ถูกส่งออกไปที่อื่น</p>
          <a
            href={ATTRIBUTION_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded outline-none transition-smooth hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            © {new Date().getFullYear()}. Built with love using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
