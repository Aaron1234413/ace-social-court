import { MatchData } from '@/components/logging/match/MatchLogger';
import { MatchContentTemplateService, MatchPrivacyLevel } from './MatchContentTemplateService';
import { Post, PostTemplate } from '@/types/post';

export interface EnhancedPostSuggestion {
  id: string;
  content: string;
  privacyLevel: 'public' | 'friends' | 'coaches' | 'public_highlights' | 'private';
  matchPrivacyLevel: MatchPrivacyLevel;
  template: {
    id: string;
    category: string;
    title: string;
  };
  confidence: number;
  context: 'match' | 'session' | 'general';
  reasoning: string;
}

export class EnhancedAutoPostService {
  static generateMatchSuggestions(matchData: MatchData): EnhancedPostSuggestion[] {
    const suggestions: EnhancedPostSuggestion[] = [];
    const outcome = matchData.match_outcome;
    
    // Get smart defaults
    const smartDefaults = MatchContentTemplateService.getSmartDefaults(matchData);
    
    // Generate suggestions for different privacy levels
    const privacyLevels: MatchPrivacyLevel[] = ['basic', 'summary', 'detailed', 'full'];
    
    privacyLevels.forEach((privacyLevel, index) => {
      const template = MatchContentTemplateService.generateContent(matchData, privacyLevel);
      const confidence = this.calculateConfidence(matchData, privacyLevel, outcome);
      
      suggestions.push({
        id: `match-${privacyLevel}-${Date.now()}-${index}`,
        content: template.content,
        privacyLevel: template.privacyLevel,
        matchPrivacyLevel: privacyLevel,
        template: {
          id: `match-${privacyLevel}`,
          category: 'match',
          title: this.getTemplateTitle(privacyLevel, outcome)
        },
        confidence,
        context: 'match',
        reasoning: this.generateReasoning(privacyLevel, outcome, matchData)
      });
    });

    // Sort by confidence and relevance
    return suggestions.sort((a, b) => {
      // Prioritize recommended level
      if (a.matchPrivacyLevel === smartDefaults.privacyLevel) return -1;
      if (b.matchPrivacyLevel === smartDefaults.privacyLevel) return 1;
      return b.confidence - a.confidence;
    });
  }

  private static calculateConfidence(
    matchData: MatchData, 
    privacyLevel: MatchPrivacyLevel, 
    outcome?: string
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on data completeness
    const dataCompleteness = this.assessDataCompleteness(matchData);
    confidence += dataCompleteness * 0.3;

    // Adjust based on privacy level and outcome
    if (outcome === 'won' && privacyLevel === 'summary') {
      confidence += 0.2; // People like sharing wins
    } else if (outcome === 'lost' && privacyLevel === 'basic') {
      confidence += 0.15; // More private for losses
    } else if (privacyLevel === 'detailed' && dataCompleteness > 0.7) {
      confidence += 0.1; // Good for detailed data
    }

    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }

  private static assessDataCompleteness(matchData: MatchData): number {
    let score = 0;
    const factors = [
      matchData.score ? 0.2 : 0,
      matchData.opponent_name ? 0.15 : 0,
      matchData.location ? 0.1 : 0,
      matchData.surface ? 0.1 : 0,
      matchData.serve_rating ? 0.1 : 0,
      matchData.return_rating ? 0.1 : 0,
      matchData.endurance_rating ? 0.1 : 0,
      matchData.highlights?.length ? 0.1 : 0,
      matchData.reflection_note ? 0.05 : 0
    ];
    
    return factors.reduce((sum, factor) => sum + factor, 0);
  }

  private static getTemplateTitle(privacyLevel: MatchPrivacyLevel, outcome?: string): string {
    const outcomeText = outcome === 'won' ? 'Victory' : outcome === 'lost' ? 'Learning' : 'Experience';
    
    switch (privacyLevel) {
      case 'basic':
        return `${outcomeText} Vibe Share`;
      case 'summary':
        return `${outcomeText} Summary`;
      case 'detailed':
        return `${outcomeText} Breakdown`;
      case 'full':
        return `Complete ${outcomeText} Story`;
      default:
        return `${outcomeText} Post`;
    }
  }

  private static generateReasoning(
    privacyLevel: MatchPrivacyLevel, 
    outcome?: string, 
    matchData?: MatchData
  ): string {
    const hasDetailedData = matchData && (
      matchData.serve_rating || 
      matchData.highlights?.length || 
      matchData.reflection_note
    );

    switch (privacyLevel) {
      case 'basic':
        return outcome === 'lost' 
          ? "Keep it positive and simple after a tough match"
          : "Share the good vibes without overwhelming details";
      
      case 'summary':
        return outcome === 'won' 
          ? "Perfect for celebrating your victory with key details"
          : "Share the basics while staying motivated";
      
      case 'detailed':
        return hasDetailedData
          ? "You have great performance data to share with the community"
          : "Good for connecting with serious players";
      
      case 'full':
        return "Complete transparency - great for learning and helping others grow";
      
      default:
        return "AI-generated suggestion based on your match data";
    }
  }

  // Enhanced session suggestions (keeping existing functionality)
  static generateSessionSuggestions(sessionData: any): EnhancedPostSuggestion[] {
    // Implementation for session suggestions would go here
    // For now, return empty array to maintain compatibility
    return [];
  }
}
