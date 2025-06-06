
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getPrivacyLevelInfo } from '@/utils/privacySanitization';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PrivacyIndicatorProps {
  privacyLevel: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function PrivacyIndicator({ 
  privacyLevel, 
  size = 'sm', 
  showLabel = false 
}: PrivacyIndicatorProps) {
  const privacyInfo = getPrivacyLevelInfo(privacyLevel);

  // Don't show indicator for public posts to reduce visual clutter
  if (privacyLevel === 'public') {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${privacyInfo.color} border-current text-xs ${size === 'sm' ? 'px-1 py-0' : 'px-2 py-1'}`}
          >
            <span className="mr-1">{privacyInfo.icon}</span>
            {showLabel && privacyInfo.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{privacyInfo.label}</p>
          <p className="text-xs text-muted-foreground">{privacyInfo.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
