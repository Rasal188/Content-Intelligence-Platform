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
  publication?: string;
  author?: string;
  verificationStatus?: "VERIFIED" | "UNVERIFIED";
  sourceRole?: "PRIMARY" | "SECONDARY" | "DUPLICATE";
  duplicateOfId?: string;
}
