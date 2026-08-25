/**
 * User-facing validation messages.
 */
export const VALIDATION_MESSAGES = {
  EMPTY_FILE: "Please select a file to analyze.",
  UNSUPPORTED_FILE_TYPE:
    "Unsupported file format. Please upload a TXT, PDF, or DOCX document.",
  FILE_TOO_LARGE:
    "File size exceeds the 10 MB limit. Please select a smaller file.",
  EMPTY_TEXT: "Please paste text to analyze.",
  TEXT_TOO_SHORT:
    "Text is too short. Minimum 20 characters required for reliable analysis.",
  TEXT_TOO_LONG: "Text exceeds the maximum length of 50,000 characters.",
  EMPTY_URL: "Please enter a valid URL to analyze.",
  INVALID_URL:
    "Invalid web address. Please include a valid http:// or https:// protocol URL.",
  URL_TOO_LONG: "URL exceeds the maximum supported length.",
  NO_MODE_OR_CONTENT:
    "Select an analysis mode and provide content to continue.",
  NO_MODE_SELECTED:
    "Select an analysis mode and provide content to continue.",
  UNKNOWN_ERROR:
    "An unexpected error occurred during processing. Please try again.",
} as const;
