
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Lock, Users, Globe, GraduationCap, Loader2 } from 'lucide-react';
import { PrivacyLevel } from './EnhancedPrivacySelector';
import { usePreviewService } from '@/services/PreviewService';
import { useAuth } from '@/components/AuthProvider';
import { Badge } from '@/components/ui/badge';

interface EnhancedPrivacyPreviewProps {
  privacyLevel: PrivacyLevel;
  postContent?: string;
  authorName?: string;
  followingCount?: number;
}

const privacyConfig = {
  private: {
    icon: Lock,
    label: 'Private',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  },
  friends: {
    icon: Users,
    label: 'Friends',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  public: {
    icon: Globe,
    label: 'Public',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  coaches: {
    icon: GraduationCap,
    label: 'Coaches Only',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
};

export function EnhancedPrivacyPreview({ 
  privacyLevel, 
  postContent = "Your post content will appear here...",
  authorName = "Your Name",
  followingCount = 0
}: EnhancedPrivacyPreviewProps) {
  const { user } = useAuth();
  const { generatePreview } = usePreviewService();
  const [preview, setPreview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const config = privacyConfig[privacyLevel];
  const Icon = config.icon;

  useEffect(() => {
    const generatePreviewData = async () => {
      if (!user) return;

      setIsLoading(true);
      const startTime = performance.now();

      try {
        const previewData = await generatePreview(
          {
            id: 'preview-post',
            content: postContent,
            user_id: user.id
          },
          privacyLevel,
          {
            currentUserId: user.id,
            userFollowings: [], // This would come from user context
            userType: 'player',
            isCoach: false
          }
        );

        const endTime = performance.now();
        setResponseTime(endTime - startTime);
        setPreview(previewData);
      } catch (error) {
        console.error('Preview generation failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generatePreviewData();
  }, [privacyLevel, postContent, user, generatePreview]);

  return (
    <Card className={`border-2 border-blue-200 ${config.bgColor}/30`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview: How others will see your post
          </div>
          {responseTime !== null && (
            <Badge variant="outline" className="text-xs">
              {responseTime.toFixed(0)}ms
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon className={`h-3 w-3 ${config.color}`} />
            <span className="text-xs font-medium">{config.label}</span>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          </div>
          
          {preview && (
            <p className="text-xs text-muted-foreground">
              This post will be visible to: <strong>{preview.audience}</strong>
            </p>
          )}
          
          <div className="bg-white rounded border p-3 text-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {authorName.charAt(0)}
                </span>
              </div>
              <span className="font-medium">{authorName}</span>
              <Icon className={`h-3 w-3 ${config.color}`} />
            </div>
            <p className="text-gray-600 line-clamp-3">{postContent}</p>
          </div>

          {/* Audience breakdown */}
          {preview && (
            <div className="text-xs space-y-1">
              <div className="font-medium">Audience Details:</div>
              <div className="text-muted-foreground">
                {privacyLevel === 'friends' && followingCount > 0 && (
                  <span>• {followingCount} people you follow will see this</span>
                )}
                {privacyLevel === 'public' && (
                  <span>• All platform users can see this</span>
                )}
                {privacyLevel === 'private' && (
                  <span>• Only you can see this</span>
                )}
                {privacyLevel === 'coaches' && (
                  <span>• Only verified coaches can see this</span>
                )}
              </div>
            </div>
          )}
          
          {/* Performance indicator */}
          {responseTime !== null && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Preview generated in {responseTime.toFixed(0)}ms</span>
              {responseTime < 300 ? (
                <Badge variant="outline" className="text-green-600 border-green-600">Fast</Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">Slow</Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
