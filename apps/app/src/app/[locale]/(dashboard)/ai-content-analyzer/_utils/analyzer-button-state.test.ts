import { describe, expect, test } from "bun:test";
import { VALIDATION_MESSAGES } from "../_constants/validation";
import type { AnalysisRequest, AnalysisType } from "../_types/analysis";
import { validateAnalysisRequest } from "../_utils/validators";

describe("AI Content Analyzer Button State & Mode Validation Suite", () => {
  // Helpers for testing state matrix
  const createRequest = (
    mode: AnalysisType | null | undefined,
    text: string,
    file?: File,
    source: "paste" | "file" = "paste",
  ): AnalysisRequest => ({
    source,
    analysisType: mode ?? undefined,
    text: source === "paste" ? text : undefined,
    file: source === "file" ? file : undefined,
  });

  const validText = "This is a valid test document content string exceeding twenty characters.";
  const shortText = "Short.";
  const emptyText = "";

  test("1. No content + No mode -> Validation fails & error is standardized", () => {
    const req = createRequest(null, emptyText);
    const result = validateAnalysisRequest(req);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(VALIDATION_MESSAGES.NO_MODE_OR_CONTENT);
  });

  test("2. Content + No mode -> Validation fails", () => {
    const req = createRequest(null, validText);
    const result = validateAnalysisRequest(req);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(VALIDATION_MESSAGES.NO_MODE_OR_CONTENT);
  });

  test("3. No content + Mode -> Validation fails", () => {
    const req = createRequest("ai_detection", emptyText);
    const result = validateAnalysisRequest(req);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(VALIDATION_MESSAGES.NO_MODE_OR_CONTENT);
  });

  test("4. Short text (<20 chars) + Mode -> Validation fails", () => {
    const req = createRequest("ai_detection", shortText);
    const result = validateAnalysisRequest(req);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(VALIDATION_MESSAGES.NO_MODE_OR_CONTENT);
  });

  test("5. Valid Content + Valid Mode -> Validation succeeds", () => {
    const reqAi = createRequest("ai_detection", validText);
    expect(validateAnalysisRequest(reqAi).isValid).toBe(true);

    const reqPlag = createRequest("plagiarism", validText);
    expect(validateAnalysisRequest(reqPlag).isValid).toBe(true);

    const reqHum = createRequest("ai_humanizer", validText);
    expect(validateAnalysisRequest(reqHum).isValid).toBe(true);
  });

  test("6. Valid File Document + Valid Mode -> Validation succeeds", () => {
    const mockFile = new File(["Sample document content exceeding 20 chars"], "doc.txt", {
      type: "text/plain",
    });
    const reqFile = createRequest("ai_detection", "", mockFile, "file");
    expect(validateAnalysisRequest(reqFile).isValid).toBe(true);
  });

  test("7. Empty File Document + Valid Mode -> Validation fails", () => {
    const emptyFile = new File([], "empty.txt", { type: "text/plain" });
    const reqEmptyFile = createRequest("ai_detection", "", emptyFile, "file");
    expect(validateAnalysisRequest(reqEmptyFile).isValid).toBe(false);
  });

  test("8. State Matrix Helper: Computes disabled flag accurately across all states", () => {
    const computeIsDisabled = (
      hasValidContent: boolean,
      hasSelectedMode: boolean,
      hasActiveJob: boolean,
    ) => !hasValidContent || !hasSelectedMode || hasActiveJob;

    // NO CONTENT + NO MODE -> DISABLED (true)
    expect(computeIsDisabled(false, false, false)).toBe(true);

    // CONTENT + NO MODE -> DISABLED (true)
    expect(computeIsDisabled(true, false, false)).toBe(true);

    // NO CONTENT + MODE -> DISABLED (true)
    expect(computeIsDisabled(false, true, false)).toBe(true);

    // CONTENT + MODE -> ENABLED (false)
    expect(computeIsDisabled(true, true, false)).toBe(false);

    // CONTENT + MODE + ACTIVE JOB -> DISABLED (true)
    expect(computeIsDisabled(true, true, true)).toBe(true);
  });
});
