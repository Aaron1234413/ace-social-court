
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Users, Globe, GraduationCap, AlertCircle, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type PrivacyLevel = 'private' | 'friends' | 'public' | 'coaches';

interface PrivacySelectorProps {
  value: PrivacyLevel;
  onValueChange: (value: PrivacyLevel) => void;
  followingCount?: number;
  showPreview?: boolean;
}

const privacyOptions = [
  {
    value: 'private' as const,
    label: 'Private',
    description: 'Only you can see this post',
    tooltip: 'Your post will be visible only to you. Perfect for personal notes and private reflections.',
    icon: Lock,
    color: 'text-gray-600',
    audience: 'Just you',
  },
  {
    value: 'friends' as const,
    label: 'Friends',
    description: 'People you follow can see this',
    tooltip: 'Your post will be visible to people you follow. Great for sharing with your tennis community.',
    icon: Users,
    color: 'text-blue-600',
    audience: 'People you follow',
  },
  {
    value: 'public' as const,
    label: 'Public',
    description: 'Anyone can see this post',
    tooltip: 'Your post will be visible to everyone on the platform. Perfect for tips, achievements, and connecting with new players.',
    icon: Globe,
    color: 'text-green-600',
    audience: 'Everyone on the platform',
  },
  {
    value: 'coaches' as const,
    label: 'Coaches Only',
    description: 'Only coaches can see this',
    tooltip: 'Your post will be visible only to verified coaches. Ideal for seeking professional advice and feedback.',
    icon: GraduationCap,
    color: 'text-purple-600',
    audience: 'Verified coaches only',
  },
];

export function EnhancedPrivacySelector({ 
  value, 
  onValueChange, 
  followingCount = 0,
  showPreview = false 
}: PrivacySelectorProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Smart defaults logic
  const MINIMUM_FOLLOWS_FOR_PUBLIC = 3;
  const canPostPublic = followingCount >= MINIMUM_FOLLOWS_FOR_PUBLIC;
  
  // Auto-adjust privacy level if user doesn't meet requirements
  React.useEffect(() => {
    if ((value === 'public' || value === 'friends') && !canPostPublic) {
      onValueChange('private');
    }
  }, [value, canPostPublic, onValueChange]);

  const currentOption = privacyOptions.find(option => option.value === value);

  const getSmartDefault = () => {
    if (followingCount === 0) return 'private';
    if (followingCount < 3) return 'private';
    if (followingCount < 10) return 'friends';
    return 'public';
  };

  const handleSmartDefault = () => {
    const smartDefault = getSmartDefault();
    onValueChange(smartDefault as PrivacyLevel);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Who can see this post?</label>
        <div className="flex items-center gap-2">
          {showPreview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSmartDefault}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Smart Default
          </Button>
        </div>
      </div>
      
      {!canPostPublic && (
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
            const isDisabled = !canPostPublic && (option.value === 'public' || option.value === 'friends');
            const isRecommended = !canPostPublic && option.value === 'private';
            const isSmartDefault = option.value === getSmartDefault();
            
            return (
              <SelectItem 
                key={option.value} 
                value={option.value}
                disabled={isDisabled}
                className="cursor-pointer"
              >
                <div className="flex items-center space-x-3 py-1">
                  <Icon className={`h-4 w-4 ${isDisabled ? 'text-muted-foreground' : option.color}`} />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isDisabled ? 'text-muted-foreground' : ''}`}>
                        {option.label}
                      </span>
                      {isRecommended && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          Recommended
                        </Badge>
                      )}
                      {isSmartDefault && !isRecommended && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          Smart Default
                        </Badge>
                      )}
                      {isDisabled && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-500">
                          Locked
                        </Badge>
                      )}
                    </div>
                    <span className={`text-xs ${isDisabled ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                      {option.description}
                      {isDisabled && ` (Need ${MINIMUM_FOLLOWS_FOR_PUBLIC - followingCount} more follows)`}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {option.tooltip}
                    </span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {/* Current Selection Display */}
      {currentOption && (
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <currentOption.icon className={`h-4 w-4 ${currentOption.color}`} />
            <span className="font-medium text-sm">{currentOption.label}</span>
          </div>
          <p className="text-xs text-muted-foreground">{currentOption.tooltip}</p>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>Audience:</strong> {currentOption.audience}
          </p>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && showPreview && currentOption && (
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
                <currentOption.icon className={`h-3 w-3 ${currentOption.color}`} />
                <span className="text-xs font-medium">{currentOption.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This post will be visible to: <strong>{currentOption.audience}</strong>
              </p>
              <div className="bg-white rounded border p-2 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  <span className="font-medium">Your Name</span>
                  <currentOption.icon className={`h-3 w-3 ${currentOption.color}`} />
                </div>
                <p className="text-gray-600">Your post content will appear here...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {canPostPublic && value === 'private' && (
        <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
          🎉 You can now post publicly! Consider sharing with friends or the entire community.
        </div>
      )}
    </div>
  );
}
