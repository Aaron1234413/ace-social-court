
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Calendar, MapPin, Trophy, TrendingUp, Zap, Battery, Heart, Brain, Target } from 'lucide-react';
import { MatchData } from '../MatchLogger';

interface MatchSummaryStepProps {
  data: MatchData;
  onEdit: (stepIndex: number) => void;
}

const SURFACE_LABELS = {
  hard: '🏟️ Hard Court',
  clay: '🟤 Clay Court', 
  grass: '🌱 Grass Court',
  other: '🏓 Other'
};

const RATING_LABELS = {
  1: { label: 'Poor', color: 'text-red-600' },
  2: { label: 'Below Average', color: 'text-orange-600' },
  3: { label: 'Average', color: 'text-yellow-600' },
  4: { label: 'Good', color: 'text-green-600' },
  5: { label: 'Excellent', color: 'text-emerald-600' }
};

const HIGHLIGHT_LABELS = {
  ace: '🎯 Ace',
  winner: '⚡ Winner',
  breakpoint: '🔥 Break Point',
  error: '❌ Error'
};

export default function MatchSummaryStep({ data, onEdit }: MatchSummaryStepProps) {
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold mb-2">Match Summary</h3>
        <p className="text-muted-foreground">
          Review your match details before saving
        </p>
      </div>

      {/* Match Basics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Match Details
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => onEdit(0)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Date</span>
              <p className="font-medium">{format(data.match_date, 'PPP')}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Opponent</span>
              <p className="font-medium">{data.opponent_name || 'Not specified'}</p>
            </div>
            {data.location && (
              <div>
                <span className="text-sm text-muted-foreground">Location</span>
                <p className="font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {data.location}
                </p>
              </div>
            )}
            {data.surface && (
              <div>
                <span className="text-sm text-muted-foreground">Surface</span>
                <p className="font-medium">{SURFACE_LABELS[data.surface]}</p>
              </div>
            )}
            {data.score && (
              <div>
                <span className="text-sm text-muted-foreground">Score</span>
                <p className="font-medium flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  {data.score}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Ratings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Ratings
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => onEdit(1)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'serve_rating', label: 'Serve', icon: <Zap className="h-4 w-4" /> },
              { key: 'return_rating', label: 'Return', icon: <Target className="h-4 w-4" /> },
              { key: 'endurance_rating', label: 'Endurance', icon: <Battery className="h-4 w-4" /> }
            ].map(({ key, label, icon }) => {
              const rating = data[key as keyof MatchData] as number || 3;
              const ratingInfo = RATING_LABELS[rating as keyof typeof RATING_LABELS];
              
              return (
                <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {icon}
                    <span className="font-medium">{label}</span>
                  </div>
                  <div className="text-2xl font-bold mb-1">{rating}</div>
                  <div className={`text-sm ${ratingInfo.color}`}>
                    {ratingInfo.label}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Highlights */}
      {data.highlights && data.highlights.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Key Moments ({data.highlights.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={() => onEdit(2)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.highlights.map((highlight, index) => (
                <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                  <span>{HIGHLIGHT_LABELS[highlight.type]}</span>
                  {highlight.note && (
                    <span className="text-sm text-muted-foreground flex-1">
                      {highlight.note}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mental State */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Mental State
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => onEdit(3)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'energy_emoji', label: 'Energy' },
              { key: 'focus_emoji', label: 'Focus' },
              { key: 'emotion_emoji', label: 'Emotion' }
            ].map(({ key, label }) => {
              const value = data[key as keyof MatchData] as string;
              return (
                <div key={key} className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium mb-1">{label}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {value?.replace('_', ' ') || 'Not set'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reflection & Tags */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Reflection & Notes
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => onEdit(4)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.reflection_note && (
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Match Reflection</span>
              <p className="text-sm bg-gray-50 p-3 rounded">
                {data.reflection_note}
              </p>
            </div>
          )}
          
          {data.tags && data.tags.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground block mb-2">Tags</span>
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {data.notify_coach && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                ✓ Coach will be notified
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg text-center">
        <h4 className="font-semibold text-lg mb-2">Ready to Save Your Match! 🎾</h4>
        <p className="text-muted-foreground">
          Your match data is complete and ready to be saved to your tennis journal.
        </p>
      </div>
    </div>
  );
}
