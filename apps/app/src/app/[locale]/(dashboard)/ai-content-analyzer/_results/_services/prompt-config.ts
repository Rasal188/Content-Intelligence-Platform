/**
 * Configurable parameters, weights, and thresholds for the Forensic Linguistic analysis engine.
 */
export const PROMPT_VERSION = process.env.PROMPT_VERSION || "v2";

export const FORENSIC_SCORING_CONFIG = {
  // AI Forensics Indicator Weights
  aiForensics: {
    // AI Indicators (Increase AI score probability)
    templateLanguage: 10,
    sentencePredictability: 8,
    lexicalRepetition: 6,
    genericWording: 8,
    sentenceStructureRepetition: 8,
    confidenceInflation: 6,
    transitionOveruse: 6,
    paragraphRhythm: 6,
    informationDensity: 6,
    hedgingLanguage: 6,
    stylisticConsistency: 8,
    hallucinationIndicators: 6,

    // Human Indicators (Decrease AI score probability)
    personalExperience: 12,
    humanImperfections: 12,
    narrativeAuthenticity: 10,
    creativity: 10,
    emotionalAuthenticity: 8,
    sentenceBurstiness: 8,
    vocabularyDiversity: 7,
    contextSwitching: 6,
  },

  // Original Expression Weights
  originalExpression: {
    // Positive indicators
    specificity: 12,
    uniqueWording: 12,
    lexicalDiversity: 10,
    concreteObservations: 10,
    originalExamples: 12,

    // Inverted/Negative indicators
    boilerplate: 10,
    marketingLanguage: 8,
    educationalFiller: 8,
    commonCliches: 8,
    genericExplanations: 10,
  },

  // Similarity Analysis Weights
  similarityAnalysis: {
    repeatedWording: 10,
    repeatedPhrases: 12,
    repeatedParagraphs: 15,
    repeatedExplanations: 12,
    templateReuse: 12,
    formattingInconsistencies: 10,
    abruptStyleShifts: 10,
    repeatedUncommonTerminology: 9,
  },

  // Writing Quality Weights (each graded out of 100)
  writingQuality: {
    grammar: 10,
    readability: 10,
    flow: 10,
    organization: 10,
    vocabulary: 10,
    tone: 10,
    paragraphQuality: 10,
    sentenceVariety: 10,
    argumentQuality: 10,
    evidenceUsage: 10,
  },

  // Overall Score Blending Weights
  overallScore: {
    aiWritingWeight: 0.4,
    originalExpressionWeight: 0.3,
    similarityWeight: 0.1,
    writingQualityWeight: 0.2,
  },
};
