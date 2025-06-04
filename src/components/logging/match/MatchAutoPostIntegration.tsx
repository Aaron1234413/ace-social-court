
import React, { useEffect, useState } from 'react';
import { PostComposer } from '@/components/social/PostComposer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target, Brain, Zap, Star, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MatchContentTemplateService } from '@/services/MatchContentTemplateService';
import { useEnhancedAutoPostGeneration } from '@/hooks/useEnhancedAutoPostGeneration';
import { useSharingPreferences } from '@/hooks/useSharingPreferences';

interface MatchAutoPostIntegrationProps {
  matchData: any;
  onPostCreated?: () => void;
  autoShare?: boolean;
  previewContent?: string;
}

export function MatchAutoPostIntegration({ 
  matchData, 
  onPostCreated,
  autoShare = false,
  previewContent 
}: MatchAutoPostIntegrationProps) {
  const [previewContentState, setPreviewContentState] = useState<string>('');
  const { suggestions, isGenerating } = useEnhancedAutoPostGeneration();
  const { recordSharingAction } = useSharingPreferences();
  const [startTime] = useState(Date.now());
  
  // Check if we have match result data
  const hasMatchData = matchData?.match_outcome || matchData?.score || matchData?.opponent_name;

  useEffect(() => {
    if (hasMatchData) {
      // Use provided preview content or generate new one
      if (previewContent) {
        setPreviewContentState(previewContent);
      } else {
        // Generate preview content using smart defaults
        const smartDefaults = MatchContentTemplateService.getSmartDefaults(matchData);
        const template = MatchContentTemplateService.generateContent(matchData, smartDefaults.privacyLevel);
        setPreviewContentState(template.content);
      }
    }
  }, [hasMatchData, matchData, previewContent]);

  const handlePostSuccess = async (post?: any) => {
    // Record the sharing action for learning
    const timeToShare = Math.round((Date.now() - startTime) / 1000 / 60); // minutes
    
    await recordSharingAction({
      outcome: matchData?.match_outcome || 'tie',
      privacyLevel: post?.privacy_level || 'summary',
      timeToShare,
      wasAutoShared: autoShare
    });

    onPostCreated?.();
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
            onSuccess={handlePostSuccess}
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
      {/* Auto-share indicator */}
      {autoShare && (
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <Sparkles className="h-5 w-5 text-amber-600 animate-pulse" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900">Auto-Sharing Enabled</h4>
                <p className="text-sm text-amber-700">
                  Your content is being prepared based on your sharing preferences
                </p>
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                <Clock className="h-3 w-3 mr-1" />
                Smart Mode
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

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
                  {autoShare ? 'Auto-Sharing Your Match' : 'Share Your Match'}
                </CardTitle>
                <p className={`text-sm ${
                  isWin ? 'text-green-700' : 
                  isLoss ? 'text-blue-700' : 
                  'text-purple-700'
                }`}>
                  {autoShare 
                    ? 'Content generated based on your preferences'
                    : isWin 
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
          {/* Enhanced Educational Tip with Phase 4 integration features */}
          <div className="mb-4 p-3 bg-white/80 rounded-lg border border-gray-100">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Intelligent Sharing - Now with Learning!
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-1 text-amber-600">
                <span>🧠</span> Learns Patterns
              </div>
              <div className="flex items-center gap-1 text-blue-600">
                <span>⚡</span> Smart Defaults
              </div>
              <div className="flex items-center gap-1 text-purple-600">
                <span>🎯</span> Personal Prefs
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <span>🚀</span> Auto-Share
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {autoShare 
                ? 'Your sharing preferences have been applied automatically!'
                : 'The system learns from your sharing behavior to provide better suggestions.'
              }
            </p>
          </div>

          <PostComposer 
            matchData={matchData}
            onSuccess={handlePostSuccess}
            className="border-0 shadow-none bg-transparent"
          />
        </CardContent>
      </Card>
    </div>
  );
}
