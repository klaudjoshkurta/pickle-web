import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  /* config options here */
  experimental: {
    agentFeedback: true,
    globalNotFound: true,
    // Avoid the CSS loader child-process IPC failure on Windows.
    ...(process.platform === "win32" ? { turbopackPluginRuntimeStrategy: "workerThreads" as const } : {}),
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  outputFileTracingIncludes: {
    "/blog": ["./src/content/posts/**/*"],
    "/blog/*": ["./src/content/posts/**/*"],
  },
};

export default nextConfig;
