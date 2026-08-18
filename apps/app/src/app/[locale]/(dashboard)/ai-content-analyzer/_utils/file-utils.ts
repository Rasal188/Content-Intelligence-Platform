import { MAX_UPLOAD_SIZE_BYTES } from "../_constants/limits";
import {
  SUPPORTED_FILE_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
} from "../_constants/supported-files";
import { VALIDATION_MESSAGES } from "../_constants/validation";
import type { ValidationResult } from "../_types/analysis";

/**
 * Formats byte numbers into human-readable size strings (KB, MB).
 * @param bytes File size in bytes.
 * @returns Formatted size string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Extracts lowercase file extension from filename.
 * @param filename File name string.
 * @returns Lowercase file extension with leading dot (e.g. '.pdf').
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Verifies if file extension or MIME type is supported.
 * @param file File object or filename string.
 * @returns Boolean indicating whether format is supported.
 */
export function isSupportedFileType(file: File | string): boolean {
  if (typeof file === "string") {
    const ext = getFileExtension(file);
    return (SUPPORTED_FILE_EXTENSIONS as readonly string[]).includes(ext);
  }
  const ext = getFileExtension(file.name);
  const isExtValid = (SUPPORTED_FILE_EXTENSIONS as readonly string[]).includes(
    ext,
  );
  const isMimeValid = (SUPPORTED_MIME_TYPES as readonly string[]).includes(
    file.type,
  );
  return isExtValid || isMimeValid;
}

/**
 * Validates file object against size and extension constraints.
 * @param file File object to validate.
 * @returns ValidationResult with isValid status and message error.
 */
export function validateFile(file: File | null | undefined): ValidationResult {
  if (!file) {
    return { isValid: false, error: VALIDATION_MESSAGES.EMPTY_FILE };
  }
  if (!isSupportedFileType(file)) {
    return { isValid: false, error: VALIDATION_MESSAGES.UNSUPPORTED_FILE_TYPE };
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { isValid: false, error: VALIDATION_MESSAGES.FILE_TOO_LARGE };
  }
  return { isValid: true };
}
