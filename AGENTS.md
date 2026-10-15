# Project Guidance

## User Preferences

- Interface language: Thai
- Dark, professional theme that keeps the image as the focal point
- Imported images may be low resolution and must come out visibly sharper
- AI-assisted enhancement is acceptable
- Responsive layout for desktop and mobile
- Android APK is built through GitHub Actions and downloaded from GitHub Releases

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- PixelLift is dark-only: the .dark token block is the design source of truth and the dark theme is activated by class="dark" on <html> in index.html; tailwind darkMode:['class'] plus .dark tokens depend on that class being present before first paint.
- Enhanced Migration with check-limit=1 rejects two pending migrations; fold earlier pending changes into the latest pending file. A first-in-chain migration must use OldActor = {} and its NewActor must list every stable field declared in main.mo.
- Backend Timestamp is milliseconds since the Unix epoch (Time.now() / 1_000_000); frontend date conversion must use Number(timestamp) directly with no division.
- Sharpen-only mode (UpscaleMode.balanced) processes at effectiveScale=1; only UpscaleMode.quality honors settings.scaleFactor. The processing path must use the same effective scale the settings panel previews.
- TanStack Router routes are registered in App.tsx; page tasks own only their page module bodies and must not touch App.tsx or NavBar.
- useInternetIdentity() from @caffeineai/core-infrastructure exposes isAuthenticated — gate authenticated UI on it, including the History nav link.
- ExternalBlob.getDirectURL() returns a renderable URL for both thumbnails and full results; stored blobs are PNG and JPG re-download re-encodes via canvas with a white fill.
- OQL auto-derivation of a record with variant fields needs a <TypeName>Value.mo module exporting _toRow; when the owner lives in the Map key, use OQL.Entity.newScoped with a scoped iterator plus .scopedPerUser().
- Motoko multiline text literals use a single double-quote delimiter spanning lines; the triple-quote form is NOT Motoko.
- Biome's useSemanticElements rejects role='status' on a div (wants <output>) and useFocusableInteractive rejects role='progressbar' on a div — use the native <progress> element with value/max.
- Capacitor resolves the android platform dir relative to the config file's directory, so a native project at the repo root needs android.path set (e.g. '../../android') in capacitor.config.ts.
- npx cap sync android regenerates capacitor.settings.gradle, capacitor.build.gradle, capacitor.config.json, and the cordova-plugins dir, so those generated files must be re-synced in CI before a Gradle build.
- Vite base must be './' for a Capacitor WebView build so assets resolve under the capacitor:// / file:// scheme instead of absolute '/assets/...' paths.
- Capacitor's default android/app/build.gradle has no signingConfig on the release build type, so assembleRelease emits an unsigned APK that will not install; wiring signingConfigs.release to the Android debug keystore makes the release APK installable for testing.
- GitHub-hosted runners have no ~/.android/debug.keystore, so a release build that signs with the debug keystore must generate it first via keytool -genkeypair before gradlew assembleRelease.
- PixelLift's Tailwind theme registers destructive but not warning/success colors, so --warning/--success CSS variables exist without matching utility classes; any *-warning class silently renders unstyled.
- A page module can exist and compile while being unreachable; check-mode verification must confirm the route is registered in App.tsx and linked from NavBar, not just that the page file builds.
