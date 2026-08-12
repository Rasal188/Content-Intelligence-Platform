import { FileText, FolderOpen } from "lucide-react";
import type { DocumentItem } from "../_types/analysis";
import { formatFileSize } from "../_utils/file-utils";
import { EmptyState } from "./empty-state";

interface RecentDocumentsProps {
  documents: DocumentItem[];
}

/**
 * List component displaying recent document items.
 */
export function RecentDocuments({ documents }: RecentDocumentsProps) {
  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents uploaded"
        description="Documents you submit for analysis will appear here."
        icon={<FolderOpen className="h-6 w-6" />}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="divide-y divide-border/50">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-primary">
                  {doc.name}
                </p>
                <p className="text-xs text-primary/50">
                  {doc.extension.toUpperCase()} • {formatFileSize(doc.size)} •{" "}
                  {new Date(doc.uploadedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-primary/70 uppercase">
              {doc.source}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
