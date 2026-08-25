import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";
import {
  checkApiRateLimit,
  createRateLimitExceededResponse,
} from "@/lib/rate-limiter";
import { CompactKeyMapper } from "../../../[locale]/(dashboard)/ai-content-analyzer/_results/_services/forensics/compact-key-mapper";
import { WebPlagiarismMatcher } from "../../../[locale]/(dashboard)/ai-content-analyzer/_results/_services/forensics/web-plagiarism-matcher.service";
import { InputQualityAnalyzerService } from "../../../[locale]/(dashboard)/ai-content-analyzer/_results/_services/input-quality-analyzer.service";
import { PromptBuilderService } from "../../../[locale]/(dashboard)/ai-content-analyzer/_results/_services/prompt-builder.service";
import { PROMPT_VERSION } from "../../../[locale]/(dashboard)/ai-content-analyzer/_results/_services/prompt-config";
import { ResultResponseValidator } from "../../../[locale]/(dashboard)/ai-content-analyzer/_results/_services/result-response-validator.service";

/**
 * Server-side proxy routing analysis queries to the company's Ollima gateway.
 *
 * V2.3: Uses SSE streaming to avoid the gateway's ~28s buffered-response timeout.
 * All SSE delta chunks are accumulated server-side into a complete JSON string,
 * then processed identically by ResultResponseValidator. The frontend is unchanged.
 */
export async function POST(req: Request) {
  // 1. Authentication check
  if (!(await isAuthenticatedNextjs())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Server-side Rate Limit check (10 requests/min per user)
  const rateLimit = await checkApiRateLimit("ollima-analyze", 10, 60 * 1000);
  if (!rateLimit.allowed) {
    return createRateLimitExceededResponse(rateLimit.retryAfterSeconds);
  }

  // 1. Enforce raw HTTP request body size limit (512 KB)
  const contentLength = req.headers.get("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > 512 * 1024) {
    return NextResponse.json(
      { error: "Request payload exceeds maximum allowed size (512 KB)." },
      { status: 413 },
    );
  }

  // 2. Parse JSON body with clean error handling (400 for malformed input)
  let body: {
    text?: unknown;
    jobId?: unknown;
    documentName?: unknown;
    analysisType?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid or malformed JSON payload." },
      { status: 400 },
    );
  }

  const text = typeof body.text === "string" ? body.text : "";
  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  const documentName =
    typeof body.documentName === "string" ? body.documentName : "";
  const analysisType =
    typeof body.analysisType === "string" ? body.analysisType : "";

  if (!text || text.trim().length === 0) {
    return NextResponse.json(
      { error: "Text payload is required for analysis." },
      { status: 400 },
    );
  }

  // 3. Enforce maximum text character limit (50,000 chars)
  if (text.length > 50000) {
    return NextResponse.json(
      { error: "Text payload exceeds the maximum allowed length." },
      { status: 413 },
    );
  }

  // 4. Deterministic Input Quality & Classifiability Gate
  const qualityEvaluation = InputQualityAnalyzerService.evaluate(text);
  if (!qualityEvaluation.classifiable) {
    const unclassifiableDomainResult = {
      id: `res-${jobId || Date.now().toString(36)}`,
      jobId: jobId || `job-${Date.now().toString(36)}`,
      overallRiskLevel: "low" as const,
      document: {
        id: `doc-snap-${jobId || Date.now().toString(36)}`,
        name: documentName || "unclassifiable-content.txt",
        size: text.length * 2,
        type: "text/plain",
        language: qualityEvaluation.metrics.detectedScript,
        hash: `sha256-${jobId || Date.now().toString(36)}`,
        wordCount: qualityEvaluation.metrics.wordCount,
        characterCount: text.length,
        pageCount: 1,
        createdAt: new Date().toISOString(),
      },
      scores: {
        overallOriginality: {
          id: "score-orig",
          name: "Originality Score",
          value: 0,
          confidence: 0,
          weight: 1.0,
          description: "Unclassifiable content.",
        },
        aiProbability: {
          id: "score-ai",
          name: "AI Content",
          value: 0,
          confidence: 0,
          weight: 1.0,
          description: "Insufficient linguistic structure for authorship classification.",
        },
        plagiarismSimilarity: {
          id: "score-plag",
          name: "Similarity Risk",
          value: 0,
          confidence: 0,
          weight: 0.8,
          description: "Similarity evaluated on classifiable text only.",
        },
        readabilityQuality: {
          id: "score-read",
          name: "Readability Index",
          value: 0,
          confidence: 0,
          weight: 0.5,
          description: "Readability non-applicable.",
        },
      },
      statistics: {
        characterCount: text.length,
        wordCount: qualityEvaluation.metrics.wordCount,
        sentenceCount: qualityEvaluation.metrics.sentenceCount,
        paragraphCount: 1,
        averageSentenceLengthWords: qualityEvaluation.metrics.wordCount,
        fleschKincaidReadingEase: 0,
        fleschKincaidGradeLevel: 0,
        lexicalDiversity: qualityEvaluation.metrics.uniqueWordRatio * 100,
        syntacticComplexity: 0,
        burstinessScore: 0,
        perplexityScore: 0,
      },
      metadata: {
        schemaVersion: "2.0.0",
        engineVersion: "v2.5-ollima",
        providerVersion: "ollima-forensic-v2",
        providerName: "Ollima Input Quality Gate",
        executionTimeMs: 1,
        generatedAt: new Date().toISOString(),
        checksum: `chk-${jobId || Date.now().toString(36)}-gate`,
        processingTimeSeconds: 0.001,
        isMockData: false,
        requestId: `req-gate-${Date.now().toString(36)}`,
        analysisVersion: "2.0.0",
        promptVersion: PROMPT_VERSION,
        classifiability: qualityEvaluation.status,
        classifiable: false,
        unclassifiableReason: qualityEvaluation.reason,
      },
      highlights: [],
      matchedSources: [],
      recommendations: [],
      warnings: [
        {
          id: "warn-unclassifiable",
          severity: "low" as const,
          category: "Linguistic Structure",
          message: qualityEvaluation.reason,
        },
      ],
      extensions: {
        summary: {
          executiveSummary: qualityEvaluation.reason,
          strengths: [],
          weaknesses: ["Insufficient linguistic structure"],
          recommendedImprovements: ["Submit complete sentences or natural language prose for authorship classification."],
          riskExplanation: "Non-classifiable text.",
          confidenceExplanation: "Zero confidence due to lack of linguistic structure.",
        },
      },
    };

    return NextResponse.json({
      providerRequestId: "gate-eval",
      result: unclassifiableDomainResult,
    });
  }

  try {

    const apiKey = process.env.OLLIMA_API_KEY;
    const apiBaseUrl =
      process.env.OLLIMA_API_BASE_URL || "https://api.ollima.com";

    // Dedicated model routing:
    // ✍️ Humanizer → Gemini 3.6 Flash High (gemini-3.6-flash-high)
    // 🔎 Plagiarism Analysis → Gemini 3.1 Pro Low (gemini-3.1-pro-low)
    // 🤖 AI-Text Detection → Gemini 3.6 Flash High (gemini-3.6-flash-high)
    // 🌐 Source Discovery / Web Verification → Gemini 3.6 Flash High (gemini-3.6-flash-high)
    let model = process.env.OLLIMA_MODEL || "gemini-3.6-flash-high";
    if (analysisType === "plagiarism" || analysisType === "plagiarism-check") {
      model = process.env.OLLIMA_PLAGIARISM_MODEL || "gemini-3.1-pro-low";
    } else if (
      analysisType === "ai-detection" ||
      analysisType === "ai-content-detection"
    ) {
      model = process.env.OLLIMA_AI_DETECTION_MODEL || "gemini-3.6-flash-high";
    }

    const promptVersion = process.env.PROMPT_VERSION || PROMPT_VERSION;

    // Parse timeout — allow longer wall-clock time for streaming (default 120s)
    const timeoutVal = process.env.OLLIMA_TIMEOUT
      ? Number.parseInt(process.env.OLLIMA_TIMEOUT, 10)
      : 120000;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Ollima API Key not configured. Please set OLLIMA_API_KEY in .env.local",
        },
        { status: 400 },
      );
    }

    // 1. Build prompt
    const t0 = Date.now();
    const { system: systemPrompt, user: userPrompt } =
      PromptBuilderService.buildPrompt(promptVersion, text);
    const t1 = Date.now();
    const promptBuildTimeMs = t1 - t0;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutVal);

    const completionsUrl = `${apiBaseUrl.replace(/\/$/, "")}/v1/chat/completions`;

    try {
      // 2. Open SSE streaming connection — avoids gateway buffered-response timeout
      const t2 = Date.now();
      const response = await fetch(completionsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          stream: true,
          temperature: 0,
          top_p: 0.1,
          seed: 42,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        clearTimeout(timeoutId);
        return NextResponse.json(
          { error: `Ollima API returned status code ${response.status}` },
          { status: response.status },
        );
      }

      // 3. Accumulate SSE delta chunks into complete JSON content string
      const reader = response.body?.getReader();
      if (!reader) {
        clearTimeout(timeoutId);
        return NextResponse.json(
          { error: "Streaming response body unavailable" },
          { status: 500 },
        );
      }

      const decoder = new TextDecoder();
      let accumulated = "";
      let providerRequestId: string | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // SSE format: each line may be "data: {...}" or "data: [DONE]"
        for (const line of chunk.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;

          try {
            const parsed = JSON.parse(payload) as Record<string, unknown>;
            // Capture provider request ID from first chunk
            if (!providerRequestId && typeof parsed.id === "string") {
              providerRequestId = parsed.id;
            }
            const choices = Array.isArray(parsed.choices) ? parsed.choices : [];
            const delta = (choices[0] as Record<string, unknown>)?.delta as
              | Record<string, unknown>
              | undefined;
            // Extract ONLY actual content tokens (ignore reasoning_content / thought streams)
            if (typeof delta?.content === "string") {
              accumulated += delta.content;
            }
          } catch {
            // Malformed SSE chunk — skip and continue
          }
        }
      }

      clearTimeout(timeoutId);
      const t3 = Date.now();
      const completionTimeMs = t3 - t2;

      if (!accumulated) {
        return NextResponse.json(
          { error: "Empty completion text returned from Ollima" },
          { status: 500 },
        );
      }

      // 4. Clean markdown code fencing if returned by the LLM
      let cleaned = accumulated.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      // If there is leading/trailing text outside the outer JSON braces, extract the JSON block
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      // 5. Parse assembled JSON
      let resultJson: unknown;
      try {
        resultJson = JSON.parse(cleaned);
      } catch (parseErr) {
        console.warn(
          "SSE stream parse failed. Attempting non-streaming direct completion fallback:",
          parseErr,
        );

        // Non-streaming direct completion fallback
        try {
          const directRes = await fetch(completionsUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              stream: false,
              temperature: 0,
              top_p: 0.1,
              seed: 42,
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
            }),
          });
          if (directRes.ok) {
            const directData = (await directRes.json()) as Record<string, any>;
            const rawContent = directData.choices?.[0]?.message?.content || "";
            let directCleaned = rawContent.trim();
            if (directCleaned.startsWith("```json")) {
              directCleaned = directCleaned
                .replace(/^```json\s*/, "")
                .replace(/\s*```$/, "");
            } else if (directCleaned.startsWith("```")) {
              directCleaned = directCleaned
                .replace(/^```\s*/, "")
                .replace(/\s*```$/, "");
            }
            const fBrace = directCleaned.indexOf("{");
            const lBrace = directCleaned.lastIndexOf("}");
            if (fBrace !== -1 && lBrace !== -1 && lBrace > fBrace) {
              directCleaned = directCleaned.substring(fBrace, lBrace + 1);
            }
            resultJson = JSON.parse(directCleaned);
          } else {
            return NextResponse.json(
              { error: "Malformed JSON schema returned by AI gateway" },
              { status: 422 },
            );
          }
        } catch (directErr) {
          console.error("Non-streaming fallback also failed:", directErr);
          return NextResponse.json(
            { error: "Malformed JSON schema returned by AI gateway" },
            { status: 422 },
          );
        }
      }

      // 5. Expand V2.4 compact keys if needed, then post-process
      const expandedJson =
        resultJson &&
        typeof resultJson === "object" &&
        CompactKeyMapper.isCompactFormat(resultJson as Record<string, unknown>)
          ? CompactKeyMapper.expand(resultJson as Record<string, unknown>)
          : resultJson;

      // 6. Live Web Source Discovery (for plagiarism checks): query live web & repositories
      let liveWebCandidates: any[] = [];
      if (
        analysisType === "plagiarism" ||
        analysisType === "plagiarism-check"
      ) {
        try {
          liveWebCandidates = await WebPlagiarismMatcher.searchWebSources(text);
        } catch (searchErr) {
          console.warn("Live web search pass encountered error:", searchErr);
        }
      }

      const t4 = Date.now();
      const domainResult = ResultResponseValidator.toDomain(
        expandedJson,
        jobId || `job-api-${Date.now().toString(36)}`,
        documentName || "api-document.txt",
        text,
        `req-api-${Date.now().toString(36)}`,
        providerRequestId,
        model,
        liveWebCandidates,
      );
      const t5 = Date.now();
      const postProcessingTimeMs = t5 - t4;

      // Development-only forensic timing logs
      if (process.env.NODE_ENV === "development") {
        console.debug("=========================================");
        console.debug(
          `OLLIMA FORENSIC PIPELINE STATS (Model: ${model}, Prompt Version: ${promptVersion})`,
        );
        console.debug(`- Prompt Build Time:            ${promptBuildTimeMs}ms`);
        console.debug(`- LLM Streaming Completion:     ${completionTimeMs}ms`);
        console.debug(
          `- Validation & Scoring Engine:  ${postProcessingTimeMs}ms`,
        );
        console.debug(
          `- Total Server Execution Time:  ${promptBuildTimeMs + completionTimeMs + postProcessingTimeMs}ms`,
        );
        console.debug(
          `- AI Probability:               ${domainResult.scores.aiProbability.value}%`,
        );
        console.debug(
          `- Overall Originality:          ${domainResult.scores.overallOriginality.value}%`,
        );
        console.debug("=========================================");
      }

      return NextResponse.json({
        providerRequestId,
        result: domainResult,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        return NextResponse.json(
          { error: "Ollima API request timed out" },
          { status: 504 },
        );
      }
      throw fetchErr;
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
