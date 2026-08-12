"use client";

import { Button } from "@v1/ui/button";
import { FileText, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { SUPPORTED_FILE_EXTENSIONS } from "../_constants/supported-files";
import { formatFileSize, getFileExtension } from "../_utils/file-utils";

interface DocumentUploadProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

/**
 * Interactive drag-and-drop document upload tab component.
 */
export function DocumentUpload({
  selectedFile,
  onFileSelect,
  disabled = false,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_FILE_EXTENSIONS.join(",")}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-medium text-primary">
            Drag & drop your document here
          </h3>
          <p className="mt-1 text-xs text-primary/50">
            Supports PDF, DOCX, or TXT up to 10 MB
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={disabled}
          >
            Browse File
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-primary">
                {selectedFile.name}
              </p>
              <p className="text-xs text-primary/50">
                {getFileExtension(selectedFile.name).toUpperCase()} •{" "}
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onFileSelect(null)}
              disabled={disabled}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
