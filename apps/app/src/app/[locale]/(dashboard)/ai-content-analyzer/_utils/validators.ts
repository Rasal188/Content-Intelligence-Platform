import {
  MAX_TEXT_LENGTH_CHARS,
  MIN_TEXT_LENGTH_CHARS,
} from "../_constants/limits";
import { VALIDATION_MESSAGES } from "../_constants/validation";
import type { AnalysisRequest, ValidationResult } from "../_types/analysis";
import { validateFile } from "./file-utils";
import { validateUrl } from "./url-utils";

/**
 * Calculates text metrics (character count, word count, line count).
 * @param text Content string.
 * @returns Object with calculated counts.
 */
export function getTextMetrics(text: string): {
  characterCount: number;
  wordCount: number;
  lineCount: number;
} {
  const characterCount = text.length;
  const trimmed = text.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const lineCount = text ? text.split(/\r\n|\r|\n/).length : 0;
  return { characterCount, wordCount, lineCount };
}

/**
 * Validates text string against length constraints.
 * @param text Input raw text string.
 * @returns ValidationResult object.
 */
export function validateTextContent(text: string | undefined): ValidationResult {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: VALIDATION_MESSAGES.EMPTY_TEXT };
  }
  const len = text.trim().length;
  if (len < MIN_TEXT_LENGTH_CHARS) {
    return { isValid: false, error: VALIDATION_MESSAGES.TEXT_TOO_SHORT };
  }
  if (len > MAX_TEXT_LENGTH_CHARS) {
    return { isValid: false, error: VALIDATION_MESSAGES.TEXT_TOO_LONG };
  }
  return { isValid: true };
}

/**
 * Validates complete analysis request based on active input source.
 * @param request AnalysisRequest payload.
 * @returns ValidationResult with status and error message.
 */
export function validateAnalysisRequest(request: AnalysisRequest): ValidationResult {
  if (!request) {
    return { isValid: false, error: VALIDATION_MESSAGES.UNKNOWN_ERROR };
  }

  switch (request.source) {
    case "file":
      return validateFile(request.file);
    case "paste":
      return validateTextContent(request.text);
    case "url":
      return validateUrl(request.url);
    default:
      return { isValid: false, error: VALIDATION_MESSAGES.UNKNOWN_ERROR };
  }
}
