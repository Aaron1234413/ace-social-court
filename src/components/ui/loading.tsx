
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface LoadingProps {
  variant?: "skeleton" | "spinner" | "progress";
  count?: number;
  className?: string;
  text?: string;
  progress?: number;
}

export function Loading({
  variant = "skeleton",
  count = 3,
  className,
  text = "Loading...",
  progress = 0,
}: LoadingProps) {
  if (variant === "progress") {
    return (
      <div className={cn("w-full space-y-2", className)}>
        <Progress value={progress} className="h-2 w-full" />
        {text && <p className="text-center text-sm text-muted-foreground">{text}</p>}
      </div>
    );
  }

  if (variant === "spinner") {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8", className)}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        {text && <p className="mt-4 text-center text-sm text-muted-foreground">{text}</p>}
      </div>
    );
  }

  // Default skeleton variant
  return (
    <div className={cn("w-full space-y-4", className)}>
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      {text && <p className="text-center text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
