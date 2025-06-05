
import React, { useEffect, useState } from 'react';
import { PostComposer } from '@/components/social/PostComposer';
import { SessionFormValues } from './sessionSchema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Brain, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAutoPostGeneration } from '@/hooks/useAutoPostGeneration';

interface SessionAutoPostIntegrationProps {
  sessionData: SessionFormValues;
  onPostCreated?: () => void;
}

export function SessionAutoPostIntegration({ 
  sessionData, 
  onPostCreated 
}: SessionAutoPostIntegrationProps) {
  const { suggestions, isGenerating, generateSuggestions } = useAutoPostGeneration();
  const [hasTriggeredGeneration, setHasTriggeredGeneration] = useState(false);

  // More flexible check for minimal data - just need any meaningful content
  const hasMinimalData = !!(
    sessionData.focus_areas?.length || 
    sessionData.drills?.length || 
    sessionData.session_note?.trim() ||
    sessionData.physical_data ||
    sessionData.mental_data ||
    sessionData.technical_data
  );

  console.log('SessionAutoPostIntegration - hasMinimalData:', hasMinimalData, {
    focus_areas: sessionData.focus_areas?.length,
    drills: sessionData.drills?.length,
    session_note: !!sessionData.session_note?.trim(),
    physical_data: !!sessionData.physical_data,
    mental_data: !!sessionData.mental_data,
    technical_data: !!sessionData.technical_data
  });

  // Auto-generate suggestions when component mounts with data
  useEffect(() => {
    console.log('SessionAutoPostIntegration useEffect:', { hasMinimalData, hasTriggeredGeneration });
    
    if (hasMinimalData && !hasTriggeredGeneration && !isGenerating) {
      console.log('🚀 Triggering auto-generation for session data...');
      setHasTriggeredGeneration(true);
      generateSuggestions(sessionData).catch(error => {
        console.error('❌ Failed to generate suggestions:', error);
        // Reset the flag so user can try again
        setHasTriggeredGeneration(false);
      });
    }
  }, [hasMinimalData, sessionData, generateSuggestions, hasTriggeredGeneration, isGenerating]);

  // Always render the component if we have session data, even without minimal data
  // This ensures users can still create posts manually
  if (!sessionData || !sessionData.session_date) {
    console.log('SessionAutoPostIntegration - No session data provided');
    return null;
  }

  return (
    <div className="space-y-4">
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-purple-900">Share Your Session</CardTitle>
                <p className="text-sm text-purple-700">
                  {hasMinimalData 
                    ? 'AI-powered post suggestions ready' 
                    : 'Create a post about your session'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isGenerating && (
                <Badge variant="outline" className="bg-white border-purple-200 text-purple-700">
                  <Brain className="h-3 w-3 mr-1 animate-pulse" />
                  Generating...
                </Badge>
              )}
              {suggestions.length > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  <Zap className="h-3 w-3 mr-1" />
                  {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}
                </Badge>
              )}
              {hasMinimalData && (
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Ready
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
              <strong>Debug:</strong> hasMinimalData: {hasMinimalData.toString()}, 
              hasTriggered: {hasTriggeredGeneration.toString()}, 
              isGenerating: {isGenerating.toString()}, 
              suggestions: {suggestions.length}
            </div>
          )}
          
          <PostComposer 
            sessionData={sessionData}
            onSuccess={onPostCreated}
            className="border-0 shadow-none bg-transparent"
          />
        </CardContent>
      </Card>
    </div>
  );
}
