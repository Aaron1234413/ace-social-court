
import React from 'react';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';

interface PreferencesPlaceholderProps {
  onOpenPreferences?: () => void;
}

const PreferencesPlaceholder: React.FC<PreferencesPlaceholderProps> = ({ 
  onOpenPreferences 
}) => {
  return (
    <div className="bg-muted/40 rounded-lg p-4 text-center mb-4 border border-dashed border-muted-foreground/50">
      <div className="flex flex-col items-center justify-center gap-2">
        <InfoIcon className="h-10 w-10 text-muted-foreground/70" />
        <h3 className="text-lg font-medium">Personalize your Tennis AI</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          In the future, you'll be able to personalize your Tennis AI by providing details about your 
          playing style, experience level, and training goals.
        </p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={onOpenPreferences}
          disabled={!onOpenPreferences}
        >
          Coming Soon
        </Button>
      </div>
    </div>
  );
};

export default PreferencesPlaceholder;
