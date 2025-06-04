
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { MatchPrivacyLevel } from '@/services/MatchContentTemplateService';
import { useToast } from '@/hooks/use-toast';

interface SharingPreferences {
  autoShare: boolean;
  defaultWinPrivacy: MatchPrivacyLevel;
  defaultLossPrivacy: MatchPrivacyLevel;
  defaultTiePrivacy: MatchPrivacyLevel;
  includePerformanceRatings: boolean;
  includeHighlights: boolean;
  includeReflections: boolean;
  showQuickShareButtons: boolean;
}

interface UserSharingPreferencesProps {
  onPreferencesChange: (preferences: SharingPreferences) => void;
  isVisible: boolean;
  onClose: () => void;
}

export function UserSharingPreferences({ 
  onPreferencesChange, 
  isVisible, 
  onClose 
}: UserSharingPreferencesProps) {
  const { toast } = useToast();
  
  const defaultPreferences: SharingPreferences = {
    autoShare: false,
    defaultWinPrivacy: 'summary',
    defaultLossPrivacy: 'basic',
    defaultTiePrivacy: 'basic',
    includePerformanceRatings: true,
    includeHighlights: true,
    includeReflections: false,
    showQuickShareButtons: true,
  };

  const [preferences, setPreferences] = useState<SharingPreferences>(defaultPreferences);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('tennis-sharing-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Error loading sharing preferences:', error);
      }
    }
  }, []);

  const handlePreferenceChange = (key: keyof SharingPreferences, value: any) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('tennis-sharing-preferences', JSON.stringify(preferences));
    onPreferencesChange(preferences);
    toast({
      title: "Preferences saved!",
      description: "Your sharing preferences have been updated.",
    });
  };

  const handleResetPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem('tennis-sharing-preferences');
    onPreferencesChange(defaultPreferences);
    toast({
      title: "Preferences reset",
      description: "Your sharing preferences have been reset to defaults.",
    });
  };

  if (!isVisible) return null;

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg text-purple-900">Sharing Preferences</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Share Settings */}
        <div className="space-y-3">
          <h4 className="font-medium text-purple-900">Quick Share Options</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-quick-share" className="text-sm">
              Show quick share buttons
            </Label>
            <Switch
              id="show-quick-share"
              checked={preferences.showQuickShareButtons}
              onCheckedChange={(checked) => handlePreferenceChange('showQuickShareButtons', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-share" className="text-sm">
              Auto-share after logging matches
            </Label>
            <Switch
              id="auto-share"
              checked={preferences.autoShare}
              onCheckedChange={(checked) => handlePreferenceChange('autoShare', checked)}
            />
          </div>
        </div>

        {/* Default Privacy Levels */}
        <div className="space-y-3">
          <h4 className="font-medium text-purple-900">Default Privacy Levels</h4>
          
          <div className="space-y-2">
            <Label className="text-sm">When you win:</Label>
            <Select
              value={preferences.defaultWinPrivacy}
              onValueChange={(value: MatchPrivacyLevel) => handlePreferenceChange('defaultWinPrivacy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Share</SelectItem>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="full">Full Story</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">When you lose:</Label>
            <Select
              value={preferences.defaultLossPrivacy}
              onValueChange={(value: MatchPrivacyLevel) => handlePreferenceChange('defaultLossPrivacy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="basic">Basic Share</SelectItem>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content Inclusion */}
        <div className="space-y-3">
          <h4 className="font-medium text-purple-900">Include in Posts</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="include-ratings" className="text-sm">
              Performance ratings
            </Label>
            <Switch
              id="include-ratings"
              checked={preferences.includePerformanceRatings}
              onCheckedChange={(checked) => handlePreferenceChange('includePerformanceRatings', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="include-highlights" className="text-sm">
              Match highlights
            </Label>
            <Switch
              id="include-highlights"
              checked={preferences.includeHighlights}
              onCheckedChange={(checked) => handlePreferenceChange('includeHighlights', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="include-reflections" className="text-sm">
              Personal reflections
            </Label>
            <Switch
              id="include-reflections"
              checked={preferences.includeReflections}
              onCheckedChange={(checked) => handlePreferenceChange('includeReflections', checked)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-purple-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetPreferences}
            className="text-gray-600"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset to Defaults
          </Button>
          
          <Button
            size="sm"
            onClick={handleSavePreferences}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="h-4 w-4 mr-1" />
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
