
import React, { useEffect } from 'react';
import { AutoPostSuggestion } from './AutoPostSuggestion';
import { useAutoPostGeneration } from '@/hooks/useAutoPostGeneration';
import { SessionFormValues } from './sessionSchema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface SessionAutoPostIntegrationProps {
  sessionData: SessionFormValues;
  onPostCreated?: () => void;
}

export function SessionAutoPostIntegration({ 
  sessionData, 
  onPostCreated 
}: SessionAutoPostIntegrationProps) {
  const { 
    suggestions, 
    isGenerating, 
    generateSuggestions, 
    removeSuggestion 
  } = useAutoPostGeneration();

  useEffect(() => {
    // Generate suggestions when session data changes significantly
    const hasMinimalData = sessionData.focus_areas?.length || 
                          sessionData.drills?.length || 
                          sessionData.session_note;
    
    if (hasMinimalData) {
      console.log('🤖 Session data sufficient for post generation, generating suggestions...');
      generateSuggestions(sessionData);
    }
  }, [
    sessionData.focus_areas?.join(','),
    sessionData.drills?.map(d => d.name).join(','),
    sessionData.session_note,
    sessionData.physical_data,
    sessionData.mental_data,
    generateSuggestions
  ]);

  if (isGenerating) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating post suggestions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">
        AI Post Suggestions
      </div>
      
      {suggestions.map((suggestion) => (
        <AutoPostSuggestion
          key={suggestion.id}
          suggestion={suggestion}
          onAccept={() => {
            removeSuggestion(suggestion.id);
            onPostCreated?.();
          }}
          onDecline={() => {
            removeSuggestion(suggestion.id);
          }}
          onEdit={(content, privacyLevel) => {
            console.log('Post edited:', { content, privacyLevel });
          }}
        />
      ))}
    </div>
  );
}
