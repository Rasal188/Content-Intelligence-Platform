import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { polar } from "./subscriptions";

const http = httpRouter();

auth.addHttpRoutes(http);

// Register the webhook handler at /polar/events
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
polar.registerRoutes(http as any);

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  if (!a || !b) return false;
  const enc = new TextEncoder();
  const aBuf = await crypto.subtle.digest("SHA-256", enc.encode(a));
  const bBuf = await crypto.subtle.digest("SHA-256", enc.encode(b));
  const aArr = new Uint8Array(aBuf);
  const bArr = new Uint8Array(bBuf);
  let diff = 0;
  for (let i = 0; i < 32; i++) {
    diff |= (aArr[i] ?? 0) ^ (bArr[i] ?? 0);
  }
  return diff === 0;
}

// --- Hybrid adapter WEBHOOK PATH: external backend posts results/events here ---
http.route({
  path: "/backend/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const secret = req.headers.get("x-webhook-secret");
    const configuredSecret = process.env.BACKEND_WEBHOOK_SECRET;

    if (
      !secret ||
      !configuredSecret ||
      !(await timingSafeEqual(secret, configuredSecret))
    ) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    // Enforce 512 KB maximum body size limit on webhook requests
    const contentLength = req.headers.get("content-length");
    if (contentLength && Number.parseInt(contentLength, 10) > 512 * 1024) {
      return new Response(
        JSON.stringify({ error: "Payload exceeds maximum allowed length." }),
        { status: 413, headers: { "content-type": "application/json" } },
      );
    }

    let rawPayload: unknown;
    try {
      rawPayload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
      return new Response(JSON.stringify({ error: "Invalid payload format" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const payload = rawPayload as Record<string, unknown>;
    const type = typeof payload.type === "string" ? payload.type : "event";

    if (type === "job.result" && typeof payload.jobId === "string") {
      await ctx.runMutation(internal.jobs.complete, {
        // biome-ignore lint/suspicious/noExplicitAny: id validated by Convex
        jobId: payload.jobId as any,
        result: payload.result,
        error: typeof payload.error === "string" ? payload.error : undefined,
      });
    } else {
      await ctx.runMutation(internal.backend.ingestEvent, {
        workspaceId:
          typeof payload.workspaceId === "string"
            ? // biome-ignore lint/suspicious/noExplicitAny: id validated by Convex
              (payload.workspaceId as any)
            : undefined,
        source: "backend",
        type,
        payload,
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }),
});

// --- API key verification (programmatic access) ---
http.route({
  path: "/api/verify-key",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const key = req.headers.get("x-api-key") ?? "";
    const json = (body: unknown, status: number) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      });
    if (!key) return json({ valid: false }, 401);
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(key),
    );
    const hash = Array.from(new Uint8Array(buf), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const found = await ctx.runQuery(internal.apiKeys.resolveByHash, { hash });
    return json({ valid: !!found, ...(found ?? {}) }, found ? 200 : 401);
  }),
});

export default http;
