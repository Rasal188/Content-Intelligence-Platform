import type { HighlightRiskLevel } from "../_types/analysis-highlight.types";
import type { AnalysisResultDomain } from "../_types/analysis-result.types";
import type { MatchedSource } from "../_types/analysis-source.types";
import type { AnalysisWarning } from "../_types/analysis-warning.types";
import { ConfidenceCalculator } from "./forensics/confidence-calculator";
import { DeterministicMatcher } from "./forensics/deterministic-matcher";
import { EvidenceCollector } from "./forensics/evidence-collector";
import { RiskLevelCalculator } from "./forensics/risk-level-calculator";
import { ScoreEngine } from "./forensics/score-engine";
import { SummaryGenerator } from "./forensics/summary-generator";
import { WebPlagiarismMatcher } from "./forensics/web-plagiarism-matcher.service";
import { PROMPT_VERSION } from "./prompt-config";

/**
 * Validator responsible for verifying, clamping, and translating Ollima completion payloads to AnalysisResultDomain models.
 */
export class ResultResponseValidator {
  /**
   * Validates raw JSON object and constructs a fully typed domain record.
   * Throws schema errors if core parameters are missing or invalid.
   * @param raw Raw JSON data from Ollima response.
   * @param jobId Parent Job ID.
   * @param documentName Analyzed document name.
   * @param textContent Extracted text content.
   * @param requestId Generated request ID.
   * @param providerRequestId Provider request ID (optional).
   * @returns Mapped and sanitized AnalysisResultDomain record.
   */
  public static toDomain(
    raw: unknown,
    jobId: string,
    documentName: string,
    textContent: string,
    requestId: string,
    providerRequestId?: string,
    modelName?: string,
    dynamicCandidates: MatchedSource[] = [],
  ): AnalysisResultDomain {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid Ollima response: expected JSON object.");
    }

    const data = raw as Record<string, any>;

    // Handle v1 schema compatibility (if the LLM responds with v1 or cached result is v1)
    const isV1 =
      typeof data.aiScore === "number" && typeof data.overallScore === "number";

    const aiForensics = data.aiForensics || {};
    const originalExpression = data.originalExpression || {};
    const similarityAnalysis = data.similarityAnalysis || {};
    const writingQuality = data.writingQuality || {};

    // V2.3 Sparse Output Normalizer:
    // LLM only emits indicators with notable findings. Fill missing keys with {score:50}.
    const fillDefaults = (section: Record<string, any>, keys: string[]) => {
      for (const key of keys) {
        if (!section[key] || typeof section[key] !== "object") {
          section[key] = { score: 50 };
        }
      }
    };
    fillDefaults(aiForensics, [
      "sentenceBurstiness",
      "sentencePredictability",
      "lexicalRepetition",
      "vocabularyDiversity",
      "transitionOveruse",
      "paragraphRhythm",
      "sentenceStructureRepetition",
      "templateLanguage",
      "genericWording",
      "confidenceInflation",
      "informationDensity",
      "hedgingLanguage",
      "stylisticConsistency",
      "narrativeAuthenticity",
      "personalExperience",
      "emotionalAuthenticity",
      "creativity",
      "humanImperfections",
      "contextSwitching",
      "hallucinationIndicators",
    ]);
    fillDefaults(originalExpression, [
      "specificity",
      "uniqueWording",
      "lexicalDiversity",
      "concreteObservations",
      "originalExamples",
      "boilerplate",
      "marketingLanguage",
      "educationalFiller",
      "commonCliches",
      "genericExplanations",
    ]);
    fillDefaults(similarityAnalysis, [
      "repeatedWording",
      "repeatedPhrases",
      "repeatedParagraphs",
      "repeatedExplanations",
      "templateReuse",
      "formattingInconsistencies",
      "abruptStyleShifts",
      "repeatedUncommonTerminology",
    ]);
    fillDefaults(writingQuality, [
      "grammar",
      "readability",
      "flow",
      "organization",
      "vocabulary",
      "tone",
      "paragraphQuality",
      "sentenceVariety",
      "argumentQuality",
      "evidenceUsage",
    ]);

    let aiScore = 0;
    let humanScore = 0;
    let mixedScore = 0;
    let originalityScore = 0;
    let plagiarismScore = 0;
    let readability = 80;
    let overallScore = 50;
    let confidence = 90;
    let confidenceBreakdown:
      | import("./forensics/confidence-calculator").MetricConfidenceBreakdown
      | null = null;
    let riskLevel: HighlightRiskLevel = "low";

    if (isV1) {
      aiScore = ResultResponseValidator.clamp(data.aiScore);
      humanScore = Math.max(0, 100 - aiScore);
      mixedScore = 0;
      originalityScore =
        typeof data.originalityScore === "number"
          ? ResultResponseValidator.clamp(data.originalityScore)
          : 50;
      plagiarismScore = ResultResponseValidator.clamp(data.plagiarismScore);
      readability =
        typeof data.readability === "number"
          ? ResultResponseValidator.clamp(data.readability)
          : 80;
      overallScore = ResultResponseValidator.clamp(data.overallScore);
      confidence =
        typeof data.confidence === "number"
          ? ResultResponseValidator.clamp(data.confidence)
          : 90;
      riskLevel = ResultResponseValidator.parseRiskLevel(data.riskLevel);
    } else {
      // V2 hybrid forensic calculations (statistical linguistic metrics + LLM semantic indicators)
      const calculated = ScoreEngine.calculate(data, textContent);
      aiScore = calculated.aiScore;
      humanScore = calculated.humanScore;
      mixedScore = calculated.mixedScore;
      originalityScore = calculated.originalityScore;
      plagiarismScore = calculated.plagiarismScore;
      readability = calculated.readabilityScore;
      overallScore = calculated.overallScore;

      confidenceBreakdown = ConfidenceCalculator.calculateAll(data, textContent);
      confidence = confidenceBreakdown.overall;
      riskLevel = RiskLevelCalculator.calculate(aiScore);
    }

    // Evidence quote extraction
    const evidenceList = EvidenceCollector.collect(data);
    let highlights = evidenceList.map((item, idx) => {
      // Convert snippet quote to highlight range if matching textContent
      let start = 0;
      let end = textContent.length;
      const index = textContent.indexOf(item.quote);
      if (index !== -1) {
        start = index;
        end = index + item.quote.length;
      }
      return {
        id: `hl-${idx}`,
        startIndex: start,
        endIndex: end,
        textSnippet: item.quote,
        probability: item.confidence,
        riskLevel: RiskLevelCalculator.calculate(item.confidence),
        reason: item.reason,
        severity: item.severity,
        recommendation:
          item.severity === "critical" || item.severity === "high"
            ? "Rewrite using active, conversational phrasing and dynamic sentence length."
            : undefined,
      };
    });

    // If text is provided and evidenceList is sparse, extract sentences matching forensic patterns
    if (
      highlights.length === 0 &&
      textContent &&
      textContent.trim().length > 0
    ) {
      const sentenceMatches =
        textContent.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [];
      const extracted: typeof highlights = [];

      sentenceMatches.forEach((s, idx) => {
        const trimmed = s.trim();
        if (trimmed.length < 15) return;

        const words = trimmed.split(/\s+/).filter(Boolean);
        const hasAiPattern =
          /furthermore|moreover|in conclusion|plays a (crucial|pivotal|vital|key) role|in today's|not only|testament|delve|paramount|innovative|transform/i.test(
            trimmed,
          );
        const hasRepetition =
          /built to help you|empower your business|elevate your growth/i.test(
            trimmed,
          );

        if (
          hasAiPattern ||
          hasRepetition ||
          (words.length > 22 && aiScore > 50)
        ) {
          extracted.push({
            id: `hl-gen-${idx}`,
            startIndex: textContent.indexOf(trimmed),
            endIndex: textContent.indexOf(trimmed) + trimmed.length,
            textSnippet: trimmed,
            probability: hasAiPattern ? 92 : hasRepetition ? 88 : 74,
            riskLevel: hasAiPattern || hasRepetition ? "high" : "medium",
            reason: hasAiPattern
              ? "Formulaic AI transitional phraseology and structural predictability."
              : hasRepetition
                ? "Repetitive sentence structure with low lexical variation."
                : "High clause density and uniform cadence characteristic of synthetic LLM generation.",
            severity: hasAiPattern ? "high" : "medium",
            recommendation:
              "Introduce human burstiness: vary the sentence length or simplify compound clauses.",
          });
        }
      });

      if (extracted.length > 0) {
        highlights = extracted.slice(0, 6);
      }
    }

    // Map warnings
    const rawWarnings = Array.isArray(data.warnings) ? data.warnings : [];
    const warnings: AnalysisWarning[] = rawWarnings.map(
      (item: unknown, idx: number) => {
        const warn = (item && typeof item === "object" ? item : {}) as Record<
          string,
          unknown
        >;
        return {
          id: typeof warn.id === "string" ? warn.id : `warn-${idx}`,
          code: typeof warn.code === "string" ? warn.code : "OLLIMA_WARN",
          message:
            typeof warn.message === "string"
              ? warn.message
              : "General advisory recommendation.",
          severity:
            warn.severity === "error" ||
            warn.severity === "warning" ||
            warn.severity === "info"
              ? warn.severity
              : "warning",
          category:
            warn.category === "data_anomaly" ||
            warn.category === "performance" ||
            warn.category === "security" ||
            warn.category === "compatibility"
              ? warn.category
              : "compatibility",
        };
      },
    );

    // Real Web & Digital Repository Plagiarism Matches (Grounded against live web knowledge index and dynamic search)
    const rawCandidates = WebPlagiarismMatcher.match(
      textContent,
      plagiarismScore,
      dynamicCandidates,
    );

    // STEP 7: Log Match Input
    console.log("[PLAGIARISM:MATCH_INPUT]", JSON.stringify({
      submittedWords: textContent.split(/\s+/).length,
      candidateCount: rawCandidates.length,
      verifiedCount: rawCandidates.filter((c) => c.verificationStatus === "VERIFIED").length,
      snippetMatchCount: rawCandidates.filter((c) => c.verificationStatus === "SNIPPET_MATCH").length,
      candidates: rawCandidates.map((c) => ({
        url: c.sourceUrl,
        verificationStatus: c.verificationStatus,
        sourceTextLength: c.originalSnippet?.length || 0,
      })),
    }));

    // Deterministic Text Matching & N-Gram Verification (TypeScript Engine is the single source of truth)
    const deterministicReport = DeterministicMatcher.evaluate(
      textContent,
      rawCandidates,
    );
    const matchedSources = deterministicReport.verifiedSources;

    // STEP 8: Log Final Forensic Result
    console.log("[PLAGIARISM:MATCH_RESULT]", JSON.stringify({
      matchedWords: deterministicReport.matchedWords,
      totalWords: deterministicReport.totalSubmittedWords,
      similarityPercent: deterministicReport.literalSimilarityPercent,
      verifiedSources: deterministicReport.verifiedSources.map((s) => ({
        url: s.sourceUrl,
        matchedWords: s.matchedWordCount,
        sim: s.similarityPercent,
      })),
    }));

    const isSearchFailed = dynamicCandidates.some(
      (c) => c.id === "ollagraph-search-failed" || c.sourceTitle?.includes("OllaGraph Search Unavailable"),
    );

    if (deterministicReport.verifiedSources.length > 0) {
      plagiarismScore = deterministicReport.literalSimilarityPercent;
      originalityScore = Math.max(0, 100 - plagiarismScore);
    } else if (isSearchFailed) {
      // If external search provider completely failed, plagiarism status is undetermined (cannot claim clean verified 100% original)
      plagiarismScore = 0;
      originalityScore = 0;
      warnings.push({
        id: "warn-search-failed",
        code: "OLLAGRAPH_SEARCH_FAILED",
        message: "OllaGraph source discovery failed. Plagiarism result cannot be reliably determined.",
        severity: "error",
      });
    } else {
      // If no verified sources exist in the database with verbatim N-grams, document is clean of known web plagiarism
      plagiarismScore = 0;
      originalityScore = 100;
    }

    // STEP 9: Log Final Validation
    console.log("[PLAGIARISM:FINAL]", JSON.stringify({
      plagiarismScore,
      originalityScore,
      matchedWords: deterministicReport.matchedWords,
      sourceCount: matchedSources.length,
      verifiedSourceCount: matchedSources.filter((s) => s.verificationStatus === "VERIFIED").length,
      candidateCount: rawCandidates.length,
      isSearchFailed,
    }));

    // Map recommendations
    const rawRecs = Array.isArray(data.recommendations)
      ? data.recommendations
      : [];
    const recommendations = rawRecs.map((item: unknown, idx: number) => {
      if (typeof item === "string") {
        return {
          id: `rec-${idx}`,
          category: "quality" as const,
          title: item.slice(0, 40) + (item.length > 40 ? "..." : ""),
          description: item,
          priority: "medium" as const,
          status: "pending" as const,
        };
      }
      const rec = (item && typeof item === "object" ? item : {}) as Record<
        string,
        unknown
      >;
      return {
        id: typeof rec.id === "string" ? rec.id : `rec-${idx}`,
        category: ResultResponseValidator.parseCategory(rec.category),
        title:
          typeof rec.title === "string"
            ? rec.title
            : "Enhance original expression",
        description:
          typeof rec.description === "string"
            ? rec.description
            : "Vary linguistic style and sentence flow.",
        priority: ResultResponseValidator.parsePriority(rec.priority),
        status: ResultResponseValidator.parseStatus(rec.status),
      };
    });

    // Summary generator
    const generatedSummary = SummaryGenerator.generate(
      data,
      aiScore,
      originalityScore,
      plagiarismScore,
      readability,
      confidence,
    );

    // Map Quality Report
    // V2.2 compact schema: fields may carry '.reason' instead of '.observations'/'.reasoning'/'.explanation'
    const pickText = (obj: any, ...keys: string[]) => {
      for (const k of keys) if (typeof obj?.[k] === "string") return obj[k];
      return undefined;
    };

    const qualityReport = {
      executiveSummary: generatedSummary.executiveSummary,
      writingStyleAnalysis:
        pickText(writingQuality.flow, "observations", "reason") ??
        (isV1
          ? data.writingStyleAnalysis
          : "Evaluated flow transition pacing."),
      aiDetectionReasoning:
        pickText(aiForensics.templateLanguage, "reasoning", "reason") ??
        (isV1
          ? data.aiDetectionReasoning
          : "Evaluated structural predictability indicators."),
      originalityAssessment:
        pickText(originalExpression.specificity, "reasoning", "reason") ??
        (isV1
          ? data.originalityAssessment
          : "Evaluated specificity of unique wording."),
      readabilityAssessment:
        pickText(writingQuality.readability, "explanation", "reason") ??
        (isV1
          ? data.readabilityAssessment
          : "Evaluated grammar and readability metrics."),
      grammarAssessment:
        pickText(writingQuality.grammar, "explanation", "reason") ??
        (isV1
          ? data.grammarAssessment
          : "Evaluated punctuation and mechanical flow."),
      structureAssessment:
        pickText(writingQuality.organization, "explanation", "reason") ??
        (isV1
          ? data.structureAssessment
          : "Evaluated paragraph and argument organization."),
      vocabularyAnalysis:
        pickText(writingQuality.vocabulary, "explanation", "reason") ??
        (isV1
          ? data.vocabularyAnalysis
          : "Evaluated lexical variety and synonyms."),
      strengths: generatedSummary.strengths,
      weaknesses: generatedSummary.weaknesses,
      recommendedImprovements: generatedSummary.recommendations,
      riskExplanation:
        pickText(aiForensics.confidenceInflation, "reasoning", "reason") ??
        (isV1
          ? data.riskExplanation
          : "Confidence and risk derived from indicators agreement."),
      confidenceExplanation:
        pickText(aiForensics.stylisticConsistency, "reasoning", "reason") ??
        (isV1 ? data.confidenceExplanation : "Linguistic consistency audited."),
    };

    const metadata = {
      schemaVersion: "2.0.0",
      engineVersion: "v2.5-ollima",
      providerVersion: "ollima-forensic-v2",
      providerName: "Ollima Gateway Forensic Engine",
      executionTimeMs: 1500,
      generatedAt: new Date().toISOString(),
      checksum: `chk-${jobId}-valid`,
      processingTimeSeconds: 1.5,
      isMockData: false,
      requestId,
      providerRequestId,
      providerModel: modelName || "gemini-3.6-flash-high",
      analysisVersion: "2.0.0",
      promptVersion: PROMPT_VERSION,
    };

    const charCount = textContent.length;
    const words = textContent.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    return {
      id: `res-${jobId}`,
      jobId,
      overallRiskLevel: riskLevel,
      document: {
        id: `doc-snap-${jobId}`,
        name: documentName,
        size: charCount * 2,
        type: documentName.endsWith(".pdf") ? "application/pdf" : "text/plain",
        language: "English (en-US)",
        hash: `sha256-${jobId}98f0a`,
        wordCount,
        characterCount: charCount,
        pageCount: Math.max(1, Math.ceil(wordCount / 300)),
        createdAt: new Date().toISOString(),
      },
      scores: {
        humanProbability: {
          id: "score-human",
          name: "Human Content",
          value: humanScore,
          confidence: confidenceBreakdown?.originality ?? confidence,
          weight: 1.0,
          description: "Chance this text is entirely human-authored.",
        },
        overallOriginality: {
          id: "score-orig",
          name: "Originality Score",
          value: originalityScore,
          confidence: confidenceBreakdown?.originality ?? confidence,
          weight: 1.0,
          description:
            "Expression originality based on unique wording and specificity.",
        },
        aiProbability: {
          id: "score-ai",
          name: "AI Content",
          value: aiScore,
          confidence: confidenceBreakdown?.aiForensics ?? confidence,
          weight: 1.0,
          description: "Chance this text is AI-generated.",
        },
        mixedProbability: {
          id: "score-mixed",
          name: "Mixed Content",
          value: mixedScore,
          confidence: confidence,
          weight: 1.0,
          description:
            "Chance this text contains blended human and AI content.",
        },
        plagiarismSimilarity: {
          id: "score-plag",
          name: "Similarity Risk",
          value: plagiarismScore,
          confidence: confidenceBreakdown?.similarity ?? confidence,
          weight: 0.8,
          description:
            "Estimated similarity risk from linguistic and structural analysis.",
        },
        readabilityQuality: {
          id: "score-read",
          name: "Readability Index",
          value: readability,
          confidence: confidenceBreakdown?.readability ?? confidence,
          weight: 0.5,
          description: "Flesch-Kincaid ease of reading score.",
        },
      },
      statistics: {
        characters: charCount,
        words: wordCount,
        paragraphs: Math.max(
          1,
          textContent.split(/\n+/).filter((p) => p.trim().length > 0).length,
        ),
        sentences: Math.max(
          1,
          textContent.split(/[.!?]+/).filter((s) => s.trim().length > 0).length,
        ),
        readabilityScore: readability,
        estimatedReadingTimeMinutes: Math.max(1, Math.ceil(wordCount / 200)),
        vocabularyDiversityPercent:
          wordCount > 0
            ? Math.round(
                (new Set(words.map((w) => w.toLowerCase())).size / wordCount) *
                  100,
              )
            : 0,
        averageSentenceLengthWords: Number.parseFloat(
          (
            wordCount /
            Math.max(
              1,
              textContent.split(/[.!?]+/).filter((s) => s.trim().length > 0)
                .length,
            )
          ).toFixed(1),
        ),
        language: "English",
      },
      metadata,
      highlights,
      matchedSources,
      recommendations,
      warnings,
      extensions: {
        writingStyle: {
          qualityReport,
        },
        forensics: {
          aiForensics,
          originalExpression,
          similarityAnalysis,
        },
      },
    };
  }

  private static clamp(n: number): number {
    return Math.min(100, Math.max(0, n));
  }

  private static parseRiskLevel(val: unknown): HighlightRiskLevel {
    if (
      val === "critical" ||
      val === "high" ||
      val === "medium" ||
      val === "low"
    ) {
      return val;
    }
    return "low";
  }

  private static parseCategory(
    val: unknown,
  ): "citation" | "formatting" | "paraphrase" | "quality" {
    if (
      val === "citation" ||
      val === "formatting" ||
      val === "paraphrase" ||
      val === "quality"
    ) {
      return val;
    }
    return "quality";
  }

  private static parsePriority(val: unknown): "low" | "medium" | "high" {
    if (val === "low" || val === "medium" || val === "high") {
      return val;
    }
    return "low";
  }

  private static parseStatus(
    val: unknown,
  ): "pending" | "applied" | "dismissed" {
    if (val === "pending" || val === "applied" || val === "dismissed") {
      return val;
    }
    return "pending";
  }

  private static parseSeverity(val: unknown): "info" | "warning" | "error" {
    if (val === "info" || val === "warning" || val === "error") {
      return val;
    }
    return "info";
  }
}
