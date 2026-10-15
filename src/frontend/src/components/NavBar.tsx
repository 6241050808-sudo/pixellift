import { SignInButton } from "@/components/SignInButton";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "สตูดิโอ", ocid: "nav.studio_link", requiresAuth: false },
  {
    to: "/history",
    label: "ประวัติงาน",
    ocid: "nav.history_link",
    requiresAuth: true,
  },
  {
    to: "/download",
    label: "ดาวน์โหลดแอป",
    ocid: "nav.download_link",
    requiresAuth: false,
  },
] as const;

/** Top navigation: wordmark, Studio/History menu, and the auth surface. */
export function NavBar() {
  const { isAuthenticated } = useInternetIdentity();
  const items = NAV_ITEMS.filter(
    (item) => !item.requiresAuth || isAuthenticated,
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          data-ocid="nav.home_link"
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            PixelLift
          </span>
        </Link>

        <nav aria-label="เมนูหลัก" className="flex items-center gap-1">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              data-ocid={item.ocid}
              activeOptions={{ exact: item.to === "/" }}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth outline-none",
                "hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
              )}
              activeProps={{
                className:
                  "bg-muted text-foreground ring-1 ring-inset ring-primary/40",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <SignInButton />
      </div>
    </header>
  );
}
