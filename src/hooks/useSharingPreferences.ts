
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { MatchPrivacyLevel } from '@/services/MatchContentTemplateService';

export interface SharingPreferences {
  autoShare: boolean;
  defaultWinPrivacy: MatchPrivacyLevel;
  defaultLossPrivacy: MatchPrivacyLevel;
  defaultTiePrivacy: MatchPrivacyLevel;
  includePerformanceRatings: boolean;
  includeHighlights: boolean;
  includeReflections: boolean;
  showQuickShareButtons: boolean;
  preferredPostingTime?: string;
  lastSharedOutcome?: 'won' | 'lost' | 'tie';
  sharingFrequency?: number;
}

export interface SharingPattern {
  totalPosts: number;
  winShareRate: number;
  lossShareRate: number;
  preferredPrivacyLevel: MatchPrivacyLevel;
  avgTimeToShare: number; // minutes after match logging
}

export function useSharingPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<SharingPreferences | null>(null);
  const [patterns, setPatterns] = useState<SharingPattern | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Default preferences based on user behavior
  const getDefaultPreferences = (): SharingPreferences => ({
    autoShare: false,
    defaultWinPrivacy: 'summary',
    defaultLossPrivacy: 'basic',
    defaultTiePrivacy: 'basic',
    includePerformanceRatings: true,
    includeHighlights: true,
    includeReflections: false,
    showQuickShareButtons: true,
  });

  // Load preferences from localStorage and analyze patterns
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        // Load saved preferences
        const savedPrefs = localStorage.getItem(`tennis-sharing-preferences-${user.id}`);
        const userPrefs = savedPrefs ? JSON.parse(savedPrefs) : getDefaultPreferences();

        // Analyze user's sharing patterns from their posts
        const { data: userPosts } = await supabase
          .from('posts')
          .select('privacy_level, created_at, content')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (userPosts && userPosts.length > 0) {
          const patterns = analyzeUserPatterns(userPosts);
          setPatterns(patterns);

          // Update preferences based on learned patterns
          const enhancedPrefs = enhancePreferencesWithPatterns(userPrefs, patterns);
          setPreferences(enhancedPrefs);
        } else {
          setPreferences(userPrefs);
        }
      } catch (error) {
        console.error('Error loading sharing preferences:', error);
        setPreferences(getDefaultPreferences());
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const analyzeUserPatterns = (posts: any[]): SharingPattern => {
    const matchPosts = posts.filter(post => 
      post.content.toLowerCase().includes('match') || 
      post.content.toLowerCase().includes('won') ||
      post.content.toLowerCase().includes('lost')
    );

    const winPosts = matchPosts.filter(post => 
      post.content.toLowerCase().includes('won') || 
      post.content.toLowerCase().includes('victory')
    );

    const lossPosts = matchPosts.filter(post => 
      post.content.toLowerCase().includes('lost') || 
      post.content.toLowerCase().includes('learning')
    );

    // Analyze privacy levels
    const privacyLevels = posts.map(post => post.privacy_level);
    const privacyCount = privacyLevels.reduce((acc, level) => {
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedPrivacy = Object.entries(privacyCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as MatchPrivacyLevel || 'summary';

    return {
      totalPosts: posts.length,
      winShareRate: matchPosts.length > 0 ? winPosts.length / matchPosts.length : 0.7,
      lossShareRate: matchPosts.length > 0 ? lossPosts.length / matchPosts.length : 0.3,
      preferredPrivacyLevel: mostUsedPrivacy,
      avgTimeToShare: 15 // Default assumption
    };
  };

  const enhancePreferencesWithPatterns = (
    prefs: SharingPreferences, 
    patterns: SharingPattern
  ): SharingPreferences => {
    return {
      ...prefs,
      // Adjust defaults based on user's actual behavior
      defaultWinPrivacy: patterns.winShareRate > 0.8 ? 'summary' : prefs.defaultWinPrivacy,
      defaultLossPrivacy: patterns.lossShareRate < 0.2 ? 'private' : prefs.defaultLossPrivacy,
      autoShare: patterns.totalPosts > 10 && patterns.winShareRate > 0.9,
    };
  };

  const savePreferences = async (newPrefs: SharingPreferences) => {
    if (!user) return;

    try {
      localStorage.setItem(`tennis-sharing-preferences-${user.id}`, JSON.stringify(newPrefs));
      setPreferences(newPrefs);

      // Log the preference change for future learning
      await supabase.from('user_activity_logs').insert({
        user_id: user.id,
        action_type: 'sharing_preferences_updated',
        action_details: { preferences: newPrefs }
      });
    } catch (error) {
      console.error('Error saving sharing preferences:', error);
    }
  };

  const recordSharingAction = async (action: {
    outcome: 'won' | 'lost' | 'tie';
    privacyLevel: MatchPrivacyLevel;
    timeToShare: number;
    wasAutoShared: boolean;
  }) => {
    if (!user) return;

    try {
      await supabase.from('user_activity_logs').insert({
        user_id: user.id,
        action_type: 'match_shared',
        action_details: action
      });

      // Update preferences based on this action
      if (preferences) {
        const updatedPrefs = { ...preferences };
        updatedPrefs.lastSharedOutcome = action.outcome;
        updatedPrefs.sharingFrequency = (updatedPrefs.sharingFrequency || 0) + 1;
        setPreferences(updatedPrefs);
      }
    } catch (error) {
      console.error('Error recording sharing action:', error);
    }
  };

  const getSmartDefaults = (matchOutcome?: 'won' | 'lost' | 'tie') => {
    if (!preferences || !patterns) {
      return getDefaultPreferences();
    }

    // Use learned patterns to suggest smart defaults
    const smartDefaults = { ...preferences };

    if (matchOutcome === 'won' && patterns.winShareRate > 0.8) {
      smartDefaults.autoShare = true;
      smartDefaults.defaultWinPrivacy = 'summary';
    } else if (matchOutcome === 'lost' && patterns.lossShareRate < 0.3) {
      smartDefaults.autoShare = false;
      smartDefaults.defaultLossPrivacy = 'private';
    }

    return smartDefaults;
  };

  return {
    preferences,
    patterns,
    isLoading,
    savePreferences,
    recordSharingAction,
    getSmartDefaults,
  };
}
