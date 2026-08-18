/**
 * V2.4 Compact Key Mapper
 *
 * Expands the ultra-compact LLM response (short keys + flat evidence array)
 * into the full indicator structure expected by ResultResponseValidator.
 *
 * Input (from LLM):
 *   {"af":{"sB":85,"pE":95},"oe":{"sp":88},"sa":{},"wq":{"re":72},
 *    "ev":[{"k":"af.pE","q":"When I was seven..."}]}
 *
 * Output (for validator):
 *   {"aiForensics":{"sentenceBurstiness":{"score":85},"personalExperience":{"score":95,"evidence":[...]}},...}
 */

const AF_MAP: Record<string, string> = {
  sB: "sentenceBurstiness",
  sP: "sentencePredictability",
  lR: "lexicalRepetition",
  vD: "vocabularyDiversity",
  tO: "transitionOveruse",
  pR: "paragraphRhythm",
  sS: "sentenceStructureRepetition",
  tL: "templateLanguage",
  gW: "genericWording",
  cI: "confidenceInflation",
  iD: "informationDensity",
  hL: "hedgingLanguage",
  sC: "stylisticConsistency",
  nA: "narrativeAuthenticity",
  pE: "personalExperience",
  eA: "emotionalAuthenticity",
  cr: "creativity",
  hi: "humanImperfections",
  cs: "contextSwitching",
  ha: "hallucinationIndicators",
};

const OE_MAP: Record<string, string> = {
  sp: "specificity",
  uW: "uniqueWording",
  lD: "lexicalDiversity",
  cO: "concreteObservations",
  oE: "originalExamples",
  bp: "boilerplate",
  mL: "marketingLanguage",
  eF: "educationalFiller",
  cc: "commonCliches",
  gE: "genericExplanations",
};

const SA_MAP: Record<string, string> = {
  rW: "repeatedWording",
  rP: "repeatedPhrases",
  rPa: "repeatedParagraphs",
  rE: "repeatedExplanations",
  tR: "templateReuse",
  fI: "formattingInconsistencies",
  aS: "abruptStyleShifts",
  rU: "repeatedUncommonTerminology",
};

const WQ_MAP: Record<string, string> = {
  gr: "grammar",
  re: "readability",
  fl: "flow",
  or: "organization",
  vo: "vocabulary",
  to: "tone",
  pQ: "paragraphQuality",
  sV: "sentenceVariety",
  aQ: "argumentQuality",
  eu: "evidenceUsage",
};

const SECTION_MAP: Record<
  string,
  { fullKey: string; keyMap: Record<string, string> }
> = {
  af: { fullKey: "aiForensics", keyMap: AF_MAP },
  oe: { fullKey: "originalExpression", keyMap: OE_MAP },
  sa: { fullKey: "similarityAnalysis", keyMap: SA_MAP },
  wq: { fullKey: "writingQuality", keyMap: WQ_MAP },
};

export class CompactKeyMapper {
  /**
   * Detects whether a raw LLM response uses the V2.4 compact short-key format.
   * V2.4 uses short section keys ("af", "oe", "sa", "wq").
   */
  public static isCompactFormat(raw: Record<string, unknown>): boolean {
    return "af" in raw || "oe" in raw || "sa" in raw || "wq" in raw;
  }

  /**
   * Expands a V2.4 compact LLM response into the full indicator structure
   * expected by ResultResponseValidator.toDomain().
   */
  public static expand(raw: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, Record<string, unknown>> = {
      aiForensics: {},
      originalExpression: {},
      similarityAnalysis: {},
      writingQuality: {},
    };

    // Expand each short section
    for (const [shortSection, { fullKey, keyMap }] of Object.entries(
      SECTION_MAP,
    )) {
      const section =
        raw[shortSection] && typeof raw[shortSection] === "object"
          ? (raw[shortSection] as Record<string, unknown>)
          : {};

      for (const [shortKey, score] of Object.entries(section)) {
        const fullIndicator = keyMap[shortKey];
        if (!fullIndicator) continue;
        const numScore = typeof score === "number" ? score : 50;
        const section2 = result[fullKey];
        if (!section2) continue;
        section2[fullIndicator] = { score: numScore };
      }
    }

    // Distribute flat evidence items to their parent indicator objects
    const evArray = Array.isArray(raw.ev)
      ? (raw.ev as Array<Record<string, unknown>>)
      : [];
    for (const evItem of evArray) {
      const key = typeof evItem.k === "string" ? evItem.k : "";
      const quote = typeof evItem.q === "string" ? evItem.q.trim() : "";
      if (!key || !quote) continue;

      const [shortSection, shortKey] = key.split(".");
      if (!shortSection || !shortKey) continue;
      const sectionDef = SECTION_MAP[shortSection];
      if (!sectionDef) continue;

      const fullIndicator = sectionDef.keyMap[shortKey];
      if (!fullIndicator) continue;

      const parentSection = result[sectionDef.fullKey];
      if (!parentSection) continue;
      const target = parentSection[fullIndicator] as
        | Record<string, unknown>
        | undefined;
      if (!target || typeof target !== "object") continue;

      const existingEvidence = Array.isArray((target as any).evidence)
        ? (target as any).evidence
        : [];
      (target as any).evidence = [
        ...existingEvidence,
        { quote, reason: "Notable forensic trace." },
      ];
    }

    return result;
  }
}
