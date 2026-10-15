import type { CapacitorConfig } from "@capacitor/cli";

/**
 * PixelLift Android shell.
 *
 * The native app loads the built frontend from `dist/` (bundled into the APK),
 * so the studio and history routes work offline exactly as they do on the web.
 * The dark studio background matches the web token `--background` (oklch 0.13)
 * so there is no white flash before the WebView paints.
 */
const config: CapacitorConfig = {
  appId: "ai.caffeine.pixellift",
  appName: "PixelLift",
  webDir: "dist",
  backgroundColor: "#1a1a1c",
  android: {
    // The native project lives at the repository root (`app/android`), one
    // level above the frontend package, so the GitHub Actions APK workflow can
    // build it without reaching into `src/frontend`.
    path: "../../android",
    backgroundColor: "#1a1a1c",
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
