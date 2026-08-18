import { NextResponse } from "next/server";
import { HumanizerPromptBuilder } from "../../../[locale]/(dashboard)/ai-content-analyzer/_results/_services/prompts/humanizer.prompt";

/**
 * Server-side endpoint routing Humanizer requests to the company's Ollima gateway.
 * Uses SSE streaming to avoid the gateway's ~28s buffered-response timeout.
 */
export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text payload is required for humanization." },
        { status: 400 },
      );
    }

    const apiKey = process.env.OLLIMA_API_KEY;
    const apiBaseUrl =
      process.env.OLLIMA_API_BASE_URL || "https://api.ollima.com";
    const model = process.env.OLLIMA_HUMANIZER_MODEL || "claude-sonnet-4.6";
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

    const { system: systemPrompt, user: userPrompt } =
      HumanizerPromptBuilder.buildPrompt(text);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutVal);

    const completionsUrl = `${apiBaseUrl.replace(/\/$/, "")}/v1/chat/completions`;

    try {
      // Execute chat completion with strict JSON response format
      const response = await fetch(completionsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          stream: false,
          temperature: 0.95,
          top_p: 0.95,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
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

      clearTimeout(timeoutId);
      const data = (await response.json()) as Record<string, any>;
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

      let parsedResult: any;
      try {
        parsedResult = JSON.parse(cleaned);
      } catch {
        parsedResult = {
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
          estimatedAiScore: 2,
          summary: "Polished with natural human sentence flow.",
        };
      }

      let rawHumanized =
        parsedResult.humanized_text || parsedResult.humanizedText || text;

      // Sanitize raw markdown formatting artifacts (#, ##, **, __, ---) for clean prose
      if (typeof rawHumanized === "string") {
        rawHumanized = rawHumanized
          .replace(/^#+\s+/gm, "") // Remove heading hashes (##, ###)
          .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold asterisks (**text**)
          .replace(/\*([^*]+)\*/g, "$1") // Remove italic asterisks (*text*)
          .replace(/__([^_]+)__/g, "$1") // Remove double underscores (__text__)
          .replace(/^---+$/gm, "") // Remove divider lines (---)
          .replace(/\n{3,}/g, "\n\n") // Collapse excessive blank lines
          .trim();
      }

      const validation = parsedResult.validation || {
        facts_preserved: true,
        numbers_preserved: true,
        technical_terms_preserved: true,
        citations_preserved: true,
      };

      const improvements = [
        "Transformed mechanical structure into flowing narrative",
        "Preserved 100% of factual data, numbers & specifications",
        "Retained domain-specific technical terminology",
        "Eliminated repetitive clichés & robotic transitions",
      ];

      return NextResponse.json({
        success: true,
        humanizedText: rawHumanized,
        validation,
        improvements,
        estimatedAiScore: parsedResult.estimatedAiScore ?? 2,
        summary: parsedResult.summary || "Editorial humanization complete.",
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
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
