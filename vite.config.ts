// @lovable.dev/vite-tanstack-config already includes the following - do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro,
//     componentTagger, VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts.
    server: { entry: "server" },
  },
  vite: {
    server: {
      allowedHosts: ["elamora.eu", "www.elamora.eu"],
      // Proxy /api/* to the production API during local development.
      // The Express API server runs on elamora.eu and requires a DB connection
      // that is not available locally — proxying to prod is the simplest solution.
      proxy: {
        "/api": {
          target: "https://elamora.eu",
          changeOrigin: true,
          secure: true,
        },
      },
    },
    preview: {
      allowedHosts: ["elamora.eu", "www.elamora.eu"],
    },
  },
});
