import type { MatchedSource } from "../../_types/analysis-source.types";

export interface DeterministicMatchSpan {
  submittedStartIndex: number;
  submittedEndIndex: number;
  submittedText: string;
  sourceText?: string;
  wordCount: number;
  isExact: boolean;
}

export interface DeterministicPlagiarismReport {
  totalSubmittedWords: number;
  matchedWords: number;
  literalSimilarityPercent: number;
  semanticSimilarityPercent: number;
  isExactMatch: boolean;
  matchType: "EXACT_MATCH" | "PARTIAL_MATCH" | "PARAPHRASE_MATCH" | "NO_SIGNIFICANT_MATCH";
  verifiedSources: MatchedSource[];
  unverifiedCandidates: MatchedSource[];
  matchedSpans: DeterministicMatchSpan[];
  confidence: number;
}

/**
 * Deterministic text matching and span-merging engine.
 * Calculates literal plagiarism based strictly on verified continuous N-grams
 * and interval merging to prevent false positives and double counting.
 */
export class DeterministicMatcher {
  private static readonly DEFAULT_NGRAM_SIZE = 5;

  /**
   * Normalizes text for verbatim matching:
   * - Lowercases text
   * - Strips curly/smart quotes, em-dashes, and special punctuation
   * - Collapses multiple spaces/newlines into single space
   */
  public static normalize(text: string): string {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[^a-z0-9\s'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Extracts clean words with character offset indices.
   */
  public static extractWords(text: string): Array<{ word: string; start: number; end: number }> {
    const words: Array<{ word: string; start: number; end: number }> = [];
    const regex = /[a-zA-Z0-9'-]+/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      words.push({
        word: match[0].toLowerCase(),
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    return words;
  }

  /**
   * Merges overlapping or adjacent index intervals.
   */
  public static mergeRanges(ranges: Array<[number, number]>): Array<[number, number]> {
    if (ranges.length === 0) return [];
    
    // Sort intervals by start index
    const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
    const merged: Array<[number, number]> = [sorted[0]!];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i]!;
      const prev = merged[merged.length - 1]!;

      if (current[0] <= prev[1] + 1) {
        // Overlapping or contiguous interval
        prev[1] = Math.max(prev[1], current[1]);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * Deterministically assigns an Authority Tier score (1 to 4) based on domain provenance and institutional authority.
   * Tier 1 (100): Library of Congress, National Archives, WHO, UN, Gov, Gutenberg, Official Archives
   * Tier 2 (75): Universities, .edu domains, academic repositories, arXiv, PubMed/NCBI, Nature
   * Tier 3 (50): Reference encyclopedias, Wikipedia, established publishers, news media
   * Tier 4 (25): General blogs, aggregators, unknown web domains
   */
  public static getAuthorityTier(sourceUrl?: string, publication?: string): number {
    if (!sourceUrl) return 25;
    const url = sourceUrl.toLowerCase();
    const pub = (publication || "").toLowerCase();

    // Tier 1: Primary institutional archives, government records, and official agencies
    if (
      url.includes("nasa.gov") ||
      url.includes("loc.gov") || 
      url.includes("archives.gov") || 
      url.includes("who.int") || 
      url.includes("un.org") || 
      url.includes("gutenberg.org") || 
      url.includes("folger.edu") ||
      url.includes(".gov") ||
      url.includes(".mil") ||
      pub.includes("national aeronautics and space administration") ||
      pub.includes("nasa") ||
      pub.includes("national archives") ||
      pub.includes("library of congress") ||
      pub.includes("world health organization") ||
      pub.includes("project gutenberg")
    ) {
      return 100;
    }

    // Tier 2: Academic repositories, universities, and peer-reviewed journals
    if (
      url.includes(".edu") || 
      url.includes("ncbi.nlm.nih.gov") || 
      url.includes("nature.com") || 
      url.includes("arxiv.org") || 
      url.includes("doi.org") ||
      url.includes("crossref.org") ||
      url.includes("ipcc.ch") ||
      url.includes("nist.gov") ||
      url.includes("imf.org") ||
      url.includes("hbr.org") ||
      pub.includes("university") ||
      pub.includes("academic")
    ) {
      return 75;
    }

    // Tier 3: Reference encyclopedias & major publications
    if (
      url.includes("wikipedia.org") || 
      url.includes("wikimedia.org") ||
      pub.includes("wikimedia") ||
      pub.includes("encyclopedia")
    ) {
      return 50;
    }

    return 35;
  }

  /**
   * Evaluates topic relevance between submitted text and candidate page title/content.
   * If a page is about an unrelated topic (e.g. "Pericles's Funeral Oration" for Gettysburg text), it is penalized against the primary work.
   */
  public static getTopicRelevanceScore(submittedText: string, sourceTitle: string, sourceSnippet: string): number {
    const normSub = this.normalize(submittedText);
    const normTitle = this.normalize(sourceTitle);
    const subWords = this.extractWords(normSub).map(w => w.word);
    
    // Check title keyword intersection
    const titleWords = this.extractWords(normTitle).map(w => w.word);
    const titleOverlap = titleWords.filter(w => subWords.includes(w)).length;
    
    return titleOverlap;
  }

  /**
   * Core deterministic comparison between submitted text and candidate sources.
   */
  public static evaluate(
    submittedText: string,
    candidates: MatchedSource[]
  ): DeterministicPlagiarismReport {
    const normSubmitted = this.normalize(submittedText);
    const submittedWords = this.extractWords(submittedText);
    const totalWords = Math.max(1, submittedWords.length);

    if (!submittedText || submittedText.trim().length === 0 || candidates.length === 0) {
      return {
        totalSubmittedWords: totalWords,
        matchedWords: 0,
        literalSimilarityPercent: 0,
        semanticSimilarityPercent: 0,
        isExactMatch: false,
        matchType: "NO_SIGNIFICANT_MATCH",
        verifiedSources: [],
        unverifiedCandidates: [],
        matchedSpans: [],
        confidence: 95,
      };
    }

    const verifiedSources: MatchedSource[] = [];
    const unverifiedCandidates: MatchedSource[] = [];
    const matchedWordIndices: Set<number> = new Set();
    const matchedSpans: DeterministicMatchSpan[] = [];

    for (const candidate of candidates) {
      if (candidate.verificationStatus !== "VERIFIED" || !candidate.sourceUrl) {
        unverifiedCandidates.push(candidate);
        continue;
      }

      const normSource = this.normalize(candidate.originalSnippet || candidate.matchedSnippet || "");
      if (!normSource || normSource.length < 10) {
        unverifiedCandidates.push(candidate);
        continue;
      }

      const sourceWords = this.extractWords(normSource).map(w => w.word);
      const sourceTextFlat = sourceWords.join(" ");

      // 1. Check Exact Match
      if (normSource.includes(normSubmitted) || normSubmitted.includes(normSource)) {
        for (let i = 0; i < submittedWords.length; i++) {
          matchedWordIndices.add(i);
        }
        
        verifiedSources.push({
          ...candidate,
          similarityPercent: 100,
          matchedWordCount: submittedWords.length,
          verificationStatus: "VERIFIED",
        });

        matchedSpans.push({
          submittedStartIndex: 0,
          submittedEndIndex: submittedText.length,
          submittedText: submittedText,
          sourceText: candidate.originalSnippet,
          wordCount: submittedWords.length,
          isExact: true,
        });
        continue;
      }

      // 2. Slicing N-Grams (consecutive 4 to 6 word sequences)
      const maxNgramSize = Math.min(this.DEFAULT_NGRAM_SIZE, submittedWords.length);
      const matchedRangesForSource: Array<[number, number]> = [];

      for (let sz = maxNgramSize; sz >= 4; sz--) {
        for (let i = 0; i <= submittedWords.length - sz; i++) {
          const ngram = submittedWords.slice(i, i + sz).map(w => w.word).join(" ");
          if (sourceTextFlat.includes(ngram)) {
            matchedRangesForSource.push([i, i + sz - 1]);
            for (let k = i; k < i + sz; k++) {
              matchedWordIndices.add(k);
            }
          }
        }
      }

      if (matchedRangesForSource.length > 0) {
        const merged = this.mergeRanges(matchedRangesForSource);
        let distinctSourceMatchedWords = 0;
        for (const [start, end] of merged) {
          distinctSourceMatchedWords += (end - start + 1);
        }

        const sourceSimPercent = Math.min(100, Math.round((distinctSourceMatchedWords / totalWords) * 100));
        
        verifiedSources.push({
          ...candidate,
          similarityPercent: sourceSimPercent,
          matchedWordCount: distinctSourceMatchedWords,
          verificationStatus: "VERIFIED",
        });

        matchedSpans.push({
          submittedStartIndex: submittedWords[matchedRangesForSource[0]![0]]!.start,
          submittedEndIndex: submittedWords[matchedRangesForSource[matchedRangesForSource.length - 1]![1]]!.end,
          submittedText: submittedText.slice(
            submittedWords[matchedRangesForSource[0]![0]]!.start,
            submittedWords[matchedRangesForSource[matchedRangesForSource.length - 1]![1]]!.end
          ),
          sourceText: candidate.originalSnippet,
          wordCount: distinctSourceMatchedWords,
          isExact: false,
        });
      } else {
        // No verbatim N-grams found in this source
        // Mark candidate as discarded/unverified for literal plagiarism calculations
        unverifiedCandidates.push(candidate);
      }
    }

    // 3. Multi-Tier Source Role Attribution & Provenance Ranking
    // Sort verified sources by:
    // (a) similarityPercent DESC (e.g. 100% exact coverage over 60% partial coverage)
    // (b) Authority Tier score (Tier 1 > Tier 2 > Tier 3 > Tier 4)
    // (c) Topic Relevance Score (Titles matching topic direct terms outrank comparison pages)
    // (d) Passage length
    verifiedSources.sort((a, b) => {
      if (b.similarityPercent !== a.similarityPercent) {
        return b.similarityPercent - a.similarityPercent;
      }
      const tierA = DeterministicMatcher.getAuthorityTier(a.sourceUrl, a.publication);
      const tierB = DeterministicMatcher.getAuthorityTier(b.sourceUrl, b.publication);
      if (tierB !== tierA) {
        return tierB - tierA;
      }
      const relA = DeterministicMatcher.getTopicRelevanceScore(submittedText, a.sourceTitle, a.originalSnippet);
      const relB = DeterministicMatcher.getTopicRelevanceScore(submittedText, b.sourceTitle, b.originalSnippet);
      if (relB !== relA) {
        return relB - relA;
      }
      return (b.originalSnippet?.length || 0) - (a.originalSnippet?.length || 0);
    });

    // Deduplicate and assign PRIMARY, SECONDARY, and DUPLICATE roles
    const finalizedSources: MatchedSource[] = [];
    const seenFingerprints: Map<string, string> = new Map(); // fingerprint -> primarySourceId
    const seenUrls: Set<string> = new Set();

    for (let i = 0; i < verifiedSources.length; i++) {
      const src = verifiedSources[i]!;
      if (src.sourceUrl && seenUrls.has(src.sourceUrl)) {
        continue; // deduplicate exact identical URL records
      }
      if (src.sourceUrl) seenUrls.add(src.sourceUrl);

      // Generate normalized fingerprint for the matched snippet / passage
      const passageWords = this.extractWords(this.normalize(src.originalSnippet || src.matchedSnippet || "")).map(w => w.word);
      const fingerprint = passageWords.slice(0, 12).join(" ");

      if (i === 0) {
        // Highest ranked authority source is PRIMARY
        src.sourceRole = "PRIMARY";
        src.matchedWordCount = src.matchedWordCount || (src.similarityPercent >= 90 ? totalWords : Math.round((src.similarityPercent / 100) * totalWords));
        finalizedSources.push(src);
        if (fingerprint.length > 0) seenFingerprints.set(fingerprint, src.id);
      } else {
        const primaryId = seenFingerprints.get(fingerprint);
        if (primaryId) {
          src.sourceRole = "DUPLICATE";
          src.duplicateOfId = primaryId;
        } else {
          src.sourceRole = "SECONDARY";
          if (fingerprint.length > 0) seenFingerprints.set(fingerprint, src.id);
        }
        src.matchedWordCount = src.matchedWordCount || (src.similarityPercent >= 90 ? totalWords : Math.round((src.similarityPercent / 100) * totalWords));
        finalizedSources.push(src);
      }
    }

    const finalMatchedWords = Math.min(totalWords, matchedWordIndices.size);
    const literalSimilarityPercent = Math.min(100, Math.round((finalMatchedWords / totalWords) * 100));
    const isExactMatch = literalSimilarityPercent >= 90 && finalizedSources.some(s => s.similarityPercent >= 90);
    
    let matchType: DeterministicPlagiarismReport["matchType"] = "NO_SIGNIFICANT_MATCH";
    if (isExactMatch) {
      matchType = "EXACT_MATCH";
    } else if (literalSimilarityPercent >= 30) {
      matchType = "PARTIAL_MATCH";
    } else if (literalSimilarityPercent > 0) {
      matchType = "PARAPHRASE_MATCH";
    }

    // Confidence is proportional to verified sources and deterministic literal matching
    const confidence = finalizedSources.length > 0 ? 99 : 95;

    return {
      totalSubmittedWords: totalWords,
      matchedWords: finalMatchedWords,
      literalSimilarityPercent,
      semanticSimilarityPercent: 0,
      isExactMatch,
      matchType,
      verifiedSources: finalizedSources,
      unverifiedCandidates,
      matchedSpans,
      confidence,
    };
  }
}
