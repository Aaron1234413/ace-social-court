
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  variant?: "skeleton" | "spinner" | "progress" | "error";
  count?: number;
  className?: string;
  text?: string;
  progress?: number;
  error?: {
    message: string;
    guidance?: string;
    onRetry?: () => void;
  };
}

export function Loading({
  variant = "skeleton",
  count = 3,
  className,
  text = "Loading...",
  progress = 0,
  error
}: LoadingProps) {
  // Show error regardless of variant if there is an error
  if (error || variant === "error") {
    return (
      <ErrorAlert
        message={error?.message || "Failed to load content"}
        guidance={error?.guidance || "Please try again later or refresh the page"}
        onRetry={error?.onRetry}
        className={className}
      />
    );
  }

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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
