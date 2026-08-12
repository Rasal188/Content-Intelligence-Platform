import { Inbox } from "lucide-react";
import type { FC, ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

/**
 * Reusable professional empty state component.
 */
export const EmptyState: FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/5 text-primary/40">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-medium text-primary">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-primary/50">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
