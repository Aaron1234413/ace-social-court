
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, Trophy, Target, Heart, Lock } from 'lucide-react';
import { EnhancedPostSuggestion } from '@/services/EnhancedAutoPostService';
import { MatchPrivacyLevel } from '@/services/MatchContentTemplateService';

interface EnhancedMatchSuggestionsProps {
  suggestions: EnhancedPostSuggestion[];
  onSuggestionSelect: (suggestion: EnhancedPostSuggestion) => void;
  isGenerating?: boolean;
}

const privacyLevelIcons = {
  'private': Lock,
  'basic': Heart,
  'summary': Trophy,
  'detailed': Target,
  'full': Brain,
};

const privacyLevelColors = {
  'private': 'text-gray-600 bg-gray-50',
  'basic': 'text-blue-600 bg-blue-50',
  'summary': 'text-green-600 bg-green-50',
  'detailed': 'text-purple-600 bg-purple-50',
  'full': 'text-orange-600 bg-orange-50',
};

export function EnhancedMatchSuggestions({ 
  suggestions, 
  onSuggestionSelect, 
  isGenerating = false 
}: EnhancedMatchSuggestionsProps) {
  if (isGenerating) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-200">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-full">
            <Brain className="h-5 w-5 text-purple-600 animate-pulse" />
          </div>
          <div>
            <span className="font-semibold text-purple-900">Generating Smart Suggestions...</span>
            <p className="text-sm text-purple-700">Analyzing your match data</p>
          </div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 p-2 rounded-full">
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <span className="font-semibold text-purple-900">Smart Match Suggestions</span>
            <Badge variant="outline" className="text-xs ml-2">
              AI-Powered
            </Badge>
          </div>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          {suggestions.length} option{suggestions.length > 1 ? 's' : ''}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const IconComponent = privacyLevelIcons[suggestion.matchPrivacyLevel];
          const colorClasses = privacyLevelColors[suggestion.matchPrivacyLevel];
          const isRecommended = index === 0;
          
          return (
            <Card 
              key={suggestion.id}
              className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-purple-400"
              onClick={() => onSuggestionSelect(suggestion)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${colorClasses.split(' ')[1]}`}>
                    <IconComponent className={`h-4 w-4 ${colorClasses.split(' ')[0]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {suggestion.template.title}
                      </span>
                      {isRecommended && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          Recommended
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {Math.round(suggestion.confidence * 100)}% match
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                      {suggestion.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${colorClasses}`}>
                          {suggestion.matchPrivacyLevel.charAt(0).toUpperCase() + suggestion.matchPrivacyLevel.slice(1)} Level
                        </Badge>
                        <span className="text-xs text-gray-500">
                          → {suggestion.privacyLevel}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                      >
                        Use This
                      </Button>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2 italic">
                      {suggestion.reasoning}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
