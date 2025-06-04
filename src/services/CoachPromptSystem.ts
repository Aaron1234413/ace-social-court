
import { ContextPromptEngine, PromptContext, GeneratedPrompt } from './ContextPromptEngine';
import { KeywordAnalyzer, KeywordMatch } from './KeywordAnalyzer';
import { Post } from '@/types/post';

export interface CoachPrompt extends GeneratedPrompt {
  expertise: 'technical' | 'mental' | 'tactical' | 'physical';
  actionType: 'analyze' | 'encourage' | 'instruct' | 'question';
}

export class CoachPromptSystem {
  private static instance: CoachPromptSystem;
  private contextEngine: ContextPromptEngine;

  static getInstance(): CoachPromptSystem {
    if (!this.instance) {
      this.instance = new CoachPromptSystem();
    }
    return this.instance;
  }

  constructor() {
    this.contextEngine = ContextPromptEngine.getInstance();
  }

  private coachSpecificPrompts = {
    technical: {
      analyze: "Break down the technique - what fundamentals need refinement?",
      encourage: "Great technical focus! Build on this foundation",
      instruct: "Try adjusting your grip/stance/follow-through for better results",
      question: "What felt different about your technique today?"
    },
    mental: {
      analyze: "Analyze the mental approach - confidence and focus patterns",
      encourage: "Strong mental game showing! Keep building that resilience",
      instruct: "Practice visualization and breathing techniques before points",
      question: "How did you handle pressure moments in this match?"
    },
    tactical: {
      analyze: "Review court positioning and shot selection decisions",
      encourage: "Smart tactical play! Your court awareness is improving",
      instruct: "Consider mixing up pace and placement to keep opponents guessing",
      question: "What was your game plan and how did it unfold?"
    },
    physical: {
      analyze: "Assess movement patterns and physical conditioning impact",
      encourage: "Your fitness work is paying off on court!",
      instruct: "Focus on recovery and consistent training rhythm",
      question: "How did your energy levels affect your play today?"
    }
  };

  generateCoachPrompt(post: Post, context: PromptContext, authorName?: string): CoachPrompt {
    // Start with base context prompt
    const basePrompt = this.contextEngine.generatePrompt(post, context, authorName);
    
    // If user is not a coach, return upgrade prompt
    if (context.userType !== 'coach') {
      return {
        ...basePrompt,
        expertise: 'technical',
        actionType: 'encourage',
        requiresCoach: true,
        text: "Unlock coach insights - upgrade to share professional analysis"
      };
    }

    // Analyze content for coaching focus area
    const keywords = KeywordAnalyzer.analyzeContent(post.content);
    const expertise = this.determineExpertiseArea(post, keywords);
    const actionType = this.determineActionType(post, keywords);
    
    // Get coach-specific prompt
    const coachPrompt = this.coachSpecificPrompts[expertise][actionType];
    
    return {
      text: coachPrompt,
      placeholder: this.generateCoachPlaceholder(expertise, actionType, authorName),
      requiresCoach: false,
      category: 'structured',
      expertise,
      actionType
    };
  }

  private determineExpertiseArea(post: Post, keywords: KeywordMatch[]): CoachPrompt['expertise'] {
    const content = post.content.toLowerCase();
    
    // Check for explicit mentions
    if (content.includes('technique') || content.includes('form') || content.includes('grip')) {
      return 'technical';
    }
    if (content.includes('nervous') || content.includes('confident') || content.includes('mental')) {
      return 'mental';
    }
    if (content.includes('strategy') || content.includes('tactic') || content.includes('placement')) {
      return 'tactical';
    }
    if (content.includes('tired') || content.includes('fitness') || content.includes('endurance')) {
      return 'physical';
    }
    
    // Use keyword categories
    const technicalKeywords = keywords.filter(k => k.category === 'technical');
    if (technicalKeywords.length > 0) return 'technical';
    
    const physicalKeywords = keywords.filter(k => k.category === 'physical');
    if (physicalKeywords.length > 0) return 'physical';
    
    const emotionKeywords = keywords.filter(k => k.category === 'emotion');
    if (emotionKeywords.length > 0) return 'mental';
    
    // Default to tactical for match posts, technical for others
    return content.includes('match') || content.includes('opponent') ? 'tactical' : 'technical';
  }

  private determineActionType(post: Post, keywords: KeywordMatch[]): CoachPrompt['actionType'] {
    const tone = KeywordAnalyzer.getEmotionalTone(post.content);
    const hasPerformance = KeywordAnalyzer.hasPerformanceIndicators(post.content);
    
    // If negative tone, encourage
    if (tone === 'negative') return 'encourage';
    
    // If positive tone with performance indicators, analyze
    if (tone === 'positive' && hasPerformance) return 'analyze';
    
    // If asking questions (contains ?) or seems unsure, instruct
    if (post.content.includes('?') || post.content.includes('how') || post.content.includes('should')) {
      return 'instruct';
    }
    
    // Default to asking questions to engage
    return 'question';
  }

  private generateCoachPlaceholder(expertise: CoachPrompt['expertise'], actionType: CoachPrompt['actionType'], authorName?: string): string {
    const name = authorName || 'them';
    
    switch (actionType) {
      case 'analyze':
        return `Share your ${expertise} analysis for ${name}...`;
      case 'encourage':
        return `Encourage ${name}'s ${expertise} development...`;
      case 'instruct':
        return `Suggest ${expertise} improvements for ${name}...`;
      case 'question':
        return `Ask ${name} about their ${expertise} experience...`;
      default:
        return `Share your coaching insight...`;
    }
  }

  // Get prompts for coach upgrade tooltips
  getUpgradePrompts(): { [key: string]: string } {
    return {
      technical: "Unlock technical analysis tools and form feedback",
      mental: "Access mental game coaching strategies and confidence building",
      tactical: "Share advanced tactical insights and game planning",
      physical: "Provide fitness and conditioning guidance"
    };
  }
}
