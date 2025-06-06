
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Users, Globe, GraduationCap, Star, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PrivacyPreview } from './PrivacyPreview';

export type PrivacyLevel = 'private' | 'friends' | 'public' | 'coaches' | 'public_highlights';

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
    value: 'private' as const,
    label: 'Private',
    description: 'Only you can see this post',
    example: 'Perfect for personal notes and reflections',
    icon: Lock,
    tooltip: 'Your post will be completely private. Use this for personal training notes or when you want to keep things to yourself.',
  },
  {
    value: 'friends' as const,
    label: 'Friends',
    description: 'People you follow can see this',
    example: 'Share progress with your tennis network',
    icon: Users,
    tooltip: 'Only players you follow can see this post. Great for sharing with your tennis community and getting feedback from people you know.',
  },
  {
    value: 'public' as const,
    label: 'Public',
    description: 'Anyone can see this post',
    example: 'Inspire the entire Rally community',
    icon: Globe,
    tooltip: 'All Rally players can discover your post. Perfect for sharing tips, celebrating achievements, or connecting with new players.',
  },
  {
    value: 'public_highlights' as const,
    label: 'Public Highlights',
    description: 'Featured in community highlights',
    example: 'Get featured and build your network',
    icon: Star,
    tooltip: 'Your post may be featured in community highlights, giving you maximum visibility and helping you connect with other players.',
  },
  {
    value: 'coaches' as const,
    label: 'Coaches Only',
    description: 'Only coaches can see this',
    example: 'Get professional feedback and guidance',
    icon: GraduationCap,
    tooltip: 'Only verified coaches can see this post. Use this when you want professional feedback on your technique or training.',
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
  
  // Enforce minimum follow requirement for public posting
  const MINIMUM_FOLLOWS_FOR_PUBLIC = 3;
  const canPostPublic = followingCount >= MINIMUM_FOLLOWS_FOR_PUBLIC;
  
  // Auto-adjust privacy level if user doesn't meet requirements
  React.useEffect(() => {
    if ((value === 'public' || value === 'friends') && !canPostPublic && followingCount > 0) {
      onValueChange('private');
    }
  }, [value, canPostPublic, onValueChange, followingCount]);

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Privacy Level</label>
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
        
        {!canPostPublic && followingCount > 0 && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              Follow at least {MINIMUM_FOLLOWS_FOR_PUBLIC} users to unlock public and friends posting. 
              This helps ensure you're building meaningful connections.
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
              const isDisabled = !canPostPublic && followingCount > 0 && (option.value === 'public' || option.value === 'friends');
              const isRecommendedForNewUsers = followingCount === 0 && option.value === 'public_highlights';
              const isRecommendedForLimitedFollows = !canPostPublic && followingCount > 0 && option.value === 'private';
              
              return (
                <Tooltip key={option.value}>
                  <TooltipTrigger asChild>
                    <SelectItem 
                      value={option.value}
                      disabled={isDisabled}
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <Icon className={`h-4 w-4 ${isDisabled ? 'text-muted-foreground' : ''}`} />
                        <div className="flex flex-col flex-1">
                          <span className={`flex items-center gap-1 ${isDisabled ? 'text-muted-foreground' : ''}`}>
                            {option.label}
                            {isRecommendedForNewUsers && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                                Recommended
                              </span>
                            )}
                            {isRecommendedForLimitedFollows && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                                Recommended
                              </span>
                            )}
                            {isDisabled && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-1 rounded">
                                Locked
                              </span>
                            )}
                          </span>
                          <span className={`text-xs ${isDisabled ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                            {option.description}
                            {isDisabled && ` (Need ${MINIMUM_FOLLOWS_FOR_PUBLIC - followingCount} more follows)`}
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
        {followingCount === 0 && value === 'public_highlights' && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            🌟 Perfect for new users! Your posts will be featured to help you connect with the community.
          </div>
        )}
        
        {canPostPublic && value === 'private' && (
          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
            🎉 You can now post publicly! Consider sharing with friends or the entire community.
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
