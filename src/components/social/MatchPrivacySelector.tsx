
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Users, Globe, Star, Trophy, Target, Heart, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type MatchPrivacyLevel = 'private' | 'basic' | 'summary' | 'detailed' | 'full';

interface MatchPrivacySelectorProps {
  value: MatchPrivacyLevel;
  onValueChange: (value: MatchPrivacyLevel) => void;
  matchOutcome?: 'won' | 'lost' | 'tie';
  followingCount?: number;
}

const matchPrivacyOptions = [
  {
    value: 'private' as const,
    label: 'Private',
    description: 'Keep it to yourself',
    example: 'Personal reflection only',
    icon: Lock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  {
    value: 'basic' as const,
    label: 'Basic Share',
    description: 'Just the vibe, no details',
    example: '"Had a great match today! 🎾"',
    icon: Heart,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    value: 'summary' as const,
    label: 'Match Summary',
    description: 'Outcome, score & opponent',
    example: '"Won 6-4, 6-2 against Sarah! 🏆"',
    icon: Trophy,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    value: 'detailed' as const,
    label: 'Detailed Share',
    description: 'Include performance & highlights',
    example: '"Great match! Serve was on point (4/5) and had some amazing winners"',
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    value: 'full' as const,
    label: 'Full Story',
    description: 'Everything including reflections',
    example: 'Complete match breakdown with insights and learnings',
    icon: Brain,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
];

export function MatchPrivacySelector({ 
  value, 
  onValueChange, 
  matchOutcome,
  followingCount = 0 
}: MatchPrivacySelectorProps) {
  
  // Smart defaults based on match outcome
  const getRecommendedLevel = () => {
    if (matchOutcome === 'won') return 'summary'; // People like celebrating wins
    if (matchOutcome === 'lost') return 'basic'; // More private for losses
    return 'basic'; // Default for ties or unknown
  };

  const recommendedLevel = getRecommendedLevel();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">How much do you want to share?</label>
        {matchOutcome && (
          <Badge variant="outline" className="text-xs">
            {matchOutcome === 'won' ? '🏆 Victory' : matchOutcome === 'lost' ? '💪 Learning' : '🤝 Tie'}
          </Badge>
        )}
      </div>
      
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full border-2 border-gray-200 focus:border-blue-500 h-12">
          <SelectValue placeholder="Choose sharing level" />
        </SelectTrigger>
        <SelectContent>
          {matchPrivacyOptions.map((option) => {
            const Icon = option.icon;
            const isRecommended = option.value === recommendedLevel;
            
            return (
              <SelectItem 
                key={option.value}
                value={option.value}
                className={`${option.bgColor} border-l-4 border-l-transparent hover:border-l-blue-400 mb-1`}
              >
                <div className="flex items-start space-x-3 w-full py-2">
                  <div className={`p-2 rounded-full ${option.bgColor}`}>
                    <Icon className={`h-4 w-4 ${option.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${option.color}`}>
                        {option.label}
                      </span>
                      {isRecommended && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {option.description}
                    </p>
                    <p className="text-xs text-gray-500 italic mt-1">
                      {option.example}
                    </p>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {/* Educational tip based on selection */}
      {value === 'private' && (
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          💭 Perfect for personal reflection and analysis
        </div>
      )}
      
      {value === 'basic' && (
        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
          😊 Share the joy without the details - great for staying connected
        </div>
      )}
      
      {value === 'summary' && matchOutcome === 'won' && (
        <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
          🏆 Celebrate your victory! Perfect for sharing wins with the community
        </div>
      )}
      
      {value === 'detailed' && (
        <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
          📊 Great for getting feedback and connecting with serious players
        </div>
      )}
      
      {value === 'full' && (
        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
          🧠 Full transparency - perfect for learning and helping others grow
        </div>
      )}
    </div>
  );
}
