
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Target, 
  Star, 
  MessageSquare,
  User,
  Users,
  Medal,
  Handshake,
  Edit3
} from 'lucide-react';
import { MatchData } from '../MatchLogger';

interface MatchSummaryStepProps {
  data: MatchData;
  onEdit: (stepIndex: number) => void;
}

const EMOJI_LABELS = {
  energy_emoji: {
    'low': { emoji: '😫', label: 'Low Energy' },
    'moderate': { emoji: '😐', label: 'Moderate' },
    'high': { emoji: '💪', label: 'High Energy' }
  },
  focus_emoji: {
    'distracted': { emoji: '😰', label: 'Distracted' },
    'normal': { emoji: '😊', label: 'Normal Focus' },
    'locked_in': { emoji: '🔥', label: 'Locked In' }
  },
  emotion_emoji: {
    'determined': { emoji: '🎯', label: 'Determined' },
    'frustrated': { emoji: '😤', label: 'Frustrated' },
    'disappointed': { emoji: '😞', label: 'Disappointed' },
    'confident': { emoji: '😎', label: 'Confident' }
  }
};

const OUTCOME_LABELS = {
  'won': { icon: Trophy, label: 'Victory', color: 'text-green-600 bg-green-50' },
  'lost': { icon: Medal, label: 'Loss', color: 'text-red-600 bg-red-50' },
  'tie': { icon: Handshake, label: 'Tie', color: 'text-blue-600 bg-blue-50' }
};

export default function MatchSummaryStep({ data, onEdit }: MatchSummaryStepProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const outcomeInfo = data.match_outcome ? OUTCOME_LABELS[data.match_outcome] : null;
  const OutcomeIcon = outcomeInfo?.icon;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Match Summary</h3>
        <p className="text-muted-foreground">
          Review your match details before saving
        </p>
      </div>

      {/* Match Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {data.match_type === 'singles' ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            Match Overview
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(0)}>
            <Edit3 className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">Type:</span>
            <Badge variant="outline">
              {data.match_type === 'singles' ? 'Singles' : 'Doubles'}
            </Badge>
          </div>
          
          {data.match_outcome && outcomeInfo && OutcomeIcon && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Outcome:</span>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${outcomeInfo.color}`}>
                <OutcomeIcon className="h-3 w-3" />
                <span className="text-sm font-medium">{outcomeInfo.label}</span>
              </div>
            </div>
          )}

          {data.score && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Score:</span>
              <span className="text-sm">{data.score}</span>
            </div>
          )}

          {data.surface && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Surface:</span>
              <Badge variant="secondary">{data.surface}</Badge>
            </div>
          )}

          {data.match_type === 'doubles' && (
            <>
              {data.partner_name && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Partner:</span>
                  <span className="text-sm">{data.partner_name}</span>
                </div>
              )}
              {data.opponents_names && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Opponents:</span>
                  <span className="text-sm">{data.opponents_names}</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Match Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Match Details
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
            <Edit3 className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formatDate(data.match_date)}</span>
          </div>
          
          {data.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{data.location}</span>
            </div>
          )}

          {data.opponent_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">vs {data.opponent_name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Ratings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Performance
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
            <Edit3 className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Emoji States */}
          {(data.energy_emoji || data.focus_emoji || data.emotion_emoji) && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Mental State</h4>
              <div className="flex flex-wrap gap-3">
                {data.energy_emoji && EMOJI_LABELS.energy_emoji[data.energy_emoji] && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                    <span className="text-lg">{EMOJI_LABELS.energy_emoji[data.energy_emoji].emoji}</span>
                    <span className="text-xs font-medium">{EMOJI_LABELS.energy_emoji[data.energy_emoji].label}</span>
                  </div>
                )}
                {data.focus_emoji && EMOJI_LABELS.focus_emoji[data.focus_emoji] && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                    <span className="text-lg">{EMOJI_LABELS.focus_emoji[data.focus_emoji].emoji}</span>
                    <span className="text-xs font-medium">{EMOJI_LABELS.focus_emoji[data.focus_emoji].label}</span>
                  </div>
                )}
                {data.emotion_emoji && EMOJI_LABELS.emotion_emoji[data.emotion_emoji] && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                    <span className="text-lg">{EMOJI_LABELS.emotion_emoji[data.emotion_emoji].emoji}</span>
                    <span className="text-xs font-medium">{EMOJI_LABELS.emotion_emoji[data.emotion_emoji].label}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Ratings */}
          {(data.serve_rating || data.return_rating || data.endurance_rating) && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Skill Ratings</h4>
              <div className="grid grid-cols-3 gap-4">
                {data.serve_rating && (
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Serve</div>
                    <div className="text-lg font-bold text-primary">{data.serve_rating}/5</div>
                  </div>
                )}
                {data.return_rating && (
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Return</div>
                    <div className="text-lg font-bold text-primary">{data.return_rating}/5</div>
                  </div>
                )}
                {data.endurance_rating && (
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Endurance</div>
                    <div className="text-lg font-bold text-primary">{data.endurance_rating}/5</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {data.tags && data.tags.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Match Tags</h4>
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Coach Notification */}
          {data.notify_coach && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Star className="h-4 w-4" />
              <span>Coach will be notified</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Highlights & Reflection */}
      {(data.highlights && data.highlights.length > 0) || data.reflection_note ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notes & Highlights
            </CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(3)}>
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEdit(5)}>
                <Edit3 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.highlights && data.highlights.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Key Moments</h4>
                <div className="space-y-2">
                  {data.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {highlight.type}
                      </Badge>
                      {highlight.note && <span>{highlight.note}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data.reflection_note && (
              <div>
                <h4 className="font-medium text-sm mb-2">Reflection</h4>
                <p className="text-sm text-muted-foreground">{data.reflection_note}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">🎾 Ready to Save!</h4>
        <p className="text-sm text-green-800">
          Your match will be saved to your dashboard and contribute to your tennis progress tracking.
        </p>
      </div>
    </div>
  );
}
