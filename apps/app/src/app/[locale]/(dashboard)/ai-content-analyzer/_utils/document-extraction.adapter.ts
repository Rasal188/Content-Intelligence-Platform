import { getFileExtension } from "./file-utils";

/**
 * Extraction adapter responsible for reading text contents from submitted document formats.
 * Decouples parsing libraries from the main job pipeline.
 */
export class DocumentExtractionAdapter {
  /**
   * Extracts clean text content from a File object.
   * Throws structured errors for unsupported or not-yet-supported formats.
   * @param file File object.
   * @returns Promise resolving to extracted text content.
   */
  public static async extractText(file: File): Promise<string> {
    const ext = getFileExtension(file.name).toLowerCase();

    if (ext === ".txt") {
      return await file.text();
    }

    if (ext === ".pdf") {
      throw new Error("PDF Extraction Not Yet Supported");
    }

    if (ext === ".docx") {
      throw new Error("DOCX Extraction Not Yet Supported");
    }

    throw new Error(`Extraction Not Yet Supported for file type: ${ext}`);
  }
}
