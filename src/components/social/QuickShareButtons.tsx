
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, Star, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MatchData } from '@/components/logging/match/MatchLogger';
import { MatchContentTemplateService, MatchPrivacyLevel } from '@/services/MatchContentTemplateService';

interface QuickShareButtonsProps {
  matchData: MatchData;
  onQuickShare: (content: string, privacyLevel: string, templateType: string) => void;
  disabled?: boolean;
}

export function QuickShareButtons({ matchData, onQuickShare, disabled }: QuickShareButtonsProps) {
  const outcome = matchData.match_outcome;

  const handleQuickShare = (templateType: 'victory' | 'learning' | 'experience', privacyLevel: MatchPrivacyLevel) => {
    const template = MatchContentTemplateService.generateContent(matchData, privacyLevel);
    onQuickShare(template.content, template.privacyLevel, templateType);
  };

  const quickShareOptions = [
    {
      type: 'victory' as const,
      label: 'Share Victory',
      description: 'Celebrate your win',
      icon: Trophy,
      color: 'bg-green-100 text-green-700 hover:bg-green-200',
      privacyLevel: 'summary' as MatchPrivacyLevel,
      show: outcome === 'won'
    },
    {
      type: 'learning' as const,
      label: 'Share Learning',
      description: 'Focus on growth',
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      privacyLevel: 'basic' as MatchPrivacyLevel,
      show: outcome === 'lost'
    },
    {
      type: 'experience' as const,
      label: 'Share Experience',
      description: 'Tell your story',
      icon: Star,
      color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      privacyLevel: 'detailed' as MatchPrivacyLevel,
      show: true
    }
  ];

  const visibleOptions = quickShareOptions.filter(option => option.show);

  if (visibleOptions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-amber-100 p-2 rounded-full">
          <Zap className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <span className="font-semibold text-amber-900">Quick Share</span>
          <Badge variant="outline" className="text-xs ml-2 bg-amber-100 text-amber-700">
            One-Click
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {visibleOptions.map((option) => {
          const Icon = option.icon;
          
          return (
            <Button
              key={option.type}
              variant="outline"
              disabled={disabled}
              onClick={() => handleQuickShare(option.type, option.privacyLevel)}
              className={`h-auto p-4 flex flex-col items-center gap-2 ${option.color} border-2 transition-all hover:scale-105`}
            >
              <Icon className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs opacity-80">{option.description}</div>
              </div>
            </Button>
          );
        })}
      </div>
      
      <p className="text-xs text-amber-700 mt-3 text-center">
        Click to instantly generate and share content based on your match outcome
      </p>
    </div>
  );
}
