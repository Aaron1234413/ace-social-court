
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Users, Heart, MessageCircle } from 'lucide-react';
import { PrivacyLevel } from './PrivacySelector';

interface PrivacyPreviewProps {
  privacyLevel: PrivacyLevel;
  followingCount: number;
  content?: string;
  userProfile?: {
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

export function PrivacyPreview({ 
  privacyLevel, 
  followingCount, 
  content = "Your post content will appear here...",
  userProfile 
}: PrivacyPreviewProps) {
  const getPreviewMessage = () => {
    switch (privacyLevel) {
      case 'private':
        if (followingCount === 0) {
          return "No one can see this yet - follow some players first!";
        }
        return `Visible to ${followingCount} people you follow`;
      case 'public':
        return "Visible to all Rally players";
      case 'public_highlights':
        return "Featured in community highlights - great for connecting!";
      default:
        return "Preview not available";
    }
  };

  const shouldShowStats = privacyLevel === 'private' && followingCount === 0;
  const showGracefulDegradation = shouldShowStats && content;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Eye className="h-4 w-4" />
        Preview: {getPreviewMessage()}
      </div>
      
      <Card className="border-dashed">
        <CardContent className="p-4">
          {showGracefulDegradation ? (
            // Graceful degradation - show stats instead of hiding
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.avatar_url} />
                  <AvatarFallback>
                    {userProfile?.full_name?.[0] || userProfile?.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">
                    {userProfile?.full_name || userProfile?.username || 'You'}
                  </div>
                  <div className="text-xs text-muted-foreground">Posted a training update</div>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded p-3 text-center">
                <div className="text-sm text-muted-foreground mb-2">
                  Content hidden due to privacy settings
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>3 likes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    <span>1 comment</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Normal preview
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.avatar_url} />
                  <AvatarFallback>
                    {userProfile?.full_name?.[0] || userProfile?.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">
                    {userProfile?.full_name || userProfile?.username || 'You'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {privacyLevel === 'public_highlights' ? 'Featured Post' : 'Just now'}
                  </div>
                </div>
              </div>
              
              <div className="text-sm">
                {content}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  <span>Like</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>Comment</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Educational messaging */}
      {privacyLevel === 'private' && followingCount >= 3 && (
        <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded">
          💡 Consider switching to public to reach more players and grow your network!
        </div>
      )}
      
      {privacyLevel === 'private' && followingCount < 3 && followingCount > 0 && (
        <div className="text-xs bg-amber-50 text-amber-700 p-2 rounded">
          🤝 Follow more players to share with a larger network, or try public highlights to connect with the community!
        </div>
      )}
    </div>
  );
}
