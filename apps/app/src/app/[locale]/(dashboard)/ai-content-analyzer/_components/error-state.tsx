import { AlertCircle, X } from "lucide-react";
import type { FC } from "react";

interface ErrorStateProps {
  message: string;
  onDismiss?: () => void;
}

/**
 * Reusable error state banner component.
 */
export const ErrorState: FC<ErrorStateProps> = ({ message, onDismiss }) => {
  return (
    <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-600 dark:text-red-400">
      <div className="flex items-center gap-2 text-sm font-medium">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 hover:bg-red-500/20"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
