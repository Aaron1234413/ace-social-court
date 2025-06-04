
import React, { useEffect, useState } from 'react';
import { PostComposer } from '@/components/social/PostComposer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Brain, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MatchAutoPostIntegrationProps {
  matchData: any;
  onPostCreated?: () => void;
}

export function MatchAutoPostIntegration({ 
  matchData, 
  onPostCreated 
}: MatchAutoPostIntegrationProps) {
  const [autoSuggestions, setAutoSuggestions] = useState<string[]>([]);
  
  // Check if we have match result data
  const hasMatchData = matchData?.match_outcome || matchData?.score || matchData?.opponent_name;

  useEffect(() => {
    if (hasMatchData) {
      // Generate match-specific suggestions
      const suggestions = generateMatchSuggestions(matchData);
      setAutoSuggestions(suggestions);
    }
  }, [hasMatchData, matchData]);

  const generateMatchSuggestions = (data: any) => {
    const suggestions = [];
    
    if (data.match_outcome === 'won') {
      suggestions.push("Great match today! Feeling proud of my performance 🏆");
      suggestions.push(`Victory feels sweet! ${data.score || 'Hard-fought win'} 🎾`);
    } else if (data.match_outcome === 'lost') {
      suggestions.push("Tough match today, but every loss is a lesson learned 💪");
      suggestions.push("Not the result I wanted, but my game is getting stronger 🎯");
    }
    
    if (data.opponent_name) {
      suggestions.push(`Great match against ${data.opponent_name}! Always learning from tough competition`);
    }

    if (data.surface) {
      suggestions.push(`Playing on ${data.surface} courts today - love the challenge! 🎾`);
    }
    
    return suggestions;
  };

  if (!hasMatchData) {
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-900">Share Your Match</CardTitle>
        </CardHeader>
        <CardContent>
          <PostComposer 
            matchData={matchData}
            onSuccess={onPostCreated}
            className="border-0 shadow-none bg-transparent"
          />
        </CardContent>
      </Card>
    );
  }

  const isWin = matchData?.match_outcome === 'won';

  return (
    <div className="space-y-4">
      <Card className={`border-2 ${isWin ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isWin ? 'bg-green-100' : 'bg-blue-100'}`}>
                {isWin ? (
                  <Trophy className="h-5 w-5 text-green-600" />
                ) : (
                  <Target className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <CardTitle className={`text-lg ${isWin ? 'text-green-900' : 'text-blue-900'}`}>
                  Share Your Match
                </CardTitle>
                <p className={`text-sm ${isWin ? 'text-green-700' : 'text-blue-700'}`}>
                  {isWin ? 'Celebrate your victory!' : 'Share your journey and learnings'}
                </p>
              </div>
            </div>
            {autoSuggestions.length > 0 && (
              <Badge variant="secondary" className="bg-white border-purple-200 text-purple-700">
                <Brain className="h-3 w-3 mr-1" />
                AI Ready
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <PostComposer 
            matchData={matchData}
            onSuccess={onPostCreated}
            className="border-0 shadow-none bg-transparent"
          />
        </CardContent>
      </Card>
    </div>
  );
}
