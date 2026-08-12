"use client";

import { env } from "@/env.mjs";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

const rawUrl = env.NEXT_PUBLIC_CONVEX_URL;
const convexUrl =
  rawUrl && (rawUrl.includes(".convex.cloud") || rawUrl.startsWith("http://localhost") || rawUrl.startsWith("http://127.0.0.1"))
    ? rawUrl
    : "https://placeholder-app-123.convex.cloud";

const convex = new ConvexReactClient(convexUrl, {
  verbose: true,
});

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
