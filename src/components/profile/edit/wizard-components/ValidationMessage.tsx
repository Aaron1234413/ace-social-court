
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ValidationMessageProps {
  message: string | null;
}

export const ValidationMessage = ({ message }: ValidationMessageProps) => {
  if (!message) return null;
  
  return (
    <Alert variant="destructive" className="mb-4 mt-2">
      <AlertTriangle className="h-4 w-4 mr-2" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};
