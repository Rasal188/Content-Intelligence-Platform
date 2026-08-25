/**
 * Matched web or academic repository source reference.
 */
export interface MatchedSource {
  id: string;
  sourceTitle: string;
  sourceUrl?: string;
  similarityPercent: number;
  matchedWordCount?: number;
  matchedSnippet: string;
  originalSnippet: string;
  matchedSourceSnippet?: string;
  matchedSourceContext?: {
    before: string;
    match: string;
    after: string;
  };
  publication?: string;
  author?: string;
  verificationStatus?: "VERIFIED" | "SNIPPET_MATCH" | "UNVERIFIED";
  sourceRole?: "PRIMARY" | "SECONDARY" | "DUPLICATE";
  duplicateOfId?: string;
  discoveryMethod?: "SEARCH_RESULT" | "DOMAIN_QUERY" | "INTERNAL_LINK";
  parentUrl?: string;
  discoveryQuery?: string;
  discoveryScore?: number;
}
