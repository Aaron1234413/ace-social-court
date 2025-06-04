
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Users, Globe, GraduationCap, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  // Enforce minimum follow requirement for public posting
  const MINIMUM_FOLLOWS_FOR_PUBLIC = 3;
  const canPostPublic = followingCount >= MINIMUM_FOLLOWS_FOR_PUBLIC;
  
  // Auto-adjust privacy level if user doesn't meet requirements
  React.useEffect(() => {
    if ((value === 'public' || value === 'friends') && !canPostPublic) {
      onValueChange('private');
    }
  }, [value, canPostPublic, onValueChange]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Privacy Level</label>
      
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
            
            return (
              <SelectItem 
                key={option.value} 
                value={option.value}
                disabled={isDisabled}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${isDisabled ? 'text-muted-foreground' : ''}`} />
                  <div className="flex flex-col">
                    <span className={`flex items-center gap-1 ${isDisabled ? 'text-muted-foreground' : ''}`}>
                      {option.label}
                      {isRecommended && (
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
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {canPostPublic && value === 'private' && (
        <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
          🎉 You can now post publicly! Consider sharing with friends or the entire community.
        </div>
      )}
    </div>
  );
}
