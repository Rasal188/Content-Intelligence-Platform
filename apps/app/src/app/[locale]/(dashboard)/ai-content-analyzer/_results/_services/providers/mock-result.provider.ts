import type { HighlightRiskLevel } from "../../_types/analysis-highlight.types";
import type { AnalysisResultDomain } from "../../_types/analysis-result.types";
import type { AnalysisWarning } from "../../_types/analysis-warning.types";

/**
 * Interface contract for Result Engine Data Providers.
 * Future provider integrations (e.g., GeminiProvider, OpenAIProvider, ClaudeProvider)
 * will implement this contract.
 */
export interface IResultProvider {
  /**
   * Generates analysis result based on document content.
   */
  generateResult(
    jobId: string,
    documentName: string,
    textContent?: string,
    requestId?: string,
  ): Promise<AnalysisResultDomain>;
}

/**
 * Deterministic mock result provider generating realistic test payload datasets
 * derived from document characteristics and rules.
 *
 * TODO: Integrate real providers. Example extension points:
 * - GeminiProvider: Call Google Gemini API for pattern identification
 * - OpenAIProvider: Call GPT models for risk detection
 * - ClaudeProvider: Call Anthropic Claude API for structural evaluation
 * - OllamaProvider: Local running LLM model validation
 */
export class MockResultProvider implements IResultProvider {
  /**
   * Generates a deterministic AnalysisResultDomain model derived from text attributes.
   * @param jobId Parent job ID.
   * @param documentName Name of analyzed document.
   * @param textContent Optional raw text content.
   * @returns Promise resolving to AnalysisResultDomain entity.
   */
  async generateResult(
    jobId: string,
    documentName: string,
    textContent = "",
    requestId?: string,
  ): Promise<AnalysisResultDomain> {
    const trimmedText = textContent.trim();
    const isEmpty = trimmedText.length === 0;

    // 1. Calculate Real Document Statistics
    const charCount = textContent.length;
    const words = isEmpty ? [] : trimmedText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const paragraphs = isEmpty
      ? []
      : trimmedText.split(/\n+/).filter((p) => p.trim().length > 0);
    const paragraphCount = paragraphs.length;

    // Split sentences using standard punctuation marks
    const sentences = isEmpty
      ? []
      : trimmedText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length;

    const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const estimatedReadingTime = Math.max(
      isEmpty ? 0 : 1,
      Math.ceil(wordCount / 200),
    );

    // Calculate unique words for vocabulary diversity
    const uniqueWords = new Set(
      words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, "")),
    );
    const uniqueWordCount = uniqueWords.size;
    const vocabularyDiversity =
      wordCount > 0 ? Math.round((uniqueWordCount / wordCount) * 100) : 0;

    // Calculate syllables and readability index (Flesch Reading Ease approximation)
    let totalSyllables = 0;
    for (const word of words) {
      totalSyllables += this.countWordSyllables(word);
    }
    const avgSyllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 0;
    let readabilityScore = 0;
    if (wordCount > 0 && sentenceCount > 0) {
      // Flesch Reading Ease Score
      const rawReadability =
        206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
      readabilityScore = Math.min(100, Math.max(0, Math.round(rawReadability)));
    }

    const hashNum = this.simpleHash(documentName + trimmedText.slice(0, 100));

    // 2. Calculate Dynamic Confidence (longer docs -> higher confidence)
    let calculatedConfidence = -1; // Sentinel for disabled/empty
    if (!isEmpty) {
      // Base confidence 55, scales up to 99 with word count & sentence diversity
      const wordScore = Math.min(30, wordCount / 15); // max 30 points at 450 words
      const paragraphScore = Math.min(10, paragraphCount * 2); // max 10 points at 5 paragraphs
      const completenessScore = sentenceCount > 3 ? 4 : 0;
      calculatedConfidence = Math.min(
        99,
        Math.max(
          50,
          Math.round(55 + wordScore + paragraphScore + completenessScore),
        ),
      );
    }

    // 3. Deterministic Mock Values
    // Check for typical LLM pattern indicators (e.g. buzzwords)
    const buzzwords = [
      "furthermore",
      "moreover",
      "in conclusion",
      "testament",
      "delve",
      "pivotal",
      "tapestry",
      "demystify",
      "beacon",
      "catalyst",
    ];
    const buzzCount = words.filter((w) =>
      buzzwords.includes(w.toLowerCase()),
    ).length;
    const buzzRatio = wordCount > 0 ? buzzCount / wordCount : 0;

    let aiVal = -1;
    let origVal = -1;
    let plagVal = -1;

    if (!isEmpty) {
      // Deterministic calculations based on content traits and hash
      aiVal = Math.min(
        98,
        Math.max(2, Math.round(buzzRatio * 200 + (hashNum % 30) + 5)),
      );
      origVal = 100 - aiVal;
      plagVal = Math.min(
        100,
        Math.max(0, Math.round(((hashNum % 7) + (wordCount % 5)) * 1.5)),
      );
    }

    let riskLevel: HighlightRiskLevel = "low";
    if (aiVal > 75) riskLevel = "critical";
    else if (aiVal > 45) riskLevel = "high";
    else if (aiVal > 20) riskLevel = "medium";

    // 4. Construct Diagnostic Warnings
    const warningsList: AnalysisWarning[] = [
      {
        id: "warn-transparency",
        code: "DEV_MODE_MOCK",
        message:
          "Development Mode: Results generated by Mock Rule Engine using deterministic rules. No AI model or external provider was used.",
        severity: "info",
      },
    ];

    if (isEmpty) {
      warningsList.unshift({
        id: "warn-empty-doc",
        code: "EMPTY_DOCUMENT",
        message:
          "The submitted document is empty or contains no readable text content. Analysis metrics are disabled.",
        severity: "error" as const,
      });
    }

    return {
      id: `res-${jobId}`,
      jobId,
      overallRiskLevel: isEmpty ? "low" : riskLevel,
      document: {
        id: `doc-snap-${jobId}`,
        name: documentName,
        size: charCount * 2,
        type: documentName.endsWith(".pdf") ? "application/pdf" : "text/plain",
        language: "English (en-US)",
        hash: `sha256-${hashNum}98f0a`,
        wordCount,
        characterCount: charCount,
        pageCount: Math.max(isEmpty ? 0 : 1, Math.ceil(wordCount / 300)),
        createdAt: new Date().toISOString(),
      },
      scores: {
        overallOriginality: {
          id: "score-orig",
          name: "Originality Score",
          value: origVal,
          confidence: Math.max(65, Math.min(95, calculatedConfidence + 4)),
          weight: 1.0,
          description:
            "Estimated originality based on linguistic and structural analysis.",
        },
        aiProbability: {
          id: "score-ai",
          name: "AI Probability",
          value: aiVal,
          confidence: calculatedConfidence,
          weight: 1.0,
          description:
            "Estimated likelihood that the writing exhibits AI-generated characteristics.",
        },
        plagiarismSimilarity: {
          id: "score-plag",
          name: "Similarity Risk",
          value: plagVal,
          confidence: Math.max(60, Math.min(92, calculatedConfidence - 3)),
          weight: 0.8,
          description:
            "Estimated similarity risk from linguistic and structural analysis.",
        },
        readabilityQuality: {
          id: "score-read",
          name: "Readability Index",
          value: isEmpty ? -1 : readabilityScore,
          confidence: Math.max(70, Math.min(96, calculatedConfidence + 8)),
          weight: 0.5,
          description: "Flesch-Kincaid ease of reading score.",
        },
      },
      statistics: {
        characters: charCount,
        words: wordCount,
        paragraphs: paragraphCount,
        sentences: sentenceCount,
        readabilityScore: isEmpty ? -1 : readabilityScore,
        estimatedReadingTimeMinutes: estimatedReadingTime,
        vocabularyDiversityPercent: vocabularyDiversity,
        averageSentenceLengthWords: Number.parseFloat(
          avgSentenceLength.toFixed(1),
        ),
        language: "English",
      },
      metadata: {
        schemaVersion: "1.0.0",
        engineVersion: "v2.5-rule-engine",
        providerVersion: "mock-provider-v2",
        providerName: "AI Content Analyzer Mock Engine",
        executionTimeMs: isEmpty ? 10 : 850 + (hashNum % 300),
        generatedAt: new Date().toISOString(),
        checksum: `chk-${hashNum}-deterministic`,
        processingTimeSeconds: isEmpty
          ? 0.01
          : Number.parseFloat(((850 + (hashNum % 300)) / 1000).toFixed(2)),
        isMockData: true,
        requestId:
          requestId ||
          `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      },
      highlights: isEmpty
        ? []
        : [
            {
              id: "hl-1",
              startIndex: 0,
              endIndex: Math.min(120, charCount),
              textSnippet: textContent.slice(0, 120),
              probability: aiVal + (hashNum % 10),
              riskLevel: riskLevel,
              reason:
                buzzCount > 0
                  ? `LLM transition phrases like "${buzzwords.find((w) => textContent.toLowerCase().includes(w))}" detected in text.`
                  : "Repetitive sentence structures and low perplexity observed.",
            },
          ],
      matchedSources: isEmpty
        ? []
        : [
            {
              id: "src-1",
              sourceTitle: "Academic Research Archive & Data Index",
              sourceUrl: "https://example.com/research-archive",
              similarityPercent: plagVal,
              matchedSnippet: textContent.slice(0, 50),
              originalSnippet:
                "Direct matches found in indexed publications database.",
              publication: "Journal of Modern Content Analysis",
              author: "Dr. Elizabeth Vance",
            },
          ],
      recommendations: isEmpty
        ? []
        : [
            {
              id: "rec-1",
              category: "quality",
              title: "Vary Sentence Length",
              description:
                "Varying sentence structures improves readability and reduces artificial pattern scores.",
              priority: "medium",
              status: "pending",
            },
            {
              id: "rec-2",
              category: "citation",
              title: "Add Source Citation",
              description:
                "Ensure references to external statistics include direct citations.",
              priority: "low",
              status: "pending",
            },
          ],
      warnings: warningsList,
      extensions: {},
    };
  }

  /**
   * Generates a simple hash code from string inputs.
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Approximates the number of syllables in an English word.
   */
  private countWordSyllables(word: string): number {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
    if (cleanWord.length <= 3) return 1;
    // Remove common silent endings
    const processedWord = cleanWord
      .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
      .replace(/^y/, "");
    const vowels = processedWord.match(/[aeiouy]{1,2}/g);
    return vowels ? vowels.length : 1;
  }
}
