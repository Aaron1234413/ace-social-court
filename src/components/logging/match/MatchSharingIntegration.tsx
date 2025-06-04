
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Share2, Sparkles, Brain, Settings, Clock } from 'lucide-react';
import { MatchData } from './MatchLogger';
import { useSharingPreferences } from '@/hooks/useSharingPreferences';
import { MatchContentTemplateService, MatchPrivacyLevel } from '@/services/MatchContentTemplateService';

interface MatchSharingIntegrationProps {
  matchData: MatchData;
  onSharingPreferenceChange: (enableSharing: boolean, autoShare: boolean) => void;
  onPreviewContent: (content: string) => void;
}

export function MatchSharingIntegration({ 
  matchData, 
  onSharingPreferenceChange,
  onPreviewContent 
}: MatchSharingIntegrationProps) {
  const { preferences, patterns, getSmartDefaults } = useSharingPreferences();
  const [enableSharing, setEnableSharing] = useState(true);
  const [autoShare, setAutoShare] = useState(false);
  const [selectedPrivacy, setSelectedPrivacy] = useState<MatchPrivacyLevel>('basic');
  const [showSettings, setShowSettings] = useState(false);

  // Update defaults based on match outcome and user patterns
  useEffect(() => {
    if (matchData.match_outcome && preferences) {
      const smartDefaults = getSmartDefaults(matchData.match_outcome);
      setAutoShare(smartDefaults.autoShare || false);
      
      // Set privacy based on outcome and user patterns
      if (matchData.match_outcome === 'won') {
        setSelectedPrivacy(smartDefaults.defaultWinPrivacy);
      } else if (matchData.match_outcome === 'lost') {
        setSelectedPrivacy(smartDefaults.defaultLossPrivacy);
      } else {
        setSelectedPrivacy(smartDefaults.defaultTiePrivacy || 'basic');
      }
    }
  }, [matchData.match_outcome, preferences, getSmartDefaults]);

  // Generate preview content when privacy level changes
  useEffect(() => {
    if (enableSharing && matchData.match_outcome) {
      const template = MatchContentTemplateService.generateContent(matchData, selectedPrivacy);
      onPreviewContent(template.content);
    }
  }, [selectedPrivacy, matchData, enableSharing, onPreviewContent]);

  const handleSharingToggle = (enabled: boolean) => {
    setEnableSharing(enabled);
    onSharingPreferenceChange(enabled, autoShare);
  };

  const handleAutoShareToggle = (auto: boolean) => {
    setAutoShare(auto);
    onSharingPreferenceChange(enableSharing, auto);
  };

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'won': return 'text-green-700 bg-green-100 border-green-200';
      case 'lost': return 'text-blue-700 bg-blue-100 border-blue-200';
      default: return 'text-purple-700 bg-purple-100 border-purple-200';
    }
  };

  const getConfidenceMessage = () => {
    if (!patterns) return null;

    const { match_outcome } = matchData;
    if (match_outcome === 'won' && patterns.winShareRate > 0.8) {
      return "You usually share your victories - great for motivation!";
    } else if (match_outcome === 'lost' && patterns.lossShareRate < 0.3) {
      return "You tend to keep losses private - that's okay, learning is personal.";
    } else if (patterns.totalPosts < 5) {
      return "Building your sharing habit - each post helps the community grow!";
    }
    return "Based on your sharing patterns, here are smart suggestions.";
  };

  if (!matchData.match_outcome) {
    return null;
  }

  return (
    <Card className={`border-2 ${getOutcomeColor(matchData.match_outcome)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            <CardTitle className="text-lg">Share This Match</CardTitle>
            {patterns && (
              <Badge variant="outline" className="text-xs">
                <Brain className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        {getConfidenceMessage() && (
          <p className="text-sm text-muted-foreground mt-1">
            {getConfidenceMessage()}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main sharing toggle */}
        <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border">
          <div>
            <Label htmlFor="enable-sharing" className="text-sm font-medium">
              Enable sharing for this match
            </Label>
            <p className="text-xs text-muted-foreground">
              Generate and share content about this match
            </p>
          </div>
          <Switch
            id="enable-sharing"
            checked={enableSharing}
            onCheckedChange={handleSharingToggle}
          />
        </div>

        {enableSharing && (
          <>
            {/* Privacy level quick selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sharing Level</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['basic', 'summary', 'detailed'] as MatchPrivacyLevel[]).map((level) => (
                  <Button
                    key={level}
                    variant={selectedPrivacy === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPrivacy(level)}
                    className="justify-start"
                  >
                    <span className="capitalize">{level}</span>
                    {level === selectedPrivacy && patterns?.preferredPrivacyLevel === level && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Your usual
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Auto-share option */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <Label htmlFor="auto-share" className="text-sm font-medium text-blue-900">
                  Auto-share after saving match
                </Label>
                <p className="text-xs text-blue-700">
                  Automatically post to your timeline when you save this match
                </p>
              </div>
              <Switch
                id="auto-share"
                checked={autoShare}
                onCheckedChange={handleAutoShareToggle}
              />
            </div>

            {/* Smart recommendations */}
            {patterns && (
              <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Smart Suggestion</span>
                </div>
                <div className="text-xs text-purple-700 space-y-1">
                  <p>• You share {Math.round(patterns.winShareRate * 100)}% of your wins</p>
                  <p>• You share {Math.round(patterns.lossShareRate * 100)}% of your losses</p>
                  <p>• Your preferred level: {patterns.preferredPrivacyLevel}</p>
                </div>
              </div>
            )}

            {/* Preview indicator */}
            <div className="flex items-center justify-center p-2 bg-amber-50 rounded-lg border border-amber-200">
              <Clock className="h-4 w-4 text-amber-600 mr-2" />
              <span className="text-xs text-amber-700">
                Content preview will be generated after saving your match
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
