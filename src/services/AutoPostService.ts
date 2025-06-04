import { supabase } from '@/integrations/supabase/client';
import { PostTemplate } from '@/types/post';
import { Session } from '@/types/logging';
import { SessionFormValues } from '@/components/logging/session/sessionSchema';

export interface PostSuggestion {
  id: string;
  content: string;
  template: PostTemplate;
  confidence: number;
  sessionId: string;
  privacyLevel: 'private' | 'friends' | 'public' | 'coaches' | 'public_highlights';
}

export class AutoPostService {
  private static instance: AutoPostService;
  private templateRotationMap = new Map<string, number>();

  static getInstance(): AutoPostService {
    if (!this.instance) {
      this.instance = new AutoPostService();
    }
    return this.instance;
  }

  async generatePostSuggestions(
    sessionData: SessionFormValues,
    userId: string
  ): Promise<PostSuggestion[]> {
    try {
      console.log('🤖 AutoPostService: Generating post suggestions', { sessionData, userId });

      // Get available templates
      const templates = await this.getRelevantTemplates(sessionData);
      if (templates.length === 0) {
        console.log('No relevant templates found');
        return [];
      }

      // Select template using rotation algorithm
      const selectedTemplate = this.selectTemplateWithRotation(templates, userId);
      
      // Generate content
      const content = this.renderContent(selectedTemplate, sessionData);
      
      // Determine suggested privacy level
      const privacyLevel = this.suggestPrivacyLevel(sessionData);

      const suggestion: PostSuggestion = {
        id: `suggestion_${Date.now()}`,
        content,
        template: selectedTemplate,
        confidence: this.calculateConfidence(sessionData, selectedTemplate),
        sessionId: sessionData.session_date.toISOString(),
        privacyLevel
      };

      console.log('✅ Generated post suggestion:', suggestion);
      return [suggestion];
    } catch (error) {
      console.error('❌ Error generating post suggestions:', error);
      return [];
    }
  }

  private async getRelevantTemplates(sessionData: SessionFormValues): Promise<PostTemplate[]> {
    try {
      // Determine category based on session data
      let category: PostTemplate['category'] = 'workout';
      
      if (sessionData.focus_areas?.includes('match_preparation')) {
        category = 'match';
      } else if (sessionData.focus_areas?.includes('technique_improvement')) {
        category = 'technique';
      } else if (sessionData.focus_areas?.some(area => area.includes('progress'))) {
        category = 'progress';
      } else if (sessionData.session_note?.toLowerCase().includes('motivation')) {
        category = 'motivation';
      }

      const { data, error } = await supabase
        .from('post_templates')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('title');

      if (error) throw error;

      return (data || []).map(template => ({
        ...template,
        placeholders: Array.isArray(template.placeholders) 
          ? template.placeholders as string[]
          : JSON.parse(template.placeholders as string) as string[]
      }));
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  private selectTemplateWithRotation(templates: PostTemplate[], userId: string): PostTemplate {
    const userKey = `${userId}_template_rotation`;
    const currentIndex = this.templateRotationMap.get(userKey) || 0;
    
    // Select template and update rotation
    const selectedTemplate = templates[currentIndex % templates.length];
    this.templateRotationMap.set(userKey, currentIndex + 1);
    
    console.log(`🔄 Template rotation for ${userId}: ${currentIndex} -> ${selectedTemplate.title}`);
    return selectedTemplate;
  }

  private renderContent(template: PostTemplate, sessionData: SessionFormValues): string {
    let content = template.content_template;
    
    // Create placeholder replacement map
    const replacements = this.createReplacementMap(sessionData);
    
    // Replace placeholders
    template.placeholders.forEach(placeholder => {
      const value = replacements[placeholder] || this.getDefaultValue(placeholder);
      const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
      content = content.replace(regex, value);
    });

    // Clean up any remaining unreplaced placeholders
    content = content.replace(/\{[^}]+\}/g, '');
    
    // Make content more natural
    content = this.naturalizeContent(content);
    
    return content.trim();
  }

  private createReplacementMap(sessionData: SessionFormValues): Record<string, string> {
    const today = new Date().toLocaleDateString();
    
    return {
      date: sessionData.session_date.toLocaleDateString(),
      today,
      focus_area: sessionData.focus_areas?.[0] || 'tennis training',
      focus_areas: sessionData.focus_areas?.join(', ') || 'various aspects',
      drill: sessionData.drills?.[0]?.name || 'tennis drills',
      drills: sessionData.drills?.map(d => d.name).join(', ') || 'various drills',
      next_step: sessionData.next_steps?.[0]?.description || 'continue improving',
      session_note: sessionData.session_note || 'had a great session',
      energy_level: sessionData.physical_data?.energyLevel || 'good energy',
      confidence: sessionData.mental_data?.confidence?.toString() || 'feeling confident',
      technical_focus: this.extractTechnicalFocus(sessionData.technical_data),
      session_type: this.determineSessionType(sessionData),
      mood: this.determineMood(sessionData),
      achievement: this.extractAchievement(sessionData),
      challenge: this.extractChallenge(sessionData)
    };
  }

  private extractTechnicalFocus(technicalData: any): string {
    if (!technicalData?.selectedStrokes) return 'technique';
    
    const strokes = Object.keys(technicalData.selectedStrokes);
    if (strokes.length === 0) return 'technique';
    
    return strokes.length === 1 ? strokes[0] : `${strokes[0]} and other strokes`;
  }

  private determineSessionType(sessionData: SessionFormValues): string {
    if (sessionData.focus_areas?.includes('match_preparation')) return 'match prep';
    if (sessionData.focus_areas?.includes('fitness')) return 'fitness';
    if (sessionData.focus_areas?.includes('technique_improvement')) return 'technique';
    return 'training';
  }

  private determineMood(sessionData: SessionFormValues): string {
    const confidence = sessionData.mental_data?.confidence || 5;
    const motivation = sessionData.mental_data?.motivation || 5;
    
    const avgMood = (confidence + motivation) / 2;
    
    if (avgMood >= 8) return 'fantastic';
    if (avgMood >= 6) return 'great';
    if (avgMood >= 4) return 'good';
    return 'determined';
  }

  private extractAchievement(sessionData: SessionFormValues): string {
    // Look for positive indicators in drills or notes
    const positiveIndicators = [
      'improved', 'better', 'great', 'excellent', 'progress', 'breakthrough'
    ];
    
    const note = sessionData.session_note?.toLowerCase() || '';
    const hasPositive = positiveIndicators.some(word => note.includes(word));
    
    if (hasPositive) return 'made some great progress';
    return 'pushed my limits';
  }

  private extractChallenge(sessionData: SessionFormValues): string {
    // Look for areas that need work
    const drillsWithLowRating = sessionData.drills?.filter(d => d.rating && d.rating < 6);
    
    if (drillsWithLowRating && drillsWithLowRating.length > 0) {
      return `working on ${drillsWithLowRating[0].name}`;
    }
    
    return 'challenging myself';
  }

  private getDefaultValue(placeholder: string): string {
    const defaults: Record<string, string> = {
      date: 'today',
      today: new Date().toLocaleDateString(),
      focus_area: 'tennis',
      drill: 'practice',
      next_step: 'keep improving',
      session_note: 'had a good session',
      energy_level: 'energetic',
      confidence: 'confident',
      technical_focus: 'technique',
      session_type: 'training',
      mood: 'great',
      achievement: 'made progress',
      challenge: 'pushing myself'
    };
    
    return defaults[placeholder] || 'tennis';
  }

  private naturalizeContent(content: string): string {
    // Add natural variations and clean up
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\.\s*\./g, '.')
      .replace(/,\s*,/g, ',')
      .replace(/!\s*!/g, '!')
      .trim();
    
    // Ensure proper sentence endings
    if (content && !content.match(/[.!?]$/)) {
      content += '!';
    }
    
    return content;
  }

  private calculateConfidence(sessionData: SessionFormValues, template: PostTemplate): number {
    let confidence = 0.7; // Base confidence
    
    // Increase confidence based on data completeness
    if (sessionData.session_note) confidence += 0.1;
    if (sessionData.focus_areas?.length) confidence += 0.1;
    if (sessionData.drills?.length) confidence += 0.1;
    if (sessionData.physical_data) confidence += 0.05;
    if (sessionData.mental_data) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  private suggestPrivacyLevel(sessionData: SessionFormValues): 'private' | 'friends' | 'public' | 'coaches' | 'public_highlights' {
    // Suggest coaches if coaches are involved
    if (sessionData.coach_ids?.length) {
      return 'coaches';
    }
    
    // For new users or users with limited social graph, suggest public_highlights
    // This will be determined by the PostComposer based on followingCount
    return 'public_highlights';
  }

  async saveGeneratedPost(
    suggestion: PostSuggestion,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: suggestion.content,
          privacy_level: suggestion.privacyLevel,
          template_id: suggestion.template.id,
          is_auto_generated: true,
          engagement_score: Math.floor(suggestion.confidence * 10)
        });

      if (error) throw error;
      
      console.log('✅ Auto-generated post saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error saving auto-generated post:', error);
      return false;
    }
  }
}
