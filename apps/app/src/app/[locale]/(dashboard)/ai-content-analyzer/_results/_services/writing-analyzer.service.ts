/**
 * Writing Analysis & Protected Element Extraction Service
 *
 * Deterministically analyzes text to detect writing-quality issues (repetitive phrasing,
 * monotonous sentence length, passive structures, filler phrases) and extracts protected elements
 * (numbers, dates, URLs, code blocks, technical terms, citations) to ensure strict preservation
 * during controlled humanization.
 */

export interface ProtectedElements {
  numbers: string[];
  dates: string[];
  urls: string[];
  emails: string[];
  codeSnippets: string[];
  technicalTerms: string[];
  citations: string[];
}

export interface WritingMetrics {
  sentenceCount: number;
  wordCount: number;
  characterCount: number;
  averageSentenceLength: number;
  sentenceLengthVariance: number;
  paragraphCount: number;
  repeatedPhraseCount: number;
  fillerPhraseCount: number;
}

export interface WritingAnalysisResult {
  metrics: WritingMetrics;
  issues: string[];
  protectedElements: ProtectedElements;
  preservationSummary: string;
}

export class WritingAnalyzerService {
  private static readonly FILLER_PATTERNS = [
    /\b(in order to)\b/gi,
    /\b(it is important to note that)\b/gi,
    /\b(plays a (?:crucial|vital|key|pivotal) role in)\b/gi,
    /\b(serves as a testament to)\b/gi,
    /\b(in today's fast-paced world)\b/gi,
    /\b(delve into)\b/gi,
    /\b(it is worth noting that)\b/gi,
    /\b(furthermore|moreover|additionally|in conclusion)\b/gi,
  ];

  private static readonly COMMON_TECH_TERMS = [
    "TypeScript", "JavaScript", "Python", "Rust", "React", "Next.js", "Vite",
    "Node.js", "Convex", "PostgreSQL", "REST", "GraphQL", "API", "JSON", "SSE",
    "TailwindCSS", "CSS", "HTML", "SSRF", "RBAC", "JWT", "OAuth", "LLM",
    "Claude Sonnet", "Gemini", "Ollima", "OllaGraph", "Docker", "Kubernetes",
    "JAX", "Flax", "PyTorch", "TensorFlow", "HTTP", "HTTPS", "PRNG", "TrainState",
    "SHA-256", "HMAC", "SHA-1", "AES", "MD5", "timingSafeEqual"
  ];

  /**
   * Performs deterministic writing quality analysis and protected element extraction.
   */
  public static analyze(text: string): WritingAnalysisResult {
    if (!text || text.trim().length === 0) {
      return {
        metrics: {
          sentenceCount: 0,
          wordCount: 0,
          characterCount: 0,
          averageSentenceLength: 0,
          sentenceLengthVariance: 0,
          paragraphCount: 0,
          repeatedPhraseCount: 0,
          fillerPhraseCount: 0,
        },
        issues: [],
        protectedElements: {
          numbers: [],
          dates: [],
          urls: [],
          emails: [],
          codeSnippets: [],
          technicalTerms: [],
          citations: [],
        },
        preservationSummary: "No content to analyze.",
      };
    }

    const clean = text.trim();
    const paragraphs = clean.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const sentences = clean.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()).filter(Boolean) || [clean];
    const words = clean.split(/\s+/).filter(Boolean);

    // Sentence length metrics
    const sentenceLengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
    const avgLength = sentenceLengths.length > 0 ? words.length / sentenceLengths.length : 0;
    const variance =
      sentenceLengths.length > 0
        ? sentenceLengths.reduce((acc, len) => acc + (len - avgLength) ** 2, 0) / sentenceLengths.length
        : 0;

    // Detect filler phrases
    let fillerCount = 0;
    const detectedFillers = new Set<string>();
    for (const pattern of WritingAnalyzerService.FILLER_PATTERNS) {
      const matches = clean.match(pattern);
      if (matches) {
        fillerCount += matches.length;
        for (const m of matches) detectedFillers.add(m.toLowerCase());
      }
    }

    // Detect repeated 3- to 5-word phrases
    const phraseMap = new Map<string, number>();
    for (let i = 0; i <= words.length - 3; i++) {
      const p = words.slice(i, i + 3).join(" ").toLowerCase().replace(/[^a-z0-9 ]/g, "");
      if (p.length > 8) {
        phraseMap.set(p, (phraseMap.get(p) || 0) + 1);
      }
    }
    const repeatedPhrases = Array.from(phraseMap.entries()).filter(([_, count]) => count > 1);

    // Build issues list
    const issues: string[] = [];
    if (variance < 15 && sentenceLengths.length >= 3) {
      issues.push("Monotonous sentence length distribution (low rhythm variance)");
    }
    if (fillerCount > 0) {
      issues.push(`Contains ${fillerCount} formulaic filler transitions (${Array.from(detectedFillers).slice(0, 3).join(", ")})`);
    }
    if (repeatedPhrases.length > 0) {
      issues.push(`Repeated phrasing detected across clauses (${repeatedPhrases.length} occurrences)`);
    }
    if (avgLength > 25) {
      issues.push("Overly verbose sentences requiring clarity and structural variation");
    }

    // Extract protected elements
    const numbers = Array.from(new Set(clean.match(/(?:\$\s*)?\b\d+(?:,\d{3})+(?:\.\d+)?%?\b|(?:\$\s*)?\b\d+(?:\.\d+)+[a-zA-Z%]?|(?:\$\s*)?\b\d+[a-zA-Z%]?|\b\d+(?:\.\d+)?%?\b/g) || []));
    const dates = Array.from(new Set(clean.match(/\b(?:19|20)\d{2}\b|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember))\s+\d{1,2}(?:,\s+\d{4})?\b/gi) || []));
    const urls = Array.from(new Set(clean.match(/https?:\/\/[^\s]+/g) || []));
    const emails = Array.from(new Set(clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []));
    const codeSnippets = Array.from(new Set(clean.match(/`[^`]+`/g) || []));
    const citations = Array.from(new Set(clean.match(/\[(?:\d+|[A-Z][a-z]+(?:\s+et\s+al\.?)?,\s+\d{4})\]/g) || []));

    // Extract tech terms present in text
    const technicalTerms: string[] = [];
    const lowerClean = clean.toLowerCase();
    for (const term of WritingAnalyzerService.COMMON_TECH_TERMS) {
      if (lowerClean.includes(term.toLowerCase())) {
        technicalTerms.push(term);
      }
    }

    const protectedElements: ProtectedElements = {
      numbers,
      dates,
      urls,
      emails,
      codeSnippets,
      technicalTerms,
      citations,
    };

    const preservationSummary = [
      numbers.length > 0 ? `${numbers.length} numbers/metrics` : null,
      technicalTerms.length > 0 ? `${technicalTerms.length} technical terms` : null,
      urls.length > 0 ? `${urls.length} URLs` : null,
      codeSnippets.length > 0 ? `${codeSnippets.length} code elements` : null,
    ].filter(Boolean).join(", ") || "No specific technical constants";

    return {
      metrics: {
        sentenceCount: sentences.length,
        wordCount: words.length,
        characterCount: clean.length,
        averageSentenceLength: Math.round(avgLength * 10) / 10,
        sentenceLengthVariance: Math.round(variance * 10) / 10,
        paragraphCount: paragraphs.length,
        repeatedPhraseCount: repeatedPhrases.length,
        fillerPhraseCount: fillerCount,
      },
      issues,
      protectedElements,
      preservationSummary,
    };
  }

  /**
   * Validates rewritten humanized text against original protected elements and meaning sanity.
   */
  public static validatePreservation(
    originalText: string,
    rewrittenText: string,
    protectedElements: ProtectedElements,
  ): {
    valid: boolean;
    missingElements: string[];
    lengthRatio: number;
    issues: string[];
  } {
    if (!rewrittenText || rewrittenText.trim().length === 0) {
      return { valid: false, missingElements: ["Rewritten text is empty"], lengthRatio: 0, issues: ["Empty text"] };
    }

    const missing: string[] = [];
    const issues: string[] = [];

    // Check critical numbers
    for (const num of protectedElements.numbers) {
      if (!rewrittenText.includes(num)) {
        missing.push(`Missing numerical metric: ${num}`);
      }
    }

    // Check critical URLs
    for (const u of protectedElements.urls) {
      if (!rewrittenText.includes(u)) {
        missing.push(`Missing URL: ${u}`);
      }
    }

    // Check critical code blocks
    for (const c of protectedElements.codeSnippets) {
      const cleanCode = c.replace(/`/g, "");
      if (!rewrittenText.includes(cleanCode)) {
        missing.push(`Missing code snippet: ${c}`);
      }
    }

    const origLength = originalText.trim().length;
    const rewriteLength = rewrittenText.trim().length;
    const lengthRatio = origLength > 0 ? rewriteLength / origLength : 1;

    // Reject extreme hallucinations or truncations (< 40% or > 250% original length)
    if (lengthRatio < 0.4) {
      issues.push("Output is excessively truncated compared to original input.");
    } else if (lengthRatio > 2.5) {
      issues.push("Output is excessively inflated compared to original input.");
    }

    const valid = missing.length === 0 && issues.length === 0;

    return {
      valid,
      missingElements: missing,
      lengthRatio: Math.round(lengthRatio * 100) / 100,
      issues,
    };
  }
}
