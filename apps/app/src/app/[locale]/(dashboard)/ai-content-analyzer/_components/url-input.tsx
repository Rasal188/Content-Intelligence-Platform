"use client";

import { Button } from "@v1/ui/button";
import { Globe, Trash2 } from "lucide-react";
import { isValidUrl, sanitizeUrl } from "../_utils/url-utils";

interface UrlInputProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

/**
 * Web URL string input tab component with state feedback.
 */
export function UrlInput({
  value,
  onChange,
  disabled = false,
}: UrlInputProps) {
  const isUrlValid = value.length > 0 ? isValidUrl(value) : false;

  return (
    <div className="space-y-3">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-primary/40">
          <Globe className="h-4 w-4" />
        </div>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/article-or-page"
          disabled={disabled}
          className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-20 text-sm outline-none placeholder:text-primary/40 focus:border-primary/50 disabled:opacity-50"
        />
        {value.length > 0 && (
          <div className="absolute right-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange("")}
              disabled={disabled}
              className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <p className="text-primary/50">
          Enter a public web page address to extract and analyze text.
        </p>
        {value.length > 0 && (
          <span
            className={`font-medium ${
              isUrlValid ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"
            }`}
          >
            {isUrlValid ? "Valid web address" : "Enter a complete http:// or https:// URL"}
          </span>
        )}
      </div>
    </div>
  );
}
