
import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Users, User, Trophy, Medal, Handshake } from 'lucide-react';
import { MatchData } from '../MatchLogger';

interface MatchOverviewStepProps {
  data: MatchData;
  onDataChange: (updates: Partial<MatchData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

export default function MatchOverviewStep({ data, onDataChange, onValidationChange }: MatchOverviewStepProps) {
  
  // Validation effect
  useEffect(() => {
    const isValid = Boolean(data.match_type && data.match_outcome && data.surface);
    onValidationChange(isValid);
  }, [data.match_type, data.match_outcome, data.surface, onValidationChange]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Match Overview</h3>
        <p className="text-muted-foreground">
          Let's start with the basics of your match
        </p>
      </div>

      {/* Match Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5" />
            Match Type *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleGroup
            type="single"
            value={data.match_type || ''}
            onValueChange={(value) => value && onDataChange({ match_type: value as 'singles' | 'doubles' })}
            className="justify-start"
          >
            <ToggleGroupItem value="singles" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Singles
            </ToggleGroupItem>
            <ToggleGroupItem value="doubles" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Doubles
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Doubles Additional Fields */}
          {data.match_type === 'doubles' && (
            <div className="space-y-3 pt-4 border-t">
              <div>
                <Label htmlFor="partner">Your Partner (optional)</Label>
                <Input
                  id="partner"
                  placeholder="Partner's name..."
                  value={data.partner_name || ''}
                  onChange={(e) => onDataChange({ partner_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="opponents">Opponents (optional)</Label>
                <Input
                  id="opponents"
                  placeholder="e.g., John & Jane Smith"
                  value={data.opponents_names || ''}
                  onChange={(e) => onDataChange({ opponents_names: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match Outcome */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Match Outcome *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Who won?</Label>
            <ToggleGroup
              type="single"
              value={data.match_outcome || ''}
              onValueChange={(value) => value && onDataChange({ match_outcome: value as 'won' | 'lost' | 'tie' })}
              className="justify-start mt-2"
            >
              <ToggleGroupItem value="won" className="flex items-center gap-2 text-green-700">
                <Trophy className="h-4 w-4" />
                Me
              </ToggleGroupItem>
              <ToggleGroupItem value="lost" className="flex items-center gap-2 text-red-700">
                <Medal className="h-4 w-4" />
                Opponent
              </ToggleGroupItem>
              <ToggleGroupItem value="tie" className="flex items-center gap-2 text-blue-700">
                <Handshake className="h-4 w-4" />
                Tie
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div>
            <Label htmlFor="final-score">Final Score (optional)</Label>
            <Input
              id="final-score"
              placeholder="e.g., 6-4, 3-6, 6-2 or 2-1 sets"
              value={data.score || ''}
              onChange={(e) => onDataChange({ score: e.target.value })}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Surface Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Court Surface *</CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            value={data.surface || ''}
            onValueChange={(value) => value && onDataChange({ surface: value as 'hard' | 'clay' | 'grass' | 'other' })}
            className="justify-start flex-wrap"
          >
            <ToggleGroupItem value="hard" className="flex items-center gap-2">
              🏟️ Hard
            </ToggleGroupItem>
            <ToggleGroupItem value="clay" className="flex items-center gap-2">
              🟤 Clay
            </ToggleGroupItem>
            <ToggleGroupItem value="grass" className="flex items-center gap-2">
              🌱 Grass
            </ToggleGroupItem>
            <ToggleGroupItem value="other" className="flex items-center gap-2">
              🏓 Other
            </ToggleGroupItem>
          </ToggleGroup>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Quick Start Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Don't worry about getting everything perfect - you can always edit later</li>
          <li>• The more details you add, the better insights you'll get</li>
          <li>• This information helps track your progress over time</li>
        </ul>
      </div>
    </div>
  );
}
