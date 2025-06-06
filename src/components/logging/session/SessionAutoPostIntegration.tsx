
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

  // Check if we have minimal data for post generation
  const hasMinimalData = sessionData.focus_areas?.length || 
                        sessionData.drills?.length || 
                        sessionData.session_note;

  // Auto-generate suggestions when component mounts with data
  useEffect(() => {
    if (hasMinimalData && !hasTriggeredGeneration) {
      generateSuggestions(sessionData);
      setHasTriggeredGeneration(true);
    }
  }, [hasMinimalData, sessionData, generateSuggestions, hasTriggeredGeneration]);

  if (!hasMinimalData) {
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
                <p className="text-sm text-purple-700">AI-powered post suggestions ready</p>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
