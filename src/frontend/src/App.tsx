import { Layout } from "@/components/Layout";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const StudioPage = lazy(() =>
  import("@/pages/Studio").then((module) => ({ default: module.StudioPage })),
);
const HistoryPage = lazy(() =>
  import("@/pages/History").then((module) => ({ default: module.HistoryPage })),
);
const DownloadPage = lazy(() =>
  import("@/pages/Download").then((module) => ({
    default: module.DownloadPage,
  })),
);

function RouteFallback() {
  return (
    <div
      data-ocid="page.loading_state"
      className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-24 text-sm text-muted-foreground sm:px-6 lg:px-8"
    >
      กำลังโหลด…
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </Layout>
  ),
});

const studioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: StudioPage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: HistoryPage,
});

const downloadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/download",
  component: DownloadPage,
});

const routeTree = rootRoute.addChildren([
  studioRoute,
  historyRoute,
  downloadRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
