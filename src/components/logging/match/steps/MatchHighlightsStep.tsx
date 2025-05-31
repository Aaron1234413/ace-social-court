import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { MatchData } from '../MatchLogger';

interface MatchHighlightsStepProps {
  data: MatchData;
  onDataChange: (updates: Partial<MatchData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

const HIGHLIGHT_TYPES = [
  { value: 'ace', label: '🎯 Ace', color: 'bg-green-100 border-green-300 text-green-800' },
  { value: 'winner', label: '⚡ Winner', color: 'bg-blue-100 border-blue-300 text-blue-800' },
  { value: 'breakpoint', label: '🔥 Break Point', color: 'bg-orange-100 border-orange-300 text-orange-800' },
  { value: 'error', label: '❌ Unforced Error', color: 'bg-red-100 border-red-300 text-red-800' }
];

export default function MatchHighlightsStep({ data, onDataChange, onValidationChange }: MatchHighlightsStepProps) {
  const highlights = data.highlights || [];

  React.useEffect(() => {
    onValidationChange(true); // This step is always valid (optional)
  }, [onValidationChange]);

  const addHighlight = (type: 'ace' | 'winner' | 'breakpoint' | 'error') => {
    const newHighlight = {
      type,
      note: '',
      timestamp: Date.now()
    };
    
    const updatedHighlights = [...highlights, newHighlight];
    onDataChange({ highlights: updatedHighlights });
  };

  const updateHighlight = (index: number, note: string) => {
    const updatedHighlights = highlights.map((highlight, i) =>
      i === index ? { ...highlight, note } : highlight
    );
    onDataChange({ highlights: updatedHighlights });
  };

  const removeHighlight = (index: number) => {
    const updatedHighlights = highlights.filter((_, i) => i !== index);
    onDataChange({ highlights: updatedHighlights });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Key Moments</h3>
        <p className="text-muted-foreground">
          Record the important moments from your match (optional)
        </p>
      </div>

      {/* Add Highlight Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Key Moments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {HIGHLIGHT_TYPES.map((type) => (
              <Button
                key={type.value}
                variant="outline"
                onClick={() => addHighlight(type.value as any)}
                className="h-auto py-3 flex flex-col gap-1 hover:scale-105 transition-transform"
              >
                <span className="text-lg">{type.label.split(' ')[0]}</span>
                <span className="text-xs">{type.label.split(' ').slice(1).join(' ')}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Existing Highlights */}
      {highlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Highlights ({highlights.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highlights.map((highlight, index) => {
                const typeConfig = HIGHLIGHT_TYPES.find(t => t.value === highlight.type);
                
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 ${typeConfig?.color}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{typeConfig?.label}</span>
                        </div>
                        <div>
                          <Label htmlFor={`highlight-note-${index}`} className="sr-only">
                            Note for {typeConfig?.label}
                          </Label>
                          <Input
                            id={`highlight-note-${index}`}
                            placeholder="Add details about this moment..."
                            value={highlight.note || ''}
                            onChange={(e) => updateHighlight(index, e.target.value)}
                            className="bg-white/50"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHighlight(index)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {highlights.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl mb-2">🎾</div>
          <p>No highlights added yet</p>
          <p className="text-sm">Use the buttons above to record key moments</p>
        </div>
      )}

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2">💡 Highlight Tips</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Record both positive and negative moments for balanced analysis</li>
          <li>• Add specific details to help you remember and learn</li>
          <li>• Consider the context - what led to this moment?</li>
        </ul>
      </div>
    </div>
  );
}
