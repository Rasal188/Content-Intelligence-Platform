/**
 * Immutable snapshot of document metadata captured at the time of analysis.
 */
export interface DocumentSnapshot {
  id: string;
  name: string;
  size: number;
  type: string;
  language: string;
  hash: string;
  wordCount: number;
  characterCount: number;
  pageCount: number;
  createdAt: string;
}
