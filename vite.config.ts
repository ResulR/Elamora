// @lovable.dev/vite-tanstack-config already includes the following - do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro,
//     componentTagger, VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET?.trim() || "http://127.0.0.1:4300";
const pointsToProductionApi = /^https:\/\/(www\.)?elamora\.eu\/?$/i.test(apiProxyTarget);

if (pointsToProductionApi && process.env.ALLOW_PROD_API_PROXY !== "true") {
  throw new Error(
    [
      "Refusing to proxy local Vite dev traffic to the production Elamora API.",
      "Use a local API target, for example VITE_API_PROXY_TARGET=http://127.0.0.1:4300.",
      "If you intentionally need to inspect production traffic, set ALLOW_PROD_API_PROXY=true explicitly.",
    ].join(" ")
  );
}

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      allowedHosts: ["elamora.eu", "www.elamora.eu"],
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          secure:
            !apiProxyTarget.startsWith("http://127.0.0.1") &&
            !apiProxyTarget.startsWith("http://localhost"),
        },
      },
    },
    preview: {
      allowedHosts: ["elamora.eu", "www.elamora.eu"],
    },
  },
});
