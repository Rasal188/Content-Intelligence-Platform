export interface EvidenceItem {
  quote: string;
  reason: string;
  indicator: string;
  confidence: number;
  severity: "low" | "medium" | "high" | "critical";
}

/**
 * Utility responsible for extracting, deduplicating, and ranking direct text quotes.
 */
export class EvidenceCollector {
  /**
   * Collects all evidence arrays from the raw JSON sections.
   * @param rawResponse The parsed JSON response object.
   * @returns Deduplicated array of EvidenceItem.
   */
  public static collect(rawResponse: Record<string, any>): EvidenceItem[] {
    const list: EvidenceItem[] = [];
    const sections = ["aiForensics", "originalExpression"];

    for (const secKey of sections) {
      const section = rawResponse[secKey];
      if (!section || typeof section !== "object") continue;

      for (const [indKey, indVal] of Object.entries(section)) {
        if (!indVal || typeof indVal !== "object") continue;
        const rawEvidence = (indVal as any).evidence;
        if (!Array.isArray(rawEvidence)) continue;

        for (const item of rawEvidence) {
          if (!item || typeof item !== "object") continue;
          const quote = typeof item.quote === "string" ? item.quote.trim() : "";
          if (!quote) continue;

          // V2.2 compact schema: LLM no longer emits indicator/severity/confidence — use safe defaults
          list.push({
            quote,
            reason:
              typeof item.reason === "string"
                ? item.reason
                : "Forensic indicator trace match.",
            indicator:
              typeof item.indicator === "string" ? item.indicator : indKey,
            confidence:
              typeof item.confidence === "number" ? item.confidence : 70,
            severity:
              item.severity === "low" ||
              item.severity === "medium" ||
              item.severity === "high" ||
              item.severity === "critical"
                ? item.severity
                : "low",
          });
        }
      }
    }

    // Deduplicate by text content, keeping the one with higher confidence
    const uniqueMap = new Map<string, EvidenceItem>();
    for (const item of list) {
      const existing = uniqueMap.get(item.quote);
      if (!existing || item.confidence > existing.confidence) {
        uniqueMap.set(item.quote, item);
      }
    }

    // Rank by confidence descending
    return Array.from(uniqueMap.values()).sort(
      (a, b) => b.confidence - a.confidence,
    );
  }
}
