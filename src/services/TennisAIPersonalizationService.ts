
import { supabase } from '@/integrations/supabase/client';
import { TennisUserPreferences, TennisUserProgress } from '@/components/tennis-ai/types';

export class TennisAIPersonalizationService {
  /**
   * Enhances a system prompt with user-specific information for more personalized AI responses
   */
  static async enhanceSystemPrompt(basePrompt: string, userId: string): Promise<string> {
    try {
      // Fetch user preferences
      const { data: preferences, error: preferencesError } = await supabase
        .from('tennis_user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (preferencesError && preferencesError.code !== 'PGRST116') {
        console.error('Error fetching preferences:', preferencesError);
        return basePrompt;
      }

      // Fetch user progress
      const { data: progress, error: progressError } = await supabase
        .from('tennis_user_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (progressError && progressError.code !== 'PGRST116') {
        console.error('Error fetching progress:', progressError);
        return basePrompt;
      }
      
      // If no preferences or progress found, return the base prompt
      if (!preferences && !progress) {
        return basePrompt;
      }
      
      // Build the enhanced prompt with user preferences
      let enhancedPrompt = basePrompt + "\n\n### USER PROFILE INFORMATION:\n";
      
      if (preferences) {
        enhancedPrompt += "### TENNIS PREFERENCES:\n";
        
        if (preferences.preferred_play_style) {
          enhancedPrompt += `- Preferred playing style: ${preferences.preferred_play_style}\n`;
        }
        
        if (preferences.dominant_hand) {
          enhancedPrompt += `- Dominant hand: ${preferences.dominant_hand}\n`;
        }
        
        if (preferences.experience_level) {
          enhancedPrompt += `- Experience level: ${preferences.experience_level}\n`;
        }
        
        if (preferences.focus_areas && preferences.focus_areas.length > 0) {
          enhancedPrompt += `- Focus areas: ${preferences.focus_areas.join(', ')}\n`;
        }
        
        if (preferences.court_surface_preference) {
          enhancedPrompt += `- Preferred court surface: ${preferences.court_surface_preference}\n`;
        }
        
        if (preferences.training_frequency) {
          enhancedPrompt += `- Training frequency: ${preferences.training_frequency}\n`;
        }
        
        if (preferences.fitness_level) {
          enhancedPrompt += `- Fitness level: ${preferences.fitness_level}\n`;
        }
        
        if (preferences.recent_injuries && preferences.recent_injuries.length > 0) {
          enhancedPrompt += `- Recent injuries: ${preferences.recent_injuries.join(', ')}\n`;
        }
        
        if (preferences.goals && preferences.goals.length > 0) {
          enhancedPrompt += `- Goals: ${preferences.goals.join(', ')}\n`;
        }
        
        if (preferences.favorite_pros && preferences.favorite_pros.length > 0) {
          enhancedPrompt += `- Favorite professional players: ${preferences.favorite_pros.join(', ')}\n`;
        }
      }
      
      // Add progress information if available
      if (progress) {
        enhancedPrompt += "\n### TENNIS PROGRESS:\n";
        
        if (progress.skill_assessments && Object.keys(progress.skill_assessments).length > 0) {
          enhancedPrompt += "- Skill assessments:\n";
          Object.entries(progress.skill_assessments).forEach(([skill, assessment]) => {
            enhancedPrompt += `  - ${skill}: rated ${assessment.rating}/10 (last assessed: ${assessment.last_assessed})\n`;
          });
        }
        
        if (progress.completed_drills && progress.completed_drills.length > 0) {
          enhancedPrompt += `- Recently completed drills: ${progress.completed_drills.slice(-3).map(drill => drill.drill_name).join(', ')}\n`;
        }
        
        if (progress.lesson_history && progress.lesson_history.length > 0) {
          const recentLessons = progress.lesson_history.slice(-3);
          enhancedPrompt += "- Recent lesson topics:\n";
          recentLessons.forEach(lesson => {
            enhancedPrompt += `  - ${lesson.topic} (${lesson.date})\n`;
          });
        }
      }
      
      enhancedPrompt += "\n### INSTRUCTIONS FOR TENNIS AI:\n";
      enhancedPrompt += "- Use the user profile information above to personalize your responses.\n";
      enhancedPrompt += "- Reference their specific playing style, level, and goals when appropriate.\n";
      enhancedPrompt += "- If they have injuries, consider them when giving advice.\n";
      enhancedPrompt += "- Connect advice to their favorite pros' techniques when relevant.\n";
      enhancedPrompt += "- Track progress in topics discussed for future reference.\n";
      
      return enhancedPrompt;
    } catch (error) {
      console.error('Error enhancing system prompt:', error);
      return basePrompt;
    }
  }

  /**
   * Analyzes conversation history to identify user's interests and level
   */
  static analyzeConversationHistory(userId: string): Promise<{
    topics: string[], 
    level: string, 
    interests: string[]
  }> {
    // This would analyze past conversations to determine user's interests and level
    return Promise.resolve({
      topics: [],
      level: 'intermediate',
      interests: []
    });
  }

  /**
   * Tracks and stores user progress based on conversations
   */
  static async trackProgress(userId: string, conversationId: string): Promise<void> {
    try {
      // First, fetch the conversation to analyze the content
      const { data: messages, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error fetching conversation messages:', error);
        return;
      }
      
      // This is a placeholder for future implementation
      // Here we would:
      // 1. Extract topics, skills, techniques discussed
      // 2. Identify recommendations and advice given
      // 3. Update the user's progress record accordingly
      
      console.log(`Analyzed ${messages.length} messages for progress tracking`);
      
      // For now, we just log that we would track progress
      console.log(`Will track progress for user ${userId} based on conversation ${conversationId} in the future`);
    } catch (error) {
      console.error('Error tracking progress:', error);
    }
  }

  /**
   * Suggests follow-up topics based on conversation history
   */
  static async suggestFollowUpTopics(userId: string): Promise<string[]> {
    try {
      // In the future, this would:
      // 1. Fetch user preferences and progress
      // 2. Analyze recent conversations
      // 3. Identify gaps in skills or knowledge
      // 4. Suggest topics that would help progress
      
      // For now, return an empty array
      return [];
    } catch (error) {
      console.error('Error suggesting follow-up topics:', error);
      return [];
    }
  }

  /**
   * Creates a custom training plan based on user preferences and progress
   */
  static async generateTrainingPlan(userId: string): Promise<{
    plan_name: string,
    duration_weeks: number,
    sessions: Array<{
      focus: string,
      drills: string[],
      duration_minutes: number
    }>
  }> {
    try {
      // Fetch user preferences and progress
      const { data: preferences } = await supabase
        .from('tennis_user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      const { data: progress } = await supabase
        .from('tennis_user_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      // This would generate a custom training plan based on user data
      // For now, return a placeholder plan
      return {
        plan_name: 'Custom Training Plan',
        duration_weeks: 4,
        sessions: [
          {
            focus: 'Forehand consistency',
            drills: ['Cross-court rally', 'Target practice'],
            duration_minutes: 45
          },
          {
            focus: 'Serve technique',
            drills: ['Ball toss practice', 'Service game'],
            duration_minutes: 30
          }
        ]
      };
    } catch (error) {
      console.error('Error generating training plan:', error);
      throw error;
    }
  }
}
