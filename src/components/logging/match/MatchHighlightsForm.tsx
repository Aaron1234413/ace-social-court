
import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl,
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MatchFormValues, HighlightType } from './matchSchema';
import { Badge } from '@/components/ui/badge';
import { X, Star, Award, Flag, ThumbsUp } from 'lucide-react';

interface MatchHighlightsFormProps {
  form: UseFormReturn<MatchFormValues>;
}

const MatchHighlightsForm = ({ form }: MatchHighlightsFormProps) => {
  const [highlightNote, setHighlightNote] = useState('');
  const highlights = form.watch('highlights');

  const handleAddHighlight = (type: 'ace' | 'winner' | 'breakpoint' | 'error') => {
    const newHighlight: HighlightType = {
      type,
      note: highlightNote,
      timestamp: Date.now()
    };
    
    const updatedHighlights = [...(highlights || []), newHighlight];
    form.setValue('highlights', updatedHighlights);
    setHighlightNote('');
  };

  const handleRemoveHighlight = (index: number) => {
    const updatedHighlights = [...(highlights || [])];
    updatedHighlights.splice(index, 1);
    form.setValue('highlights', updatedHighlights);
  };

  const highlightTypeToIcon = {
    ace: <Star className="h-4 w-4" />,
    winner: <ThumbsUp className="h-4 w-4" />,
    breakpoint: <Flag className="h-4 w-4" />,
    error: <X className="h-4 w-4" />
  };

  const highlightTypeToColor = {
    ace: "bg-green-100 text-green-800 hover:bg-green-200",
    winner: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    breakpoint: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    error: "bg-red-100 text-red-800 hover:bg-red-200"
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Match Highlights</CardTitle>
        <CardDescription>Record key moments from your match</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Highlight Input */}
          <div className="space-y-4">
            <FormLabel>Add Highlight</FormLabel>
            <Input
              placeholder="Note about this highlight (optional)"
              value={highlightNote}
              onChange={(e) => setHighlightNote(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex items-center gap-1 bg-green-50 hover:bg-green-100"
                onClick={() => handleAddHighlight('ace')}
              >
                <Star className="h-4 w-4" />
                Ace
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100"
                onClick={() => handleAddHighlight('winner')}
              >
                <ThumbsUp className="h-4 w-4" />
                Winner
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100"
                onClick={() => handleAddHighlight('breakpoint')}
              >
                <Flag className="h-4 w-4" />
                Break Point
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex items-center gap-1 bg-red-50 hover:bg-red-100"
                onClick={() => handleAddHighlight('error')}
              >
                <X className="h-4 w-4" />
                Error
              </Button>
            </div>
          </div>

          {/* Highlights Display */}
          <div>
            <FormLabel>Recorded Highlights</FormLabel>
            <div className="mt-2 min-h-[100px] border rounded-md p-4">
              {highlights && highlights.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {highlights.map((highlight, index) => (
                    <div 
                      key={index}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${highlightTypeToColor[highlight.type]}`}
                    >
                      {highlightTypeToIcon[highlight.type]}
                      {highlight.type}
                      {highlight.note && `: ${highlight.note}`}
                      <button 
                        onClick={() => handleRemoveHighlight(index)}
                        className="ml-1 hover:bg-opacity-20 hover:bg-black rounded-full"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No highlights added yet
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
};

export default MatchHighlightsForm;
