
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SessionNavigationControlsProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  canProceed?: boolean;
  isFirstTab?: boolean;
  isLastTab?: boolean;
}

const TAB_ORDER = ['basics', 'coaches', 'physical', 'mental', 'technical', 'summary'];

export default function SessionNavigationControls({
  currentTab,
  onTabChange,
  canProceed = true,
  isFirstTab,
  isLastTab
}: SessionNavigationControlsProps) {
  const currentIndex = TAB_ORDER.indexOf(currentTab);
  
  const handleNext = () => {
    if (currentIndex < TAB_ORDER.length - 1) {
      onTabChange(TAB_ORDER[currentIndex + 1]);
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      onTabChange(TAB_ORDER[currentIndex - 1]);
    }
  };

  return (
    <div className="flex justify-between items-center pt-6 border-t">
      <Button
        variant="outline"
        onClick={handlePrevious}
        disabled={isFirstTab || currentIndex <= 0}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      
      {!isLastTab && (
        <Button
          onClick={handleNext}
          disabled={!canProceed || currentIndex >= TAB_ORDER.length - 1}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
