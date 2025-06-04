
import React, { useEffect } from 'react';
import { PostComposer } from '@/components/social/PostComposer';
import { SessionFormValues } from './sessionSchema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface SessionAutoPostIntegrationProps {
  sessionData: SessionFormValues;
  onPostCreated?: () => void;
}

export function SessionAutoPostIntegration({ 
  sessionData, 
  onPostCreated 
}: SessionAutoPostIntegrationProps) {
  // Check if we have minimal data for post generation
  const hasMinimalData = sessionData.focus_areas?.length || 
                        sessionData.drills?.length || 
                        sessionData.session_note;

  if (!hasMinimalData) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        Share Your Session
      </div>
      
      <PostComposer 
        sessionData={sessionData}
        onSuccess={onPostCreated}
      />
    </div>
  );
}
