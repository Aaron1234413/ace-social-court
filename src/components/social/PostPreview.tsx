
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Shield, Clock, AlertCircle } from 'lucide-react';
import { usePostPreview } from '@/hooks/usePostPreview';
import { Loading } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface PostPreviewProps {
  postId: string;
  className?: string;
  showCacheStats?: boolean;
}

export function PostPreview({ postId, className, showCacheStats = false }: PostPreviewProps) {
  const { preview, isLoading, error, refetch, cacheStats } = usePostPreview(postId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Loading variant="skeleton" count={1} text="Loading preview..." />
        </CardContent>
      </Card>
    );
  }

  if (error && !preview) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <button 
              onClick={refetch}
              className="text-primary hover:underline ml-2"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preview) return null;

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={preview.author.avatar_url} />
              <AvatarFallback>
                {preview.author.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {preview.author.full_name}
                </span>
                {preview.author.user_type === 'ambassador' && (
                  <Badge variant="secondary" className="text-xs">
                    Ambassador
                  </Badge>
                )}
                {preview.author.user_type === 'coach' && (
                  <Badge variant="outline" className="text-xs">
                    Coach
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(preview.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Privacy indicator */}
          <div className="flex items-center gap-1">
            {preview.is_fallback && (
              <Shield className="h-4 w-4 text-amber-500" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className={`text-sm ${preview.is_fallback ? 'text-muted-foreground italic' : ''}`}>
          {preview.content}
        </div>

        {/* Fallback reason */}
        {preview.is_fallback && preview.fallback_reason && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              <span>Preview limited: {preview.fallback_reason}</span>
            </div>
          </div>
        )}

        {/* Engagement */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>{preview.engagement.likes_count} likes</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            <span>{preview.engagement.comments_count} comments</span>
          </div>
        </div>

        {/* Cache stats (debug) */}
        {showCacheStats && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            Cache: {cacheStats.totalEntries} entries, {cacheStats.memoryUsage}KB, {cacheStats.fillPercentage}% full
          </div>
        )}
      </CardContent>
    </Card>
  );
}
