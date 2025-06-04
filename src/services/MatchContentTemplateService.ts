
import { MatchData } from '@/components/logging/match/MatchLogger';

export type MatchPrivacyLevel = 'private' | 'basic' | 'summary' | 'detailed' | 'full';

export interface MatchContentTemplate {
  content: string;
  privacyLevel: 'public' | 'friends' | 'coaches' | 'public_highlights' | 'private';
  tags?: string[];
}

export class MatchContentTemplateService {
  static generateContent(matchData: MatchData, privacyLevel: MatchPrivacyLevel): MatchContentTemplate {
    const outcome = matchData.match_outcome;
    const score = matchData.score;
    const opponentName = matchData.opponent_name;
    const location = matchData.location;
    const surface = matchData.surface;
    const highlights = matchData.highlights || [];
    const reflectionNote = matchData.reflection_note;
    
    // Performance ratings
    const serveRating = matchData.serve_rating;
    const returnRating = matchData.return_rating;
    const enduranceRating = matchData.endurance_rating;
    
    // Mental state
    const energyEmoji = matchData.energy_emoji;
    const focusEmoji = matchData.focus_emoji;
    const emotionEmoji = matchData.emotion_emoji;

    switch (privacyLevel) {
      case 'private':
        return this.generatePrivateContent(matchData);
        
      case 'basic':
        return this.generateBasicContent(outcome, energyEmoji, emotionEmoji);
        
      case 'summary':
        return this.generateSummaryContent(outcome, score, opponentName, location);
        
      case 'detailed':
        return this.generateDetailedContent(
          outcome, score, opponentName, location, surface,
          serveRating, returnRating, enduranceRating, highlights
        );
        
      case 'full':
        return this.generateFullContent(matchData);
        
      default:
        return this.generateBasicContent(outcome);
    }
  }

  private static generatePrivateContent(matchData: MatchData): MatchContentTemplate {
    const outcome = matchData.match_outcome;
    let content = `Match reflection - ${new Date().toLocaleDateString()}\n\n`;
    
    if (outcome === 'won') {
      content += "✅ Victory today! ";
    } else if (outcome === 'lost') {
      content += "📈 Learning opportunity today. ";
    } else {
      content += "🤝 Close match today. ";
    }
    
    if (matchData.reflection_note) {
      content += `\n\nReflection: ${matchData.reflection_note}`;
    }
    
    // Add performance notes
    const ratings = [];
    if (matchData.serve_rating) ratings.push(`Serve: ${matchData.serve_rating}/5`);
    if (matchData.return_rating) ratings.push(`Return: ${matchData.return_rating}/5`);
    if (matchData.endurance_rating) ratings.push(`Endurance: ${matchData.endurance_rating}/5`);
    
    if (ratings.length > 0) {
      content += `\n\nPerformance:\n${ratings.join(', ')}`;
    }

    return {
      content,
      privacyLevel: 'private',
      tags: ['match', 'reflection', 'private']
    };
  }

  private static generateBasicContent(
    outcome?: string, 
    energyEmoji?: string, 
    emotionEmoji?: string
  ): MatchContentTemplate {
    const vibes = [
      outcome === 'won' ? ["Great match today! 🎾", "Tennis time! Feeling good 🏆", "On court and loving it! 🎾"] :
      outcome === 'lost' ? ["Tennis session complete 💪", "Another day on the court 🎾", "Every match teaches something 📚"] :
      ["Had a match today! 🎾", "Court time! 🎾", "Tennis vibes today ✨"]
    ][0];
    
    let content = vibes[Math.floor(Math.random() * vibes.length)];
    
    // Add emoji context if available
    if (energyEmoji || emotionEmoji) {
      const emojis = [energyEmoji, emotionEmoji].filter(Boolean);
      if (emojis.length > 0) {
        content += ` ${emojis.join(' ')}`;
      }
    }

    return {
      content,
      privacyLevel: 'public_highlights',
      tags: ['tennis', 'match']
    };
  }

  private static generateSummaryContent(
    outcome?: string,
    score?: string,
    opponentName?: string,
    location?: string
  ): MatchContentTemplate {
    let content = '';
    
    if (outcome === 'won') {
      content = `Great match today! ${score ? `Won ${score}` : 'Victory feels sweet!'} 🏆`;
    } else if (outcome === 'lost') {
      content = `Tough match today, but every loss is a lesson learned. ${score ? `Lost ${score}` : 'Getting stronger!'} 💪`;
    } else {
      content = `Close match today! ${score ? `Final score: ${score}` : 'What a battle!'} 🤝`;
    }
    
    if (opponentName) {
      content += ` Great playing against ${opponentName}!`;
    }
    
    if (location) {
      content += ` 📍 ${location}`;
    }
    
    content += ' 🎾';

    return {
      content,
      privacyLevel: 'public',
      tags: ['tennis', 'match', outcome || 'played']
    };
  }

  private static generateDetailedContent(
    outcome?: string,
    score?: string,
    opponentName?: string,
    location?: string,
    surface?: string,
    serveRating?: number,
    returnRating?: number,
    enduranceRating?: number,
    highlights?: Array<{ type: string; note?: string }>
  ): MatchContentTemplate {
    let content = '';
    
    // Match outcome and score
    if (outcome === 'won') {
      content = `🏆 Victory today! ${score ? `Won ${score}` : 'What a match!'}`;
    } else if (outcome === 'lost') {
      content = `💪 Fought hard today! ${score ? `Lost ${score}` : 'Learned a lot!'} Every match makes me stronger.`;
    } else {
      content = `🤝 Intense match today! ${score ? `Final: ${score}` : 'What a battle!'}`;
    }
    
    if (opponentName) {
      content += ` Huge respect to ${opponentName} - great competition!`;
    }
    
    // Performance insights
    const performanceNotes = [];
    if (serveRating && serveRating >= 4) {
      performanceNotes.push(`🎯 Serve was on point today (${serveRating}/5)`);
    } else if (serveRating && serveRating <= 2) {
      performanceNotes.push(`📈 Working on my serve consistency (${serveRating}/5)`);
    }
    
    if (returnRating && returnRating >= 4) {
      performanceNotes.push(`💥 Returns felt great (${returnRating}/5)`);
    }
    
    if (enduranceRating && enduranceRating >= 4) {
      performanceNotes.push(`⚡ Energy levels stayed high throughout (${enduranceRating}/5)`);
    }
    
    if (performanceNotes.length > 0) {
      content += `\n\n${performanceNotes.join('\n')}`;
    }
    
    // Highlights
    if (highlights && highlights.length > 0) {
      const highlightText = highlights
        .filter(h => h.note)
        .map(h => `• ${h.note}`)
        .join('\n');
      
      if (highlightText) {
        content += `\n\n🌟 Key moments:\n${highlightText}`;
      }
    }
    
    // Court details
    const courtDetails = [];
    if (location) courtDetails.push(`📍 ${location}`);
    if (surface) courtDetails.push(`🏟️ ${surface} court`);
    
    if (courtDetails.length > 0) {
      content += `\n\n${courtDetails.join(' | ')}`;
    }

    return {
      content,
      privacyLevel: 'public',
      tags: ['tennis', 'match', 'performance', outcome || 'played']
    };
  }

  private static generateFullContent(matchData: MatchData): MatchContentTemplate {
    const detailed = this.generateDetailedContent(
      matchData.match_outcome,
      matchData.score,
      matchData.opponent_name,
      matchData.location,
      matchData.surface,
      matchData.serve_rating,
      matchData.return_rating,
      matchData.endurance_rating,
      matchData.highlights
    );
    
    let content = detailed.content;
    
    // Add mental state
    const mentalState = [];
    if (matchData.energy_emoji) mentalState.push(`Energy: ${matchData.energy_emoji}`);
    if (matchData.focus_emoji) mentalState.push(`Focus: ${matchData.focus_emoji}`);
    if (matchData.emotion_emoji) mentalState.push(`Mood: ${matchData.emotion_emoji}`);
    
    if (mentalState.length > 0) {
      content += `\n\n🧠 Mental game: ${mentalState.join(' | ')}`;
    }
    
    // Add reflection
    if (matchData.reflection_note) {
      content += `\n\n💭 Reflection:\n${matchData.reflection_note}`;
    }
    
    // Add tags
    if (matchData.tags && matchData.tags.length > 0) {
      content += `\n\n🏷️ ${matchData.tags.map(tag => `#${tag}`).join(' ')}`;
    }
    
    content += '\n\n#TennisJourney #AlwaysLearning 🎾';

    return {
      content,
      privacyLevel: 'public',
      tags: ['tennis', 'match', 'journey', 'detailed', matchData.match_outcome || 'played']
    };
  }

  // Helper method to get smart defaults
  static getSmartDefaults(matchData: MatchData): {
    privacyLevel: MatchPrivacyLevel;
    postPrivacy: 'public' | 'friends' | 'coaches' | 'public_highlights' | 'private';
  } {
    const outcome = matchData.match_outcome;
    
    // Smart defaults based on match outcome
    if (outcome === 'won') {
      return {
        privacyLevel: 'summary',
        postPrivacy: 'public'
      };
    } else if (outcome === 'lost') {
      return {
        privacyLevel: 'basic',
        postPrivacy: 'friends'
      };
    } else {
      return {
        privacyLevel: 'basic',
        postPrivacy: 'public_highlights'
      };
    }
  }
}
