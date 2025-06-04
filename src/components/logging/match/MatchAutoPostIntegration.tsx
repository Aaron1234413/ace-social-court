import React, { useEffect, useState } from 'react';
import { PostComposer } from '@/components/social/PostComposer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Brain, Zap, Star, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MatchContentTemplateService } from '@/services/MatchContentTemplateService';
import { useEnhancedAutoPostGeneration } from '@/hooks/useEnhancedAutoPostGeneration';

interface MatchAutoPostIntegrationProps {
  matchData: any;
  onPostCreated?: () => void;
}

export function MatchAutoPostIntegration({ 
  matchData, 
  onPostCreated 
}: MatchAutoPostIntegrationProps) {
  const [previewContent, setPreviewContent] = useState<string>('');
  const { suggestions, isGenerating } = useEnhancedAutoPostGeneration();
  
  // Check if we have match result data
  const hasMatchData = matchData?.match_outcome || matchData?.score || matchData?.opponent_name;

  useEffect(() => {
    if (hasMatchData) {
      // Generate preview content using smart defaults
      const smartDefaults = MatchContentTemplateService.getSmartDefaults(matchData);
      const template = MatchContentTemplateService.generateContent(matchData, smartDefaults.privacyLevel);
      setPreviewContent(template.content);
    }
  }, [hasMatchData, matchData]);

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
  const isLoss = matchData?.match_outcome === 'lost';

  return (
    <div className="space-y-4">
      {/* Match Sharing Overview */}
      <Card className={`border-2 ${
        isWin ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' : 
        isLoss ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50' :
        'border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                isWin ? 'bg-green-100' : 
                isLoss ? 'bg-blue-100' : 
                'bg-purple-100'
              }`}>
                {isWin ? (
                  <Trophy className="h-5 w-5 text-green-600" />
                ) : isLoss ? (
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                ) : (
                  <Target className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <div>
                <CardTitle className={`text-lg ${
                  isWin ? 'text-green-900' : 
                  isLoss ? 'text-blue-900' : 
                  'text-purple-900'
                }`}>
                  Share Your Match
                </CardTitle>
                <p className={`text-sm ${
                  isWin ? 'text-green-700' : 
                  isLoss ? 'text-blue-700' : 
                  'text-purple-700'
                }`}>
                  {isWin 
                    ? 'Celebrate your victory with the community!' 
                    : isLoss 
                      ? 'Share your learning journey and inspire others'
                      : 'Share your competitive experience'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white border-purple-200 text-purple-700">
                <Brain className="h-3 w-3 mr-1" />
                Smart Templates
              </Badge>
              <Badge variant="outline" className={`${
                isWin ? 'bg-green-100 text-green-700 border-green-200' :
                isLoss ? 'bg-blue-100 text-blue-700 border-blue-200' :
                'bg-purple-100 text-purple-700 border-purple-200'
              }`}>
                <Star className="h-3 w-3 mr-1" />
                {isWin ? 'Victory' : isLoss ? 'Growth' : 'Experience'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Enhanced Educational Tip with Phase 3 features */}
          <div className="mb-4 p-3 bg-white/80 rounded-lg border border-gray-100">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              New: Quick Share & Customization Available!
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1 text-amber-600">
                <span>⚡</span> Quick Share
              </div>
              <div className="flex items-center gap-1 text-blue-600">
                <span>✏️</span> Edit Content
              </div>
              <div className="flex items-center gap-1 text-purple-600">
                <span>⚙️</span> Save Preferences
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <span>🎯</span> Smart Templates
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              One-click sharing, content customization, and personalized preferences now available!
            </p>
          </div>

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
