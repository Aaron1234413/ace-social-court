
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit3, RefreshCw, Save, X, Sparkles } from 'lucide-react';
import { EnhancedPostSuggestion } from '@/services/EnhancedAutoPostService';

interface ContentCustomizationPanelProps {
  suggestion: EnhancedPostSuggestion;
  onContentUpdate: (updatedContent: string) => void;
  onCancel: () => void;
  onSave: () => void;
  isVisible: boolean;
}

export function ContentCustomizationPanel({
  suggestion,
  onContentUpdate,
  onCancel,
  onSave,
  isVisible
}: ContentCustomizationPanelProps) {
  const [editedContent, setEditedContent] = useState(suggestion.content);
  const [isEditing, setIsEditing] = useState(false);

  if (!isVisible) return null;

  const handleStartEditing = () => {
    setIsEditing(true);
    setEditedContent(suggestion.content);
  };

  const handleSaveChanges = () => {
    onContentUpdate(editedContent);
    setIsEditing(false);
    onSave();
  };

  const handleCancelEdit = () => {
    setEditedContent(suggestion.content);
    setIsEditing(false);
  };

  const handleRegenerate = () => {
    // Reset to original suggestion content
    setEditedContent(suggestion.content);
    onContentUpdate(suggestion.content);
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-900">Customize Content</CardTitle>
            <Badge variant="outline" className="bg-blue-100 text-blue-700">
              {suggestion.template.title}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[120px] border-2 border-blue-200 focus:border-blue-500"
              placeholder="Edit your post content..."
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reset to AI
                </Button>
                <span className="text-xs text-gray-500">
                  {editedContent.length} characters
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <p className="text-gray-800 whitespace-pre-wrap">{editedContent}</p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {suggestion.privacyLevel}
                </Badge>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  {Math.round(suggestion.confidence * 100)}% confidence
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartEditing}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit Content
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Use This Content
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">AI Insight:</p>
              <p className="text-xs text-blue-700">{suggestion.reasoning}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
