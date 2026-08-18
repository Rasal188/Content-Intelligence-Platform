/**
 * Quantitative linguistic metrics extracted from the analyzed content.
 */
export interface AnalysisStatistics {
  characters: number;
  words: number;
  paragraphs: number;
  sentences?: number;
  readabilityScore?: number;
  estimatedReadingTimeMinutes: number;
  vocabularyDiversityPercent: number;
  averageSentenceLengthWords: number;
  language: string;
}
