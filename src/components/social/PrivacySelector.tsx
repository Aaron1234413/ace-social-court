
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Users, Globe, GraduationCap } from 'lucide-react';

export type PrivacyLevel = 'private' | 'friends' | 'public' | 'coaches';

interface PrivacySelectorProps {
  value: PrivacyLevel;
  onValueChange: (value: PrivacyLevel) => void;
  followingCount?: number;
}

const privacyOptions = [
  {
    value: 'private' as const,
    label: 'Private',
    description: 'Only you can see this post',
    icon: Lock,
  },
  {
    value: 'friends' as const,
    label: 'Friends',
    description: 'People you follow can see this',
    icon: Users,
  },
  {
    value: 'public' as const,
    label: 'Public',
    description: 'Anyone can see this post',
    icon: Globe,
  },
  {
    value: 'coaches' as const,
    label: 'Coaches Only',
    description: 'Only coaches can see this',
    icon: GraduationCap,
  },
];

export function PrivacySelector({ value, onValueChange, followingCount = 0 }: PrivacySelectorProps) {
  // Smart default: if user has less than 3 follows, default to private
  const shouldDefaultToPrivate = followingCount < 3;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Privacy Level</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select privacy level" />
        </SelectTrigger>
        <SelectContent>
          {privacyOptions.map((option) => {
            const Icon = option.icon;
            const isRecommended = shouldDefaultToPrivate && option.value === 'private';
            
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1">
                      {option.label}
                      {isRecommended && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                          Recommended
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {shouldDefaultToPrivate && value !== 'private' && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
          💡 Consider keeping posts private until you follow more people for better engagement
        </div>
      )}
    </div>
  );
}
