/**
 * Allowed file extension and MIME type specifications.
 */
export const SUPPORTED_FILE_EXTENSIONS = [".txt", ".pdf", ".docx"] as const;

export const SUPPORTED_MIME_TYPES = [
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
] as const;

export const FILE_EXTENSION_LABEL_MAP: Record<string, string> = {
  ".txt": "Text Document",
  ".pdf": "PDF Document",
  ".docx": "Word Document",
};
