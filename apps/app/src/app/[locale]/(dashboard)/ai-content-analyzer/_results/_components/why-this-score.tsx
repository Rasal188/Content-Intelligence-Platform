import type { FC } from "react";
import type { AnalysisResultDomain } from "../_types/analysis-result.types";
import { Sparkles, Bot, FileText, CheckCircle2 } from "lucide-react";

interface WhyThisScoreProps {
  rawResult: AnalysisResultDomain;
}

export const WhyThisScore: FC<WhyThisScoreProps> = ({ rawResult }) => {
  const highlights = rawResult.highlights || [];
  const aiScore = rawResult.scores.aiProbability.value;
  const origScore = rawResult.scores.overallOriginality.value;
  const simScore = rawResult.scores.plagiarismSimilarity.value;

  // Extract top highlights for AI and Originality
  const topSnippets = highlights.slice(0, 3);

  // Derive top AI indicator explanations
  const forensicsExt = (rawResult.extensions as any)?.forensics || {};
  const aiForensics = forensicsExt.aiForensics || {};
  const notableAiReasons: string[] = [];

  const aiSignals = [
    { key: "templateLanguage", label: "Template phrasing & structured transitions" },
    { key: "sentencePredictability", label: "Uniform sentence predictability (low burstiness)" },
    { key: "lexicalRepetition", label: "Repetitive lexical phrasing & token recycling" },
    { key: "genericWording", label: "Broad, generic assertions without concrete specifics" },
    { key: "confidenceInflation", label: "Overly authoritative hedging and tone inflation" },
  ];

  const humanSignals = [
    { key: "personalExperience", label: "Authentic first-person narrative & episodic recall" },
    { key: "humanImperfections", label: "Organic syntax irregularities & natural human phrasing" },
    { key: "emotionalAuthenticity", label: "Nuanced emotional tone and creative expression" },
    { key: "sentenceBurstiness", label: "Dynamic sentence length variance (high burstiness)" },
    { key: "vocabularyDiversity", label: "Rich, context-specific vocabulary diversity" },
  ];

  if (aiScore > 35) {
    notableAiReasons.push(
      ...aiSignals
        .filter(s => {
          const metric = (aiForensics as any)[s.key];
          return metric && typeof metric.score === "number" && metric.score > 40;
        })
        .slice(0, 2)
        .map(s => s.label)
    );
    if (notableAiReasons.length === 0) {
      notableAiReasons.push("Formulaic phrasing and elevated structural predictability detected.");
    }
  } else {
    notableAiReasons.push(
      ...humanSignals
        .filter(s => {
          const metric = (aiForensics as any)[s.key];
          return metric && typeof metric.score === "number" && metric.score > 40;
        })
        .slice(0, 2)
        .map(s => s.label)
    );
    if (notableAiReasons.length === 0) {
      notableAiReasons.push("Natural human linguistic variance and authentic narrative pacing.");
    }
  }

  // Derive Originality insight
  const originalityInsight = origScore > 65
    ? "Document exhibits distinctive vocabulary choices and unique thematic development."
    : origScore < 40
      ? "Frequent use of standardized idioms, cliché phrases, and generalized templates."
      : "Balanced mix of conventional phrasing and localized descriptive points.";

  // Derive Similarity insight
  const similarityInsight = simScore > 25
    ? "Internal syntactic loops and recurring paragraph structures detected within the document."
    : "Low internal repetition with clean structural variety throughout all sections.";

  return (
    <div className="rounded-lg border border-border/80 bg-secondary/20 p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <Sparkles className="h-4 w-4 text-primary/80" />
        <h3 className="text-sm font-semibold text-primary">Why this score?</h3>
        <span className="text-[11px] text-primary/40">Key Forensic Evidence Points</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* AI Probability Evidence */}
        <div className="rounded-md border border-border/50 bg-card p-3.5 space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-primary">
              <Bot className="h-3.5 w-3.5 text-primary/70" />
              <span>AI Probability ({aiScore}%)</span>
            </div>
            <ul className="space-y-1.5 text-primary/70">
              {notableAiReasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-primary/40 shrink-0 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
          {topSnippets.length > 0 && topSnippets[0] && (
            <div className="border-t border-border/40 pt-2 mt-2">
              <span className="text-[10px] text-primary/40 block mb-1 uppercase tracking-wider">Observed Snippet</span>
              <p className="text-[11px] italic text-primary/60 truncate" title={topSnippets[0].textSnippet}>
                "{topSnippets[0].textSnippet}"
              </p>
            </div>
          )}
        </div>

        {/* Originality Evidence */}
        <div className="rounded-md border border-border/50 bg-card p-3.5 space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-primary">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary/70" />
              <span>Originality ({origScore}%)</span>
            </div>
            <p className="text-primary/70 leading-relaxed">{originalityInsight}</p>
          </div>
          {topSnippets.length > 1 && topSnippets[1] && (
            <div className="border-t border-border/40 pt-2 mt-2">
              <span className="text-[10px] text-primary/40 block mb-1 uppercase tracking-wider">Notable Excerpt</span>
              <p className="text-[11px] italic text-primary/60 truncate" title={topSnippets[1].textSnippet}>
                "{topSnippets[1].textSnippet}"
              </p>
            </div>
          )}
        </div>

        {/* Similarity Risk Evidence */}
        <div className="rounded-md border border-border/50 bg-card p-3.5 space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-primary">
              <FileText className="h-3.5 w-3.5 text-primary/70" />
              <span>Similarity Risk ({simScore}%)</span>
            </div>
            <p className="text-primary/70 leading-relaxed">{similarityInsight}</p>
          </div>
          <div className="border-t border-border/40 pt-2 mt-2">
            <span className="text-[10px] text-primary/40 block">Internal document structural check</span>
          </div>
        </div>
      </div>
    </div>
  );
};
