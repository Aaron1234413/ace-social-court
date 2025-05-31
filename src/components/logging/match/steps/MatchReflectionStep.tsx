
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { X, Plus } from 'lucide-react';
import { MatchData } from '../MatchLogger';

interface MatchReflectionStepProps {
  data: MatchData;
  onDataChange: (updates: Partial<MatchData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

const SUGGESTED_TAGS = [
  'clutch moments', 'mental toughness', 'serve improvement', 'return game',
  'net play', 'consistency', 'power shots', 'defensive play', 'strategy',
  'fitness', 'footwork', 'court positioning', 'pressure points'
];

export default function MatchReflectionStep({ data, onDataChange, onValidationChange }: MatchReflectionStepProps) {
  const [showCoachSearch, setShowCoachSearch] = React.useState(false);
  const [newTag, setNewTag] = React.useState('');

  React.useEffect(() => {
    onValidationChange(true); // This step is always valid (optional)
  }, [onValidationChange]);

  const addTag = (tag: string) => {
    const currentTags = data.tags || [];
    if (!currentTags.includes(tag)) {
      onDataChange({ tags: [...currentTags, tag] });
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = data.tags || [];
    onDataChange({ tags: currentTags.filter(tag => tag !== tagToRemove) });
  };

  const handleCoachSelect = (coach: { id: string; name: string }) => {
    onDataChange({ coach_id: coach.id });
    setShowCoachSearch(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      addTag(newTag.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Reflect on Your Match</h3>
        <p className="text-muted-foreground">
          Add notes, tags, and optional coach sharing (all optional)
        </p>
      </div>

      {/* Match Reflection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Match Notes & Reflection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="reflection">What went well? What could be improved?</Label>
            <Textarea
              id="reflection"
              placeholder="Reflect on your performance, strategy, key moments, areas for improvement, what you learned..."
              value={data.reflection_note || ''}
              onChange={(e) => onDataChange({ reflection_note: e.target.value })}
              className="min-h-[120px] mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Match Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Tags */}
          {data.tags && data.tags.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Your Tags:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {data.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTag(tag)}
                      className="h-auto p-0 w-4 h-4 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add New Tag */}
          <div>
            <Label htmlFor="new-tag">Add Custom Tag</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="new-tag"
                placeholder="Enter a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                type="button"
                onClick={() => newTag.trim() && addTag(newTag.trim())}
                disabled={!newTag.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Suggested Tags */}
          <div>
            <Label className="text-sm font-medium">Suggested Tags:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTED_TAGS.filter(tag => !data.tags?.includes(tag)).map((tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(tag)}
                  className="h-auto py-1 px-2 text-xs"
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coach Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Share with Coach</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notify my coach about this match</Label>
              <p className="text-sm text-muted-foreground">
                Your coach will receive a notification and can add notes
              </p>
            </div>
            <Switch
              checked={data.notify_coach || false}
              onCheckedChange={(checked) => onDataChange({ notify_coach: checked })}
            />
          </div>

          {data.notify_coach && (
            <div>
              <Label>Select Coach</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder={data.coach_id ? "Coach selected" : "Search for your coach..."}
                  readOnly
                  value={data.coach_id ? "Coach selected" : ""}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCoachSearch(true)}
                >
                  {data.coach_id ? "Change" : "Select"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simple Coach Search Modal */}
      {showCoachSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Search Coach</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This feature will be enhanced to search registered coaches. For now, please continue without selecting a coach.
            </p>
            <Button
              onClick={() => setShowCoachSearch(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      <div className="bg-purple-50 p-4 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-2">💭 Reflection Tips</h4>
        <ul className="text-sm text-purple-800 space-y-1">
          <li>• Be specific about what worked and what didn't</li>
          <li>• Consider both technical and mental aspects</li>
          <li>• Think about what you'll practice next</li>
          <li>• Note patterns that emerge across matches</li>
        </ul>
      </div>
    </div>
  );
}
