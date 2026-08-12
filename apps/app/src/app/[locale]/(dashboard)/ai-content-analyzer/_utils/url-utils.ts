import { MAX_URL_LENGTH_CHARS } from "../_constants/limits";
import { VALIDATION_MESSAGES } from "../_constants/validation";
import type { ValidationResult } from "../_types/analysis";

/**
 * Validates web URL structure using standard URL parsing.
 * @param url Raw input string.
 * @returns Boolean indicating URL validity.
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.length > MAX_URL_LENGTH_CHARS) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Trims and normalizes a web URL string.
 * @param url Raw input string.
 * @returns Cleaned URL string.
 */
export function sanitizeUrl(url: string): string {
  return url.trim();
}

/**
 * Validates URL string and returns validation response model.
 * @param url Web address input string.
 * @returns ValidationResult with error detail if invalid.
 */
export function validateUrl(url: string | undefined): ValidationResult {
  if (!url || url.trim().length === 0) {
    return { isValid: false, error: VALIDATION_MESSAGES.EMPTY_URL };
  }
  const sanitized = sanitizeUrl(url);
  if (sanitized.length > MAX_URL_LENGTH_CHARS) {
    return { isValid: false, error: VALIDATION_MESSAGES.URL_TOO_LONG };
  }
  if (!isValidUrl(sanitized)) {
    return { isValid: false, error: VALIDATION_MESSAGES.INVALID_URL };
  }
  return { isValid: true };
}
