
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface SessionActionsProps {
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit?: boolean;
}

export default function SessionActions({ 
  onBack, 
  onSubmit, 
  isSubmitting,
  canSubmit = true 
}: SessionActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={isSubmitting}
        className="flex-1 h-12 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Selection
      </Button>
      
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || !canSubmit}
        className="flex-1 h-12 gap-2 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving Session...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Session
          </>
        )}
      </Button>
    </div>
  );
}
