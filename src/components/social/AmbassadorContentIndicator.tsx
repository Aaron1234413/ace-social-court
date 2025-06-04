
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users } from 'lucide-react';

interface AmbassadorContentIndicatorProps {
  isAmbassadorContent?: boolean;
  ambassadorName?: string;
  contentType?: 'struggle' | 'success' | 'tip' | 'question' | 'encouragement';
  className?: string;
}

export function AmbassadorContentIndicator({ 
  isAmbassadorContent, 
  ambassadorName, 
  contentType,
  className 
}: AmbassadorContentIndicatorProps) {
  if (!isAmbassadorContent) return null;

  const getContentTypeStyle = (type?: string) => {
    switch (type) {
      case 'struggle':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'tip':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'question':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'encouragement':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      default:
        return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant="outline" 
        className={`flex items-center gap-1 text-xs ${getContentTypeStyle(contentType)}`}
      >
        <Sparkles className="h-3 w-3" />
        Rally Ambassador
      </Badge>
      
      {ambassadorName && (
        <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
          <Users className="h-3 w-3 mr-1" />
          {ambassadorName}
        </Badge>
      )}
    </div>
  );
}
