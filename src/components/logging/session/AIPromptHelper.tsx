
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Loader2, X } from 'lucide-react';
import { useAIPrompts } from '@/hooks/use-ai-prompts';

interface AIPromptHelperProps {
  pillar: string;
  context?: string;
  onSuggestionSelect: (suggestion: string) => void;
  className?: string;
}

export default function AIPromptHelper({ 
  pillar, 
  context, 
  onSuggestionSelect, 
  className = "" 
}: AIPromptHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { generatePrompts, isLoading, error } = useAIPrompts();

  const handleOpenPrompts = async () => {
    if (!isOpen) {
      setIsOpen(true);
      const prompts = await generatePrompts(pillar, context);
      setSuggestions(prompts);
    } else {
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionSelect(suggestion);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Button
        variant="outline"
        className="w-full justify-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
        onClick={handleOpenPrompts}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating ideas...</span>
          </>
        ) : (
          <>
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span>Want help logging this?</span>
            {isOpen && <X className="h-4 w-4 ml-2" />}
          </>
        )}
      </Button>

      {isOpen && !isLoading && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardContent className="pt-4">
            {error ? (
              <p className="text-sm text-red-600 text-center">{error}</p>
            ) : suggestions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium text-center mb-3">
                  AI-powered suggestions for your {pillar} log:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs bg-white hover:bg-blue-100 border border-blue-200 transition-all duration-200 hover:scale-105"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 text-center">No suggestions available</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
