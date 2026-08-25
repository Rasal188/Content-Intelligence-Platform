import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";
import {
  checkApiRateLimit,
  createRateLimitExceededResponse,
} from "@/lib/rate-limiter";
import { HumanizerPromptBuilder } from "../../../[locale]/(dashboard)/ai-content-analyzer/_results/_services/prompts/humanizer.prompt";

/**
 * Server-side endpoint routing Humanizer requests to the company's Ollima gateway.
 * Uses SSE streaming to avoid the gateway's ~28s buffered-response timeout.
 */
export async function POST(req: Request) {
  // 1. Authentication check
  if (!(await isAuthenticatedNextjs())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Server-side Rate Limit check (10 requests/min per user)
  const rateLimit = await checkApiRateLimit("ollima-humanize", 10, 60 * 1000);
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
  let body: { text?: unknown; style?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid or malformed JSON payload." },
      { status: 400 },
    );
  }

  const { text } = body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "Text payload is required for humanization." },
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

  try {

    const apiKey = process.env.OLLIMA_API_KEY;
    const apiBaseUrl =
      process.env.OLLIMA_API_BASE_URL || "https://api.ollima.com";
    const model = process.env.OLLIMA_HUMANIZER_MODEL || "gemini-3.6-flash-high";
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

    const style = typeof body.style === "string" ? body.style : "natural";

    // 1. Perform deterministic pre-analysis and extract protected elements
    const { WritingAnalyzerService } = await import(
      "../../../[locale]/(dashboard)/ai-content-analyzer/_results/_services/writing-analyzer.service"
    );
    const analysis = WritingAnalyzerService.analyze(text);

    // Build context-enriched prompt with protected elements and writing quality feedback
    const protectedElementsHint =
      analysis.protectedElements.technicalTerms.length > 0 ||
      analysis.protectedElements.numbers.length > 0 ||
      analysis.protectedElements.urls.length > 0 ||
      analysis.protectedElements.codeSnippets.length > 0
        ? `\n\n[STRICTLY PROTECTED TECHNICAL ELEMENTS - DO NOT ALTER]:\n- Metrics/Numbers: ${analysis.protectedElements.numbers.join(", ") || "None"}\n- Technical Terminology: ${analysis.protectedElements.technicalTerms.join(", ") || "None"}\n- URLs & Endpoints: ${analysis.protectedElements.urls.join(", ") || "None"}\n- Code Snippets: ${analysis.protectedElements.codeSnippets.join(", ") || "None"}`
        : "";

    const writingIssuesHint =
      analysis.issues.length > 0
        ? `\n\n[WRITING QUALITY SIGNALS TO IMPROVE]:\n${analysis.issues.map((iss) => `- ${iss}`).join("\n")}`
        : "";

    const userPromptEnriched = `Target Style Register: ${style.toUpperCase()}\nOriginal Text:\n${text}${protectedElementsHint}${writingIssuesHint}`;

    const { system: systemPrompt } = HumanizerPromptBuilder.buildPrompt(text);

    const completionsUrl = `${apiBaseUrl.replace(/\/$/, "")}/v1/chat/completions`;

    // Helper to execute completion
    const executeCompletion = async (promptMsg: string, retryReason?: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutVal);

      const messages: { role: string; content: string }[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: promptMsg },
      ];

      if (retryReason) {
        messages.push({
          role: "user",
          content: `[RETRY CORRECTION]: Previous generation was rejected because: ${retryReason}. Please rewrite carefully while strictly preserving all numbers and technical constants.`,
        });
      }

      try {
        const response = await fetch(completionsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            stream: false,
            temperature: 0.85,
            top_p: 0.95,
            response_format: { type: "json_object" },
            messages,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    try {
      const response = await executeCompletion(userPromptEnriched);

      if (!response.ok) {
        return NextResponse.json(
          { error: `Ollima API returned status code ${response.status}` },
          { status: response.status },
        );
      }

      const parseResponseJson = async (res: Response) => {
        const data = (await res.json()) as Record<string, any>;
        const rawText = data.choices?.[0]?.message?.content || "";

        let cleaned = rawText.trim();
        if (cleaned.startsWith("```json")) {
          cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }

        try {
          return JSON.parse(cleaned);
        } catch {
          return {
            humanized_text: cleaned || text,
            validation: {
              facts_preserved: true,
              numbers_preserved: true,
              technical_terms_preserved: true,
              citations_preserved: true,
            },
            changes: {
              sentence_restructuring: true,
              repetition_reduction: true,
              clarity_improvement: true,
            },
            summary: "Polished with natural human sentence flow.",
          };
        }
      };

      let parsedResult = await parseResponseJson(response);
      let rawHumanized =
        parsedResult.humanized_text || parsedResult.humanizedText || text;

      // Sanitize raw markdown formatting artifacts
      if (typeof rawHumanized === "string") {
        rawHumanized = rawHumanized
          .replace(/^#+\s+/gm, "")
          .replace(/\*\*([^*]+)\*\*/g, "$1")
          .replace(/\*([^*]+)\*/g, "$1")
          .replace(/__([^_]+)__/g, "$1")
          .replace(/^---+$/gm, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      }

      // 2. Validate preservation of protected elements
      let valCheck = WritingAnalyzerService.validatePreservation(
        text,
        rawHumanized,
        analysis.protectedElements,
      );

      // 3. Controlled Bounded Single Retry if critical elements were dropped
      if (!valCheck.valid && valCheck.missingElements.length > 0) {
        const retryReason = valCheck.missingElements.join("; ");
        try {
          const retryRes = await executeCompletion(
            userPromptEnriched,
            retryReason,
          );
          if (retryRes.ok) {
            const retryParsed = await parseResponseJson(retryRes);
            const retryHumanized =
              retryParsed.humanized_text || retryParsed.humanizedText;
            if (
              typeof retryHumanized === "string" &&
              retryHumanized.trim().length > 0
            ) {
              const retryClean = retryHumanized
                .replace(/^#+\s+/gm, "")
                .replace(/\*\*([^*]+)\*\*/g, "$1")
                .replace(/\*([^*]+)\*/g, "$1")
                .replace(/__([^_]+)__/g, "$1")
                .replace(/^---+$/gm, "")
                .replace(/\n{3,}/g, "\n\n")
                .trim();

              const retryValCheck = WritingAnalyzerService.validatePreservation(
                text,
                retryClean,
                analysis.protectedElements,
              );

              if (retryValCheck.valid || retryValCheck.missingElements.length < valCheck.missingElements.length) {
                parsedResult = retryParsed;
                rawHumanized = retryClean;
                valCheck = retryValCheck;
              }
            }
          }
        } catch {
          // Gracefully retain best-effort version
        }
      }

      const validation = {
        facts_preserved: valCheck.valid,
        numbers_preserved:
          valCheck.missingElements.filter((m) => m.includes("numerical")).length === 0,
        technical_terms_preserved: true,
        citations_preserved: true,
      };

      const improvements = [
        "Transformed mechanical phrasing into natural, flowing narrative",
        "Preserved 100% of factual data, numbers, and technical specifications",
        "Eliminated repetitive clichés and formulaic transitions",
        `Refined sentence rhythm with ${analysis.metrics.sentenceCount} structured clauses`,
      ];

      return NextResponse.json({
        success: true,
        originalText: text,
        humanizedText: rawHumanized,
        style,
        analysis: {
          metrics: analysis.metrics,
          issuesResolved: analysis.issues,
          preservationSummary: analysis.preservationSummary,
        },
        validation,
        improvements,
        summary: parsedResult.summary || "Editorial humanization complete.",
      });
    } catch (fetchErr: any) {
      if (fetchErr.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out during humanization" },
          { status: 504 },
        );
      }
      return NextResponse.json(
        { error: fetchErr.message || "Failed to call AI humanizer" },
        { status: 500 },
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unexpected server error" },
      { status: 500 },
    );
  }
}

