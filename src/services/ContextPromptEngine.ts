
import { Post } from '@/types/post';
import { SessionFormValues } from '@/components/logging/session/sessionSchema';
import { supabase } from '@/integrations/supabase/client';

export interface PromptSuggestion {
  id: string;
  type: 'structured' | 'keyword_fallback' | 'generic_support';
  content: string;
  category: 'loss_support' | 'improvement_celebration' | 'coach_specific' | 'supportive_engagement';
  confidence: number;
  triggerReason: string;
  coachOnly?: boolean;
}

export interface ContextData {
  post?: Post;
  sessionData?: SessionFormValues;
  userType?: string;
  postContent?: string;
  isAmbassadorContent?: boolean;
}

export class ContextPromptEngine {
  private static instance: ContextPromptEngine;
  
  // Keyword patterns for fallback detection
  private readonly STRUGGLE_KEYWORDS = [
    'lost', 'struggled', 'difficult', 'hard', 'frustrated', 'disappointed',
    'failed', 'couldn\'t', 'can\'t', 'terrible', 'awful', 'bad day',
    'giving up', 'quit', 'hopeless', 'discouraged'
  ];

  private readonly IMPROVEMENT_KEYWORDS = [
    'better', 'improved', 'progress', 'breakthrough', 'achieved', 'accomplished',
    'great', 'excellent', 'amazing', 'fantastic', 'proud', 'excited',
    'personal best', 'new record', 'finally', 'mastered'
  ];

  static getInstance(): ContextPromptEngine {
    if (!this.instance) {
      this.instance = new ContextPromptEngine();
    }
    return this.instance;
  }

  async generatePrompts(context: ContextData): Promise<PromptSuggestion[]> {
    const suggestions: PromptSuggestion[] = [];
    
    // Try structured data prompts first (highest priority)
    const structuredPrompts = this.generateStructuredPrompts(context);
    suggestions.push(...structuredPrompts);
    
    // Keyword fallback for unstructured content
    if (context.postContent && suggestions.length === 0) {
      const keywordPrompts = this.generateKeywordFallbackPrompts(context);
      suggestions.push(...keywordPrompts);
    }
    
    // Coach-specific suggestions
    if (context.userType === 'coach') {
      const coachPrompts = this.generateCoachSpecificPrompts(context);
      suggestions.push(...coachPrompts);
    }
    
    // Safety net: Always provide generic supportive prompt
    const genericPrompt = this.generateGenericSupportPrompt(context);
    suggestions.push(genericPrompt);
    
    // Log prompt analytics if ambassador content
    if (context.isAmbassadorContent && suggestions.length > 0) {
      await this.logPromptAnalytics(context, suggestions);
    }
    
    return this.rankAndFilterPrompts(suggestions);
  }

  private generateStructuredPrompts(context: ContextData): PromptSuggestion[] {
    const prompts: PromptSuggestion[] = [];
    
    if (!context.sessionData) return prompts;
    
    const { mental_data, physical_data, session_note } = context.sessionData;
    
    // Loss support prompts based on structured data
    if (mental_data?.confidence && mental_data.confidence < 4) {
      prompts.push({
        id: `structured_loss_${Date.now()}`,
        type: 'structured',
        content: `Your confidence took a hit today. What specific aspect of your game would you like to work on to rebuild it? 💪`,
        category: 'loss_support',
        confidence: 0.9,
        triggerReason: `Low confidence score: ${mental_data.confidence}/10`,
      });
    }
    
    if (mental_data?.motivation && mental_data.motivation < 4) {
      prompts.push({
        id: `structured_motivation_${Date.now()}`,
        type: 'structured',
        content: `Tough session today? Remember, every champion has days like this. What's one small thing that went right? 🎾`,
        category: 'loss_support',
        confidence: 0.85,
        triggerReason: `Low motivation score: ${mental_data.motivation}/10`,
      });
    }
    
    // Improvement celebration prompts
    if (mental_data?.confidence && mental_data.confidence >= 8) {
      prompts.push({
        id: `structured_celebration_${Date.now()}`,
        type: 'structured',
        content: `You're feeling confident! What breakthrough moment made the biggest difference today? 🔥`,
        category: 'improvement_celebration',
        confidence: 0.9,
        triggerReason: `High confidence score: ${mental_data.confidence}/10`,
      });
    }
    
    if (physical_data?.energyLevel && physical_data.energyLevel >= 8) {
      prompts.push({
        id: `structured_energy_${Date.now()}`,
        type: 'structured',
        content: `Your energy is through the roof! How did you prepare for such an amazing session? ⚡`,
        category: 'improvement_celebration',
        confidence: 0.85,
        triggerReason: `High energy level: ${physical_data.energyLevel}/10`,
      });
    }
    
    return prompts;
  }

  private generateKeywordFallbackPrompts(context: ContextData): PromptSuggestion[] {
    const prompts: PromptSuggestion[] = [];
    const content = context.postContent?.toLowerCase() || '';
    
    // Check for struggle keywords
    const strugglingDetected = this.STRUGGLE_KEYWORDS.some(keyword => 
      content.includes(keyword.toLowerCase())
    );
    
    if (strugglingDetected) {
      prompts.push({
        id: `keyword_struggle_${Date.now()}`,
        type: 'keyword_fallback',
        content: `It sounds like you're going through a tough time. What's one lesson you're taking away from today? 💙`,
        category: 'loss_support',
        confidence: 0.7,
        triggerReason: 'Struggle keywords detected in post content',
      });
      
      prompts.push({
        id: `keyword_encourage_${Date.now()}`,
        type: 'keyword_fallback',
        content: `We all have challenging days on the court. What would help you feel more prepared for your next session? 🤝`,
        category: 'loss_support',
        confidence: 0.65,
        triggerReason: 'Struggle keywords detected in post content',
      });
    }
    
    // Check for improvement keywords
    const improvementDetected = this.IMPROVEMENT_KEYWORDS.some(keyword => 
      content.includes(keyword.toLowerCase())
    );
    
    if (improvementDetected) {
      prompts.push({
        id: `keyword_celebration_${Date.now()}`,
        type: 'keyword_fallback',
        content: `That sounds like amazing progress! What specific technique or mindset shift made the difference? 🎉`,
        category: 'improvement_celebration',
        confidence: 0.75,
        triggerReason: 'Improvement keywords detected in post content',
      });
    }
    
    return prompts;
  }

  private generateCoachSpecificPrompts(context: ContextData): PromptSuggestion[] {
    const prompts: PromptSuggestion[] = [];
    
    // Coach-specific suggestions only show to coaches
    prompts.push({
      id: `coach_insight_${Date.now()}`,
      type: 'structured',
      content: `As a coach, what technical insight would help other players facing similar challenges? 🎯`,
      category: 'coach_specific',
      confidence: 0.8,
      triggerReason: 'User is a coach',
      coachOnly: true,
    });
    
    prompts.push({
      id: `coach_drill_${Date.now()}`,
      type: 'structured',
      content: `What's your go-to drill for players working on this aspect of their game? 📝`,
      category: 'coach_specific',
      confidence: 0.75,
      triggerReason: 'User is a coach',
      coachOnly: true,
    });
    
    return prompts;
  }

  private generateGenericSupportPrompt(context: ContextData): PromptSuggestion {
    const supportivePrompts = [
      "Share something supportive or encouraging! 🌟",
      "What advice would you give to someone in a similar situation? 💬",
      "Drop some motivation for your fellow tennis players! 🎾",
      "Share your thoughts and support the community! 💪",
      "What encouraging words come to mind? 🤗"
    ];
    
    const randomPrompt = supportivePrompts[Math.floor(Math.random() * supportivePrompts.length)];
    
    return {
      id: `generic_support_${Date.now()}`,
      type: 'generic_support',
      content: randomPrompt,
      category: 'supportive_engagement',
      confidence: 0.5,
      triggerReason: 'Generic safety net prompt',
    };
  }

  private async logPromptAnalytics(context: ContextData, suggestions: PromptSuggestion[]): Promise<void> {
    try {
      const analyticsData = suggestions.map(suggestion => ({
        prompt_type: suggestion.type,
        category: suggestion.category,
        confidence: suggestion.confidence,
        trigger_reason: suggestion.triggerReason,
        post_id: context.post?.id,
        is_ambassador_content: context.isAmbassadorContent,
        user_type: context.userType,
        created_at: new Date().toISOString()
      }));
      
      // Log to reaction_analytics table for prompt training data
      const { error } = await supabase
        .from('reaction_analytics' as any)
        .insert(analyticsData.map(data => ({
          post_id: data.post_id || crypto.randomUUID(),
          user_id: crypto.randomUUID(), // Anonymous for training
          reaction_type: 'prompt_suggestion',
          action: 'generated',
          is_ambassador_content: data.is_ambassador_content,
          created_at: data.created_at
        })));
      
      if (error) {
        console.error('Error logging prompt analytics:', error);
      }
    } catch (error) {
      console.error('Error in prompt analytics logging:', error);
    }
  }

  private rankAndFilterPrompts(suggestions: PromptSuggestion[]): PromptSuggestion[] {
    // Sort by confidence and type priority
    const priorityOrder = ['structured', 'keyword_fallback', 'generic_support'];
    
    return suggestions
      .sort((a, b) => {
        // First sort by type priority
        const aPriority = priorityOrder.indexOf(a.type);
        const bPriority = priorityOrder.indexOf(b.type);
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Then by confidence
        return b.confidence - a.confidence;
      })
      .slice(0, 3); // Limit to top 3 suggestions
  }

  // Method to track click-through rates
  async trackPromptInteraction(promptId: string, action: 'click' | 'dismiss'): Promise<void> {
    try {
      const { error } = await supabase
        .from('reaction_analytics' as any)
        .insert({
          post_id: crypto.randomUUID(),
          user_id: crypto.randomUUID(),
          reaction_type: 'prompt_interaction',
          action: action,
          is_ambassador_content: false,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error tracking prompt interaction:', error);
      }
    } catch (error) {
      console.error('Error in prompt interaction tracking:', error);
    }
  }
}
