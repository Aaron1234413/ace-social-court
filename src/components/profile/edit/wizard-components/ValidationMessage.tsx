
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationMessageProps {
  message: string | null;
  type?: 'error' | 'warning' | 'info';
  className?: string;
}

export const ValidationMessage = ({ 
  message, 
  type = 'error',
  className 
}: ValidationMessageProps) => {
  if (!message) return null;
  
  const variants = {
    error: {
      variant: "destructive",
      icon: <AlertCircle className="h-4 w-4" />,
    },
    warning: {
      variant: "warning",
      icon: <AlertCircle className="h-4 w-4" />,
    },
    info: {
      variant: "info",
      icon: <Info className="h-4 w-4" />,
    }
  };
  
  const { variant, icon } = variants[type];
  
  return (
    <Alert variant={variant as any} className={cn("flex items-center", className)}>
      {icon}
      <div className="ml-2">
        {type === 'error' && <AlertTitle>Error</AlertTitle>}
        <AlertDescription>{message}</AlertDescription>
      </div>
    </Alert>
  );
};
