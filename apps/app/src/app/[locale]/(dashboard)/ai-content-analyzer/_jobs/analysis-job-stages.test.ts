import { describe, expect, test } from "bun:test";
import {
  AI_DETECTION_STAGES,
  AI_HUMANIZER_STAGES,
  getStagesForAnalysisType,
  PLAGIARISM_STAGES,
} from "./analysis-job.service";

describe("Analysis Job Execution Stages Mode-Aware Suite", () => {
  // 1. AI Detection Mode
  test("analysisType = 'ai_detection' returns AI Detection stages", () => {
    const stages = getStagesForAnalysisType("ai_detection");
    expect(stages).toEqual(AI_DETECTION_STAGES);

    const stageNames = stages.map((s) => s.stageName);
    expect(stageNames).toContain("Preparing Workspace");
    expect(stageNames).toContain("Reading Document");
    expect(stageNames).toContain("Cleaning Text");
    expect(stageNames).toContain("Building Prompt Vectors");
    expect(stageNames).toContain("Running AI Detection");
    expect(stageNames).toContain("Generating Report");
  });

  // 2. Plagiarism Search Mode ("plagiarism")
  test("analysisType = 'plagiarism' returns Plagiarism stages and NEVER contains 'Running AI Detection'", () => {
    const stages = getStagesForAnalysisType("plagiarism");
    expect(stages).toEqual(PLAGIARISM_STAGES);

    const stageNames = stages.map((s) => s.stageName);
    expect(stageNames).toContain("Preparing Workspace");
    expect(stageNames).toContain("Reading Document");
    expect(stageNames).toContain("Generating Search Queries");
    expect(stageNames).toContain("Searching Web & Source Repositories");
    expect(stageNames).toContain("Verifying Source Overlap");
    expect(stageNames).toContain("Generating Report");

    // Critical Invariant: Plagiarism job must NEVER contain "Running AI Detection"
    expect(stageNames).not.toContain("Running AI Detection");

    const messages = stages.map((s) => s.message);
    expect(messages).not.toContain(
      "Comparing perplexity & burstiness against model index",
    );
    expect(messages).toContain("Initializing plagiarism audit environment");
    expect(messages).toContain("Searching available web and academic sources");
    expect(messages).toContain("Performing deterministic verbatim matching");
  });

  // 3. Plagiarism Check Alias ("plagiarism-check")
  test("analysisType = 'plagiarism-check' returns Plagiarism stages", () => {
    const stages = getStagesForAnalysisType("plagiarism-check");
    expect(stages).toEqual(PLAGIARISM_STAGES);

    const stageNames = stages.map((s) => s.stageName);
    expect(stageNames).not.toContain("Running AI Detection");
  });

  // 4. AI Humanizer Mode ("ai_humanizer" & "humanizer")
  test("analysisType = 'ai_humanizer' returns Humanizer stages", () => {
    const stages = getStagesForAnalysisType("ai_humanizer");
    expect(stages).toEqual(AI_HUMANIZER_STAGES);

    const stageNames = stages.map((s) => s.stageName);
    expect(stageNames).toContain("Preparing Workspace");
    expect(stageNames).toContain("Reading Document");
    expect(stageNames).toContain("Analyzing Writing Structure");
    expect(stageNames).toContain("Restructuring Content");
    expect(stageNames).toContain("Generating Report");

    expect(stageNames).not.toContain("Running AI Detection");
    expect(stageNames).not.toContain("Searching Web & Source Repositories");
  });

  test("analysisType = 'humanizer' alias returns Humanizer stages", () => {
    const stages = getStagesForAnalysisType("humanizer");
    expect(stages).toEqual(AI_HUMANIZER_STAGES);
  });

  // 5. Default Fallback
  test("undefined or null analysisType defaults to AI Detection stages", () => {
    expect(getStagesForAnalysisType(undefined)).toEqual(AI_DETECTION_STAGES);
    expect(getStagesForAnalysisType(null)).toEqual(AI_DETECTION_STAGES);
  });
});
