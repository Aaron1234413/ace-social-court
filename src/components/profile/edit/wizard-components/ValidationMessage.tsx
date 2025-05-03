
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ValidationMessageProps {
  message: string | null;
}

export const ValidationMessage = ({ message }: ValidationMessageProps) => {
  if (!message) return null;
  
  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};
