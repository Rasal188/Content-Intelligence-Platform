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
  matchType:
    | "EXACT_MATCH"
    | "PARTIAL_MATCH"
    | "PARAPHRASE_MATCH"
    | "NO_SIGNIFICANT_MATCH";
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
   * - Decodes named & numeric HTML entities (&nbsp;, &amp;, &#39;, &ldquo;, etc.)
   * - Converts all Unicode whitespace characters (NBSP, em-space, en-space, etc.) to standard spaces
   * - Strips zero-width characters (U+200B, U+200C, U+200D, U+FEFF)
   * - Strips curly/smart quotes, smart apostrophes, em-dashes, and special punctuation
   * - Normalizes Unicode text via NFKC
   * - Collapses multiple spaces/newlines into single space
   */
  public static normalize(text: string): string {
    if (!text) return "";
    let clean = text;

    // 1. Decode common named and numeric HTML entities
    clean = clean
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8217;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8211;/g, "-")
      .replace(/&#8212;/g, "-")
      .replace(/&#(\d+);/g, (_, num) => {
        try {
          return String.fromCharCode(Number.parseInt(num, 10));
        } catch {
          return " ";
        }
      })
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        try {
          return String.fromCharCode(Number.parseInt(hex, 16));
        } catch {
          return " ";
        }
      });

    // 2. Unicode normalization (NFKC)
    clean = clean.normalize("NFKC");

    // 3. Strip zero-width characters (\u200B zero-width space, \u200C zero-width non-joiner, \u200D zero-width joiner, \uFEFF BOM)
    clean = clean.replace(/\u200B|\u200C|\u200D|\uFEFF/g, "");

    // 4. Convert all Unicode whitespace to normal space
    clean = clean.replace(/[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g, " ");

    // 5. Smart punctuation & quotes
    clean = clean
      .toLowerCase()
      .replace(/[\u2018\u2019`]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[^a-z0-9\s'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return clean;
  }

  /**
   * Extracts clean words with character offset indices from normalized text.
   */
  public static extractWords(
    text: string,
  ): Array<{ word: string; start: number; end: number }> {
    const words: Array<{ word: string; start: number; end: number }> = [];
    const regex = /[a-zA-Z0-9'-]+/g;
    let match = regex.exec(text);

    while (match !== null) {
      const normalizedToken = match[0]
        .toLowerCase()
        .replace(/[\u2018\u2019`]/g, "'")
        .replace(/^['-]+|['-]+$/g, ""); // Strip leading/trailing dangling dashes/apostrophes

      if (normalizedToken.length > 0) {
        words.push({
          word: normalizedToken,
          start: match.index,
          end: match.index + match[0].length,
        });
      }
      match = regex.exec(text);
    }

    return words;
  }

  /**
   * Merges overlapping or adjacent index intervals.
   */
  public static mergeRanges(
    ranges: Array<[number, number]>,
  ): Array<[number, number]> {
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
  public static getAuthorityTier(
    sourceUrl?: string,
    publication?: string,
  ): number {
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
  public static getTopicRelevanceScore(
    submittedText: string,
    sourceTitle: string,
    sourceSnippet: string,
  ): number {
    const normSub = DeterministicMatcher.normalize(submittedText);
    const normTitle = DeterministicMatcher.normalize(sourceTitle);
    const subWords = DeterministicMatcher.extractWords(normSub).map(
      (w) => w.word,
    );

    // Check title keyword intersection
    const titleWords = DeterministicMatcher.extractWords(normTitle).map(
      (w) => w.word,
    );
    const titleOverlap = titleWords.filter((w) => subWords.includes(w)).length;

    return titleOverlap;
  }

  /**
   * Core deterministic comparison between submitted text and candidate sources.
   */
  public static evaluate(
    submittedText: string,
    candidates: MatchedSource[],
  ): DeterministicPlagiarismReport {
    const normSubmitted = DeterministicMatcher.normalize(submittedText);
    const submittedWords = DeterministicMatcher.extractWords(submittedText);
    const totalWords = Math.max(1, submittedWords.length);

    if (
      !submittedText ||
      submittedText.trim().length === 0 ||
      candidates.length === 0
    ) {
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
      if (
        (candidate.verificationStatus !== "VERIFIED" &&
          candidate.verificationStatus !== "SNIPPET_MATCH") ||
        !candidate.sourceUrl
      ) {
        unverifiedCandidates.push(candidate);
        continue;
      }

      const normSource = DeterministicMatcher.normalize(
        candidate.originalSnippet || candidate.matchedSnippet || "",
      );
      if (!normSource || normSource.length < 10) {
        unverifiedCandidates.push(candidate);
        continue;
      }

      const sourceWords = DeterministicMatcher.extractWords(normSource).map(
        (w) => w.word,
      );
      const sourceTextFlat = sourceWords.join(" ");

      // 1. Check Exact Document Match (source contains entire submitted text)
      if (normSource.includes(normSubmitted)) {
        for (let i = 0; i < submittedWords.length; i++) {
          matchedWordIndices.add(i);
        }

        let exactSourceMatchedText = submittedText;
        let exactBefore = "";
        let exactAfter = "";

        if (candidate.originalSnippet) {
          const rawSource = candidate.originalSnippet;
          const rawSourceWords = DeterministicMatcher.extractWords(rawSource);
          const firstSubWord = submittedWords[0]?.word;
          const lastSubWord = submittedWords[submittedWords.length - 1]?.word;

          let startChar = -1;
          let endChar = -1;

          for (let si = 0; si <= rawSourceWords.length - submittedWords.length; si++) {
            if (rawSourceWords[si]?.word === firstSubWord) {
              let allMatch = true;
              for (let k = 0; k < submittedWords.length; k++) {
                if (rawSourceWords[si + k]?.word !== submittedWords[k]?.word) {
                  allMatch = false;
                  break;
                }
              }
              if (allMatch) {
                startChar = rawSourceWords[si]!.start;
                endChar = rawSourceWords[si + submittedWords.length - 1]!.end;
                break;
              }
            }
          }

          if (startChar !== -1 && endChar !== -1) {
            const beforeChar = Math.max(0, startChar - 120);
            const afterChar = Math.min(rawSource.length, endChar + 120);
            exactBefore = (beforeChar > 0 ? "... " : "") + rawSource.slice(beforeChar, startChar).trimStart();
            exactSourceMatchedText = rawSource.slice(startChar, endChar);
            exactAfter = rawSource.slice(endChar, afterChar).trimEnd() + (afterChar < rawSource.length ? " ..." : "");
          }
        }

        verifiedSources.push({
          ...candidate,
          similarityPercent: 100,
          matchedWordCount: submittedWords.length,
          matchedSnippet: submittedText,
          matchedSourceSnippet: exactSourceMatchedText,
          matchedSourceContext: {
            before: exactBefore,
            match: exactSourceMatchedText,
            after: exactAfter,
          },
          verificationStatus: candidate.verificationStatus || "VERIFIED",
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
      const maxNgramSize = Math.min(
        DeterministicMatcher.DEFAULT_NGRAM_SIZE,
        submittedWords.length,
      );
      const matchedRangesForSource: Array<[number, number]> = [];

      for (let sz = maxNgramSize; sz >= 4; sz--) {
        for (let i = 0; i <= submittedWords.length - sz; i++) {
          const ngram = submittedWords
            .slice(i, i + sz)
            .map((w) => w.word)
            .join(" ");
          if (sourceTextFlat.includes(ngram)) {
            matchedRangesForSource.push([i, i + sz - 1]);
            for (let k = i; k < i + sz; k++) {
              matchedWordIndices.add(k);
            }
          }
        }
      }

      if (matchedRangesForSource.length > 0) {
        const merged = DeterministicMatcher.mergeRanges(matchedRangesForSource);
        let distinctSourceMatchedWords = 0;
        for (const [start, end] of merged) {
          distinctSourceMatchedWords += end - start + 1;
        }

        const sourceSimPercent = Math.min(
          100,
          Math.round((distinctSourceMatchedWords / totalWords) * 100),
        );

        const exactMatchingSubmittedExcerpt = submittedText.slice(
          submittedWords[merged[0]![0]]!.start,
          submittedWords[merged[merged.length - 1]![1]]!.end,
        );

        // Extract exact corresponding source-side passage and surrounding context from candidate.originalSnippet
        let sourceMatchedText = exactMatchingSubmittedExcerpt;
        let sourceContextBefore = "";
        let sourceContextAfter = "";

        if (candidate.originalSnippet) {
          const rawSource = candidate.originalSnippet;
          const rawSourceWords = DeterministicMatcher.extractWords(rawSource);
          const rawSourceWordsFlat = rawSourceWords.map((w) => w.word);

          // Find the matching sequence of submitted words in the source words
          const firstMatchedWord = submittedWords[merged[0]![0]]!.word;
          let sourceStartWordIdx = -1;
          let sourceEndWordIdx = -1;

          for (let si = 0; si <= rawSourceWordsFlat.length - 4; si++) {
            if (rawSourceWordsFlat[si] === firstMatchedWord) {
              // Check if consecutive words match
              let matchLen = 0;
              for (let mi = 0; mi < merged.length; mi++) {
                const subStart = merged[mi]![0];
                const subEnd = merged[mi]![1];
                for (let k = subStart; k <= subEnd; k++) {
                  if (si + matchLen < rawSourceWordsFlat.length && rawSourceWordsFlat[si + matchLen] === submittedWords[k]!.word) {
                    matchLen++;
                  }
                }
              }
              if (matchLen >= 4) {
                sourceStartWordIdx = si;
                sourceEndWordIdx = si + matchLen - 1;
                break;
              }
            }
          }

          if (sourceStartWordIdx !== -1 && sourceEndWordIdx !== -1) {
            const startChar = rawSourceWords[sourceStartWordIdx]!.start;
            const endChar = rawSourceWords[sourceEndWordIdx]!.end;
            sourceMatchedText = rawSource.slice(startChar, endChar);

            const beforeChar = Math.max(0, startChar - 120);
            const afterChar = Math.min(rawSource.length, endChar + 120);

            sourceContextBefore = (beforeChar > 0 ? "... " : "") + rawSource.slice(beforeChar, startChar).trimStart();
            sourceContextAfter = rawSource.slice(endChar, afterChar).trimEnd() + (afterChar < rawSource.length ? " ..." : "");
          } else {
            // Secondary fallback: normalized query search
            const normQuery = exactMatchingSubmittedExcerpt.toLowerCase().replace(/\s+/g, " ").trim();
            const rawSourceNorm = rawSource.toLowerCase().replace(/\s+/g, " ");
            const queryIdx = rawSourceNorm.indexOf(normQuery);

            if (queryIdx !== -1) {
              const beforeChar = Math.max(0, queryIdx - 120);
              const afterChar = Math.min(rawSource.length, queryIdx + exactMatchingSubmittedExcerpt.length + 120);
              sourceContextBefore = (beforeChar > 0 ? "... " : "") + rawSource.slice(beforeChar, queryIdx).trimStart();
              sourceMatchedText = rawSource.slice(queryIdx, queryIdx + exactMatchingSubmittedExcerpt.length);
              sourceContextAfter = rawSource.slice(queryIdx + exactMatchingSubmittedExcerpt.length, afterChar).trimEnd() + (afterChar < rawSource.length ? " ..." : "");
            }
          }
        }

        verifiedSources.push({
          ...candidate,
          similarityPercent: sourceSimPercent,
          matchedWordCount: distinctSourceMatchedWords,
          matchedSnippet: exactMatchingSubmittedExcerpt || candidate.matchedSnippet,
          matchedSourceSnippet: sourceMatchedText,
          matchedSourceContext: {
            before: sourceContextBefore,
            match: sourceMatchedText,
            after: sourceContextAfter,
          },
          verificationStatus: candidate.verificationStatus || "VERIFIED",
        });

        matchedSpans.push({
          submittedStartIndex:
            submittedWords[matchedRangesForSource[0]![0]]!.start,
          submittedEndIndex:
            submittedWords[
              matchedRangesForSource[matchedRangesForSource.length - 1]![1]
            ]!.end,
          submittedText: submittedText.slice(
            submittedWords[matchedRangesForSource[0]![0]]!.start,
            submittedWords[
              matchedRangesForSource[matchedRangesForSource.length - 1]![1]
            ]!.end,
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
      const tierA = DeterministicMatcher.getAuthorityTier(
        a.sourceUrl,
        a.publication,
      );
      const tierB = DeterministicMatcher.getAuthorityTier(
        b.sourceUrl,
        b.publication,
      );
      if (tierB !== tierA) {
        return tierB - tierA;
      }
      const relA = DeterministicMatcher.getTopicRelevanceScore(
        submittedText,
        a.sourceTitle,
        a.originalSnippet,
      );
      const relB = DeterministicMatcher.getTopicRelevanceScore(
        submittedText,
        b.sourceTitle,
        b.originalSnippet,
      );
      if (relB !== relA) {
        return relB - relA;
      }
      return (
        (b.originalSnippet?.length || 0) - (a.originalSnippet?.length || 0)
      );
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
      const passageWords = DeterministicMatcher.extractWords(
        DeterministicMatcher.normalize(
          src.originalSnippet || src.matchedSnippet || "",
        ),
      ).map((w) => w.word);
      const fingerprint = passageWords.slice(0, 12).join(" ");

      if (i === 0) {
        // Highest ranked authority source is PRIMARY
        src.sourceRole = "PRIMARY";
        src.matchedWordCount =
          src.matchedWordCount ||
          Math.round((src.similarityPercent / 100) * totalWords);
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
        src.matchedWordCount =
          src.matchedWordCount ||
          Math.round((src.similarityPercent / 100) * totalWords);
        finalizedSources.push(src);
      }
    }

    const finalMatchedWords = Math.min(totalWords, matchedWordIndices.size);
    const literalSimilarityPercent = Math.min(
      100,
      Math.round((finalMatchedWords / totalWords) * 100),
    );
    const isExactMatch =
      literalSimilarityPercent === 100 &&
      finalizedSources.some((s) => s.similarityPercent === 100);

    let matchType: DeterministicPlagiarismReport["matchType"] =
      "NO_SIGNIFICANT_MATCH";
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
