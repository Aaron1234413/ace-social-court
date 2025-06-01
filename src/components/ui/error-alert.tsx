
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorAlertProps {
  title?: string;
  message: string;
  guidance?: string;
  onRetry?: () => void;
  severity?: "error" | "warning" | "info";
  className?: string;
}

export function ErrorAlert({
  title,
  message,
  guidance,
  onRetry,
  severity = "error",
  className
}: ErrorAlertProps) {
  const Icon = severity === "error" 
    ? AlertCircle 
    : severity === "warning" 
      ? AlertTriangle 
      : Info;
  
  const defaultTitle = severity === "error" 
    ? "An error occurred" 
    : severity === "warning" 
      ? "Warning" 
      : "Information";
  
  return (
    <Alert 
      variant={severity === "error" ? "destructive" : "default"}
      className={cn("flex flex-col space-y-2", className)}
    >
      <div className="flex items-start">
        <Icon className="h-5 w-5 mr-2 flex-shrink-0" />
        <div className="flex-1">
          <AlertTitle>{title || defaultTitle}</AlertTitle>
          <AlertDescription>
            <p>{message}</p>
            {guidance && (
              <p className="mt-2 text-sm">{guidance}</p>
            )}
          </AlertDescription>
        </div>
      </div>
      
      {onRetry && (
        <div className="flex justify-end pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className={severity === "error" ? "bg-background text-foreground hover:bg-background/90" : ""}
          >
            Try Again
          </Button>
        </div>
      )}
    </Alert>
  );
}
