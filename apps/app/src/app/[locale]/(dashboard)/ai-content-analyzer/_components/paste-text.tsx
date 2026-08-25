"use client";

import { Button } from "@v1/ui/button";
import { Clipboard, Trash2 } from "lucide-react";
import {
  MAX_TEXT_LENGTH_CHARS,
  MIN_TEXT_LENGTH_CHARS,
} from "../_constants/limits";
import { getTextMetrics } from "../_utils/validators";

interface PasteTextProps {
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
}

/**
 * Multiline text area input component with live metrics and action buttons.
 */
export function PasteText({
  value,
  onChange,
  disabled = false,
}: PasteTextProps) {
  const metrics = getTextMetrics(value);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onChange(text);
    } catch {
      // Clipboard access fallback
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste or type raw content text snippet here to analyze (minimum 20 characters)..."
        disabled={disabled}
        rows={8}
        className="w-full rounded-lg border border-border bg-card p-4 text-sm outline-none placeholder:text-primary/40 focus:border-primary/50 disabled:opacity-50 resize-y"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-primary/50">
        <div className="flex items-center gap-4 font-mono">
          <span>Words: {metrics.wordCount}</span>
          <span>
            Chars: {metrics.characterCount} / {MAX_TEXT_LENGTH_CHARS}
          </span>
          <span>Lines: {metrics.lineCount}</span>
          {value.length > 0 && value.length < MIN_TEXT_LENGTH_CHARS && (
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">
              (Minimum {MIN_TEXT_LENGTH_CHARS} chars needed)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePasteClipboard}
            disabled={disabled}
            className="h-7 px-2.5 text-xs"
          >
            <Clipboard className="mr-1.5 h-3.5 w-3.5" /> Paste
          </Button>
          {value.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange("")}
              disabled={disabled}
              className="h-7 px-2.5 text-xs text-red-500 hover:text-red-600"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
