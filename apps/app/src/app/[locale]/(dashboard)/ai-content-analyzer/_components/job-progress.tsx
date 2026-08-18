import type { FC } from "react";

interface JobProgressProps {
  progress: number;
  stageName: string;
}

/**
 * Progress bar component with active stage message and percent display.
 */
export const JobProgress: FC<JobProgressProps> = ({ progress, stageName }) => {
  const safePercent = Math.min(100, Math.max(0, progress));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-primary/80">{stageName}</span>
        <span className="font-mono text-primary/60">{safePercent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
};
