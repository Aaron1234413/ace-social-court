
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Lock, Users, Globe, GraduationCap } from 'lucide-react';
import { PrivacyLevel } from './EnhancedPrivacySelector';

interface PrivacyPreviewProps {
  privacyLevel: PrivacyLevel;
  postContent?: string;
  authorName?: string;
}

const privacyConfig = {
  private: {
    icon: Lock,
    label: 'Private',
    color: 'text-gray-600',
    audience: 'Just you',
    description: 'Only you can see this post'
  },
  friends: {
    icon: Users,
    label: 'Friends',
    color: 'text-blue-600',
    audience: 'People you follow',
    description: 'People you follow can see this'
  },
  public: {
    icon: Globe,
    label: 'Public',
    color: 'text-green-600',
    audience: 'Everyone on the platform',
    description: 'Anyone can see this post'
  },
  coaches: {
    icon: GraduationCap,
    label: 'Coaches Only',
    color: 'text-purple-600',
    audience: 'Verified coaches only',
    description: 'Only coaches can see this'
  }
};

export function PrivacyPreview({ 
  privacyLevel, 
  postContent = "Your post content will appear here...",
  authorName = "Your Name"
}: PrivacyPreviewProps) {
  const config = privacyConfig[privacyLevel];
  const Icon = config.icon;

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview: How others will see your post
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon className={`h-3 w-3 ${config.color}`} />
            <span className="text-xs font-medium">{config.label}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            This post will be visible to: <strong>{config.audience}</strong>
          </p>
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
        </div>
      </CardContent>
    </Card>
  );
}
