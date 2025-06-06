
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Globe, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PrivacyPreview } from './PrivacyPreview';

export type PrivacyLevel = 'private' | 'public';

interface PrivacySelectorProps {
  value: PrivacyLevel;
  onValueChange: (value: PrivacyLevel) => void;
  followingCount?: number;
  showPreview?: boolean;
  content?: string;
  userProfile?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

const privacyOptions = [
  {
    value: 'public' as const,
    label: 'Public',
    description: 'Anyone can see this post',
    example: 'Connect with the entire Rally community',
    icon: Globe,
    tooltip: 'All Rally players can discover your post. Perfect for sharing tips, celebrating achievements, or connecting with new players.',
  },
  {
    value: 'private' as const,
    label: 'Private',
    description: 'Only people you follow can see this',
    example: 'Share with your tennis network only',
    icon: Lock,
    tooltip: 'Only players you follow can see this post. Perfect for sharing progress and getting feedback from your trusted tennis community.',
  },
];

export function PrivacySelector({ 
  value, 
  onValueChange, 
  followingCount = 0,
  showPreview = true,
  content,
  userProfile
}: PrivacySelectorProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Default to public for new users to encourage community engagement
  React.useEffect(() => {
    if (!value) {
      onValueChange('public');
    }
  }, [value, onValueChange]);

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Who can see this post?</label>
          {showPreview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className="text-xs"
            >
              <Info className="h-3 w-3 mr-1" />
              Preview
              {isPreviewOpen ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>
          )}
        </div>
        
        {/* Encouraging message for new users */}
        {followingCount === 0 && value === 'public' && (
          <Alert className="border-blue-200 bg-blue-50">
            <Globe className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              🌟 Perfect for new users! Public posts help you connect and discover the Rally community.
            </AlertDescription>
          </Alert>
        )}
        
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select privacy level" />
          </SelectTrigger>
          <SelectContent>
            {privacyOptions.map((option) => {
              const Icon = option.icon;
              const isRecommendedForNew = followingCount <= 2 && option.value === 'public';
              const isRecommendedForEstablished = followingCount > 10 && option.value === 'private';
              
              return (
                <Tooltip key={option.value}>
                  <TooltipTrigger asChild>
                    <SelectItem value={option.value}>
                      <div className="flex items-center space-x-2 w-full">
                        <Icon className="h-4 w-4" />
                        <div className="flex flex-col flex-1">
                          <span className="flex items-center gap-1">
                            {option.label}
                            {isRecommendedForNew && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                                Recommended
                              </span>
                            )}
                            {isRecommendedForEstablished && (
                              <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                                Good Choice
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                          <span className="text-xs text-blue-600 font-medium">
                            {option.example}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{option.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </SelectContent>
        </Select>
        
        {/* Educational messaging */}
        {followingCount > 0 && followingCount <= 5 && value === 'private' && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            💡 You have a small network. Consider going public to discover more players and grow your connections!
          </div>
        )}
        
        {followingCount > 10 && value === 'public' && (
          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
            🎉 Great! You're sharing with the entire community. Your post will help inspire other players.
          </div>
        )}
        
        {followingCount > 10 && value === 'private' && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            👥 Sharing privately with your network of {followingCount} players you follow.
          </div>
        )}
        
        {/* Privacy Preview */}
        {showPreview && (
          <Collapsible open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <CollapsibleContent className="space-y-2">
              <PrivacyPreview 
                privacyLevel={value}
                followingCount={followingCount}
                content={content}
                userProfile={userProfile}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </TooltipProvider>
  );
}
