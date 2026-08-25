/**
 * Classifiability Status of text input.
 */
export type ClassifiabilityStatus =
  | "CLASSIFIABLE"
  | "LOW_CONFIDENCE"
  | "INSUFFICIENT"
  | "NON_LINGUISTIC";

export interface ClassifiabilityEvaluation {
  status: ClassifiabilityStatus;
  classifiable: boolean;
  confidence: number;
  reason: string;
  metrics: {
    characterCount: number;
    wordCount: number;
    sentenceCount: number;
    alphabeticRatio: number;
    symbolRatio: number;
    uniqueWordRatio: number;
    averageWordLength: number;
    hasRepetitiveTokens: boolean;
    hasRepetitiveChars: boolean;
    isUrlOnly: boolean;
    isCodeOnly: boolean;
    detectedScript: "latin" | "malayalam" | "devanagari" | "mixed" | "symbols";
  };
}

/**
 * Deterministic input quality gate evaluating whether submitted text contains sufficient
 * linguistic structure for reliable authorship classification.
 *
 * Supports English, Malayalam (\u0D00-\u0D7F), Hindi/Devanagari (\u0900-\u097F), and code-switching.
 */
export class InputQualityAnalyzerService {
  public static evaluate(text: string): ClassifiabilityEvaluation {
    const raw = text || "";
    const trimmed = raw.trim();
    const charCount = trimmed.length;

    // 1. Minimum character boundary
    if (charCount < 10) {
      return {
        status: "INSUFFICIENT",
        classifiable: false,
        confidence: 0,
        reason: "Insufficient text length for reliable AI analysis.",
        metrics: this.computeMetrics(trimmed),
      };
    }

    const metrics = this.computeMetrics(trimmed);

    // 2. URL Only check
    if (metrics.isUrlOnly) {
      return {
        status: "NON_LINGUISTIC",
        classifiable: false,
        confidence: 0,
        reason: "Submitted text consists solely of web addresses with no linguistic prose.",
        metrics,
      };
    }

    // 3. Pure Symbols / Emojis / Punctuation
    if (metrics.alphabeticRatio < 0.2) {
      return {
        status: "NON_LINGUISTIC",
        classifiable: false,
        confidence: 0,
        reason: "Content contains non-linguistic characters, symbols, or emojis.",
        metrics,
      };
    }

    // 4. Repeated character patterns (e.g. "aaaaaaaaaaaaaa")
    if (metrics.hasRepetitiveChars) {
      return {
        status: "INSUFFICIENT",
        classifiable: false,
        confidence: 0,
        reason: "Content contains continuous repeated character patterns without linguistic variation.",
        metrics,
      };
    }

    // 5. Single unsegmented random string (e.g. "syasydfvsufvofsagftasyfgaiufyafssfvy")
    if (metrics.wordCount === 1 && charCount > 25 && metrics.alphabeticRatio > 0.8) {
      // Check vowel/consonant distribution or consonant clusters in Latin script
      if (metrics.detectedScript === "latin" && this.isRandomGibberish(trimmed)) {
        return {
          status: "INSUFFICIENT",
          classifiable: false,
          confidence: 0,
          reason: "The submitted content does not contain enough linguistic structure to produce a meaningful authorship classification.",
          metrics,
        };
      }
    }

    // 6. Token repetitiveness (e.g. "test test test test test")
    if (metrics.hasRepetitiveTokens && metrics.wordCount >= 4) {
      return {
        status: "INSUFFICIENT",
        classifiable: false,
        confidence: 0,
        reason: "Content exhibits excessive repetitive token structures.",
        metrics,
      };
    }

    // 7. Short text confidence calibration:
    // Samples with < 30 meaningful words lack sufficient statistical sample size for deep forensic certainty.
    // Classify as LOW_CONFIDENCE preliminary analysis.
    if (metrics.wordCount < 30 || charCount < 180) {
      return {
        status: "LOW_CONFIDENCE",
        classifiable: true,
        confidence: 45,
        reason: "Short text sample (< 30 words): evaluated as preliminary analysis with reduced confidence.",
        metrics,
      };
    }

    // 8. Normal classifiable prose (30+ words)
    return {
      status: "CLASSIFIABLE",
      classifiable: true,
      confidence: 90,
      reason: "Content exhibits standard natural language syntax and classifiable lexical structures.",
      metrics,
    };
  }

  private static computeMetrics(text: string): ClassifiabilityEvaluation["metrics"] {
    const charCount = text.length;
    if (charCount === 0) {
      return {
        characterCount: 0,
        wordCount: 0,
        sentenceCount: 0,
        alphabeticRatio: 0,
        symbolRatio: 0,
        uniqueWordRatio: 0,
        averageWordLength: 0,
        hasRepetitiveTokens: false,
        hasRepetitiveChars: false,
        isUrlOnly: false,
        isCodeOnly: false,
        detectedScript: "symbols",
      };
    }

    // Count script characters
    // Latin: a-zA-Z, Malayalam: \u0D00-\u0D7F, Devanagari/Hindi: \u0900-\u097F
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
    const malChars = (text.match(/[\u0D00-\u0D7F]/g) || []).length;
    const devChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    const alphaCount = latinChars + malChars + devChars;

    const symbols = (text.match(/[^a-zA-Z0-9\s\u0D00-\u0D7F\u0900-\u097F]/g) || []).length;
    const alphabeticRatio = alphaCount / charCount;
    const symbolRatio = symbols / charCount;

    // Detect primary script
    let detectedScript: ClassifiabilityEvaluation["metrics"]["detectedScript"] = "symbols";
    if (alphaCount > 0) {
      const scriptsFound = [latinChars > 0, malChars > 0, devChars > 0].filter(Boolean).length;
      if (scriptsFound > 1) {
        detectedScript = "mixed";
      } else if (malChars > 0) {
        detectedScript = "malayalam";
      } else if (devChars > 0) {
        detectedScript = "devanagari";
      } else {
        detectedScript = "latin";
      }
    }

    // Tokenization
    const tokens = text.split(/\s+/).filter((t) => t.length > 0);
    const wordCount = tokens.length;
    const uniqueTokens = new Set(tokens.map((t) => t.toLowerCase()));
    const uniqueWordRatio = wordCount > 0 ? uniqueTokens.size / wordCount : 0;

    const totalWordLength = tokens.reduce((sum, w) => sum + w.length, 0);
    const averageWordLength = wordCount > 0 ? totalWordLength / wordCount : 0;

    const sentenceCount = (text.match(/[.!?।]+(?:\s+|$)/g) || []).length || (wordCount > 0 ? 1 : 0);

    // Repeated character check (e.g. 5+ identical characters in a row or >50% identical char)
    const hasRepetitiveChars = /(.)\1{4,}/.test(text) || (charCount > 10 && new Set(text.replace(/\s+/g, "")).size <= 2);

    // Repeated token check (e.g. "word word word" or unique ratio < 0.25 for 4+ tokens)
    const hasRepetitiveTokens = wordCount >= 4 && uniqueWordRatio <= 0.3;

    // URL only check
    const isUrlOnly = /^https?:\/\/[^\s]+$/i.test(text.trim());

    // Code only check
    const isCodeOnly = /^```[\s\S]*```$/i.test(text.trim());

    return {
      characterCount: charCount,
      wordCount,
      sentenceCount,
      alphabeticRatio,
      symbolRatio,
      uniqueWordRatio,
      averageWordLength,
      hasRepetitiveTokens,
      hasRepetitiveChars,
      isUrlOnly,
      isCodeOnly,
      detectedScript,
    };
  }

  /**
   * Deterministically analyzes unsegmented single-word strings for random keystroke gibberish.
   */
  private static isRandomGibberish(word: string): boolean {
    const lower = word.toLowerCase();
    const len = lower.length;
    if (len < 20) return false;

    // Vowel ratio in English/Latin natural words is typically between 25% and 65%
    const vowels = (lower.match(/[aeiou]/g) || []).length;
    const vowelRatio = vowels / len;

    // If excessive vowel or consonant concentration with no spaces, it's non-natural gibberish
    if (vowelRatio < 0.15 || vowelRatio > 0.85) {
      return true;
    }

    // Check for extreme bigram/trigram repetition or keyboard row mashing patterns (e.g., asdf, fvofs)
    const charSet = new Set(lower);
    if (charSet.size < 6 && len > 20) {
      return true;
    }

    return true; // 25+ char unspaced alpha strings with no hyphen/period are non-standard unclassified tokens
  }
}
