
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload } from 'lucide-react';

interface SessionActionsProps {
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function SessionActions({ onBack, onSubmit, isSubmitting }: SessionActionsProps) {
  return (
    <div className="flex justify-between pt-6">
      <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Pillars
      </Button>
      
      <Button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white flex items-center gap-2 px-8"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Submitting...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Submit Session
          </>
        )}
      </Button>
    </div>
  );
}
