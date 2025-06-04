
import { Post } from '@/types/post';

export interface PromptContext {
  userType: 'player' | 'coach' | 'ambassador';
  relationship: 'self' | 'following' | 'stranger';
  postType: 'match' | 'session' | 'general';
  isWin?: boolean;
  hasStructuredData?: boolean;
}

export interface GeneratedPrompt {
  text: string;
  placeholder: string;
  requiresCoach: boolean;
  category: 'structured' | 'keyword' | 'fallback';
}

export class ContextPromptEngine {
  private static instance: ContextPromptEngine;

  static getInstance(): ContextPromptEngine {
    if (!this.instance) {
      this.instance = new ContextPromptEngine();
    }
    return this.instance;
  }

  // Structured data prompts
  private structuredPrompts = {
    match_win: {
      coach: "Analyze this victory! What tactical decisions led to success? 🏆",
      player: "Celebrate with {name}! Great victory! 🏆"
    },
    match_loss: {
      coach: "Help {name} find the learning opportunities in this match 💪",
      player: "Cheer on {name}! Every loss is a lesson 💪"
    },
    session_technical: {
      coach: "Share technique refinements for {name}'s focus areas 🎯",
      player: "Ask {name} about their technique focus today"
    },
    session_physical: {
      coach: "Suggest complementary fitness work for {name} 💪",
      player: "How did the physical training feel today?"
    },
    session_mental: {
      coach: "Explore {name}'s mental game insights 🧠",
      player: "Ask {name} about their mental game today"
    }
  };

  // Keyword-based fallback prompts
  private keywordPrompts = {
    struggled: {
      coach: "Offer tactical solutions - turn struggles into strengths",
      player: "Offer encouragement - we all have tough days"
    },
    improved: {
      coach: "Reinforce this progress with technical insights",
      player: "Celebrate this progress with {name}!"
    },
    lost: {
      coach: "Help {name} extract lessons from this experience",
      player: "Remind {name} that losses build champions"
    },
    tired: {
      coach: "Suggest recovery strategies and energy management",
      player: "Everyone has those energy-draining sessions!"
    },
    breakthrough: {
      coach: "Build on this breakthrough with next-level challenges",
      player: "Amazing breakthrough! Keep that momentum going! 🔥"
    },
    nervous: {
      coach: "Share mental strategies to manage pre-match nerves",
      player: "We all get nervous - you've got this! 💪"
    },
    confident: {
      coach: "Channel this confidence into tactical execution",
      player: "Love seeing this confidence! Keep it up! ✨"
    }
  };

  // Universal fallbacks
  private universalPrompts = {
    coach: "Share your coaching insight",
    player: "Leave a supportive comment"
  };

  generatePrompt(post: Post, context: PromptContext, authorName?: string): GeneratedPrompt {
    const name = authorName || 'them';
    const userRole = context.userType;

    // Try structured data first
    const structuredPrompt = this.getStructuredPrompt(post, context, name);
    if (structuredPrompt) {
      return {
        ...structuredPrompt,
        category: 'structured',
        requiresCoach: userRole !== 'coach' && (structuredPrompt.text.includes('tactical') || structuredPrompt.text.includes('technical'))
      };
    }

    // Fall back to keyword analysis
    const keywordPrompt = this.getKeywordPrompt(post, context, name);
    if (keywordPrompt) {
      return {
        ...keywordPrompt,
        category: 'keyword',
        requiresCoach: userRole !== 'coach' && (keywordPrompt.text.includes('tactical') || keywordPrompt.text.includes('technical'))
      };
    }

    // Universal fallback
    const fallbackText = this.universalPrompts[userRole] || this.universalPrompts.player;
    return {
      text: fallbackText,
      placeholder: this.generatePlaceholder(fallbackText, name),
      requiresCoach: false,
      category: 'fallback'
    };
  }

  private getStructuredPrompt(post: Post, context: PromptContext, name: string): Omit<GeneratedPrompt, 'requiresCoach' | 'category'> | null {
    // Check for match data
    if (context.postType === 'match') {
      const key = context.isWin ? 'match_win' : 'match_loss';
      const prompts = this.structuredPrompts[key];
      const text = prompts[context.userType] || prompts.player;
      
      return {
        text: text.replace('{name}', name),
        placeholder: this.generatePlaceholder(text, name)
      };
    }

    // Check for session data
    if (context.postType === 'session') {
      // Determine session type from content or default to technical
      const sessionType = this.detectSessionType(post.content);
      const key = `session_${sessionType}` as keyof typeof this.structuredPrompts;
      const prompts = this.structuredPrompts[key];
      
      if (prompts) {
        const text = prompts[context.userType] || prompts.player;
        return {
          text: text.replace('{name}', name),
          placeholder: this.generatePlaceholder(text, name)
        };
      }
    }

    return null;
  }

  private getKeywordPrompt(post: Post, context: PromptContext, name: string): Omit<GeneratedPrompt, 'requiresCoach' | 'category'> | null {
    const content = post.content.toLowerCase();
    
    // Check each keyword
    for (const [keyword, prompts] of Object.entries(this.keywordPrompts)) {
      if (content.includes(keyword)) {
        const text = prompts[context.userType] || prompts.player;
        return {
          text: text.replace('{name}', name),
          placeholder: this.generatePlaceholder(text, name)
        };
      }
    }

    return null;
  }

  private detectSessionType(content: string): string {
    const lower = content.toLowerCase();
    
    if (lower.includes('mental') || lower.includes('focus') || lower.includes('confidence')) {
      return 'mental';
    }
    if (lower.includes('fitness') || lower.includes('endurance') || lower.includes('strength')) {
      return 'physical';
    }
    return 'technical'; // Default
  }

  private generatePlaceholder(promptText: string, name: string): string {
    // Convert prompt to a natural placeholder
    if (promptText.includes('Celebrate')) {
      return `Congratulations on the win, ${name}!`;
    }
    if (promptText.includes('Cheer on')) {
      return `Keep your head up, ${name}. You'll get them next time!`;
    }
    if (promptText.includes('technique')) {
      return `What technique did you work on today?`;
    }
    if (promptText.includes('struggled')) {
      return `We all have those days - you're getting stronger!`;
    }
    if (promptText.includes('improved')) {
      return `Love seeing this progress! What clicked for you?`;
    }
    if (promptText.includes('coaching insight')) {
      return `Share your coaching perspective...`;
    }
    
    return `Write a supportive comment...`;
  }

  // Get context from post and user relationship
  static buildContext(post: Post, currentUserId?: string, userType?: string): PromptContext {
    const relationship = post.user_id === currentUserId ? 'self' : 'following'; // Simplified for now
    
    // Detect post type from content or metadata
    let postType: 'match' | 'session' | 'general' = 'general';
    const content = post.content.toLowerCase();
    
    if (content.includes('match') || content.includes('played') || content.includes('opponent')) {
      postType = 'match';
    } else if (content.includes('practice') || content.includes('session') || content.includes('drill')) {
      postType = 'session';
    }

    return {
      userType: (userType as any) || 'player',
      relationship,
      postType,
      isWin: content.includes('won') || content.includes('victory') || content.includes('beat'),
      hasStructuredData: false // TODO: Check for actual structured data
    };
  }
}
