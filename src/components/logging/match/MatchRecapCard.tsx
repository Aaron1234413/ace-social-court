
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MessageSquare } from 'lucide-react';
import { MatchData } from './MatchLogger';

interface MatchRecapCardProps {
  matchData: MatchData;
  isVisible: boolean;
  onClose?: () => void;
}

export default function MatchRecapCard({ matchData, isVisible, onClose }: MatchRecapCardProps) {
  if (!isVisible) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-2 border-green-200 bg-gradient-to-br from-white to-green-50 animate-scale-in">
        <CardContent className="p-6 text-center space-y-4">
          {/* Success Icon and Title */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <CheckCircle className="h-16 w-16 text-green-500 animate-pulse" />
              <div className="absolute -top-1 -right-1 text-2xl">🎾</div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-800 mb-1">
                Match Logged!
              </h2>
              <p className="text-green-700 font-medium">
                Great work out there! 💪
              </p>
            </div>
          </div>

          {/* Match Summary */}
          <div className="bg-white/80 p-4 rounded-lg border border-green-100 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{formatDate(matchData.match_date)}</span>
            </div>
            
            {matchData.score && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Score:</span>
                <Badge variant="outline" className="font-mono">
                  {matchData.score}
                </Badge>
              </div>
            )}

            {matchData.location && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium truncate max-w-32">
                  {matchData.location}
                </span>
              </div>
            )}

            {matchData.surface && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Surface:</span>
                <Badge variant="secondary" className="capitalize">
                  {matchData.surface}
                </Badge>
              </div>
            )}
          </div>

          {/* Mental State Summary */}
          {(matchData.energy_emoji || matchData.focus_emoji || matchData.emotion_emoji) && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="text-sm font-medium text-blue-800 mb-2">Mental State:</div>
              <div className="flex justify-center gap-4 text-xs">
                {matchData.energy_emoji && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">💪</span>
                    <span className="text-blue-700 capitalize">{matchData.energy_emoji}</span>
                  </div>
                )}
                {matchData.focus_emoji && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">🎯</span>
                    <span className="text-blue-700 capitalize">{matchData.focus_emoji}</span>
                  </div>
                )}
                {matchData.emotion_emoji && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">😌</span>
                    <span className="text-blue-700 capitalize">{matchData.emotion_emoji}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coach Notification */}
          {matchData.notify_coach && (matchData.coach_id || matchData.assigned_coach_id) && (
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-orange-800">Coach Notified</div>
                <div className="text-orange-700">
                  Your coach will see this in their dashboard
                </div>
              </div>
            </div>
          )}

          {/* Auto-close message */}
          <div className="text-xs text-gray-500 pt-2">
            Redirecting to dashboard...
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
