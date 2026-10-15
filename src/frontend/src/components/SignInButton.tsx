import { Button } from "@/components/ui/button";
import { shortPrincipal } from "@/lib/format";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut } from "lucide-react";

/**
 * Internet Identity sign-in surface. Shows a sign-in action when signed out and
 * the caller's short principal with a sign-out action when signed in.
 */
export function SignInButton() {
  const {
    login,
    clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    identity,
  } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleAuth = () => {
    if (isAuthenticated) {
      clear();
      queryClient.clear();
    } else {
      login();
    }
  };

  const principal = identity?.getPrincipal().toString() ?? "";
  const busy = isInitializing || isLoggingIn;

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <span
          data-ocid="auth.principal"
          className="hidden max-w-[12rem] truncate rounded-full border border-border bg-muted px-3 py-1 font-mono text-xs text-muted-foreground sm:inline-block"
          title={principal}
        >
          {shortPrincipal(principal)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAuth}
          data-ocid="auth.signout_button"
          className="rounded-xl"
        >
          <LogOut aria-hidden="true" />
          <span className="hidden sm:inline">ออกจากระบบ</span>
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleAuth}
      disabled={busy}
      data-ocid="auth.signin_button"
      className="rounded-xl"
    >
      <LogIn aria-hidden="true" />
      {isInitializing
        ? "กำลังโหลด…"
        : isLoggingIn
          ? "กำลังเข้าสู่ระบบ…"
          : "เข้าสู่ระบบ"}
    </Button>
  );
}
