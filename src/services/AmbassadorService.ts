
import { supabase } from '@/integrations/supabase/client';
import { PostTemplate } from '@/types/post';
import { AutoPostService } from './AutoPostService';

export interface AmbassadorPersona {
  id: string;
  profile: {
    full_name: string;
    username: string;
    bio: string;
    skill_level: string;
    user_type: 'player' | 'coach';
    experience_level: string;
    playing_style: string;
    location_name: string;
    avatar_url?: string;
  };
  posting_schedule: {
    frequency: number; // posts per week
    preferred_times: string[]; // time slots for posting
    content_mix: {
      workout: number;
      progress: number;
      motivation: number;
      technique: number;
      match: number;
    };
  };
  content_library: {
    achievements: string[];
    challenges: string[];
    focus_areas: string[];
    motivational_phrases: string[];
    technical_tips: string[];
  };
}

export class AmbassadorService {
  private static instance: AmbassadorService;
  private ambassadorPersonas: AmbassadorPersona[] = [];

  static getInstance(): AmbassadorService {
    if (!this.instance) {
      this.instance = new AmbassadorService();
    }
    return this.instance;
  }

  constructor() {
    this.initializeAmbassadorPersonas();
  }

  private initializeAmbassadorPersonas() {
    this.ambassadorPersonas = [
      {
        id: 'ambassador_1',
        profile: {
          full_name: 'Emma Rodriguez',
          username: 'emma_tennis_journey',
          bio: '🎾 Beginner passionate about improving every day | Sharing my tennis learning adventure',
          skill_level: 'beginner',
          user_type: 'player',
          experience_level: 'beginner',
          playing_style: 'baseline',
          location_name: 'Austin, TX'
        },
        posting_schedule: {
          frequency: 3,
          preferred_times: ['09:00', '15:00', '19:00'],
          content_mix: { workout: 30, progress: 25, motivation: 25, technique: 15, match: 5 }
        },
        content_library: {
          achievements: ['hit my first consistent backhand', 'completed a full practice session', 'learned proper grip'],
          challenges: ['working on consistency', 'improving footwork', 'building endurance'],
          focus_areas: ['basic strokes', 'court positioning', 'fitness'],
          motivational_phrases: ['every practice counts', 'small steps lead to big improvements', 'loving this journey'],
          technical_tips: ['focusing on follow-through', 'watching the ball', 'staying relaxed']
        }
      },
      {
        id: 'ambassador_2',
        profile: {
          full_name: 'Marcus Chen',
          username: 'marcus_tennis_coach',
          bio: '🏆 Tennis Coach | 15+ years experience | Helping players reach their potential',
          skill_level: 'advanced',
          user_type: 'coach',
          experience_level: 'expert',
          playing_style: 'all-court',
          location_name: 'San Francisco, CA'
        },
        posting_schedule: {
          frequency: 4,
          preferred_times: ['07:00', '12:00', '17:00', '20:00'],
          content_mix: { workout: 20, progress: 15, motivation: 20, technique: 35, match: 10 }
        },
        content_library: {
          achievements: ['helped student win first tournament', 'perfected training methodology', 'coached advanced players'],
          challenges: ['developing new drills', 'adapting to different learning styles', 'injury prevention'],
          focus_areas: ['technique refinement', 'mental game', 'tactical awareness'],
          motivational_phrases: ['technique is everything', 'mental strength wins matches', 'practice with purpose'],
          technical_tips: ['contact point consistency', 'shot selection', 'court geometry']
        }
      },
      {
        id: 'ambassador_3',
        profile: {
          full_name: 'Sofia Martinez',
          username: 'sofia_intermediate',
          bio: '🎾 Intermediate player | Weekend warrior | Tournament dreams ✨',
          skill_level: 'intermediate',
          user_type: 'player',
          experience_level: 'intermediate',
          playing_style: 'aggressive_baseline',
          location_name: 'Miami, FL'
        },
        posting_schedule: {
          frequency: 3,
          preferred_times: ['08:00', '14:00', '18:00'],
          content_mix: { workout: 25, progress: 20, motivation: 20, technique: 20, match: 15 }
        },
        content_library: {
          achievements: ['won club tournament', 'improved serve speed', 'consistent topspin'],
          challenges: ['working on net game', 'mental toughness', 'shot placement'],
          focus_areas: ['volleys', 'serve and volley', 'match strategy'],
          motivational_phrases: ['pushing my limits', 'every point matters', 'growing stronger'],
          technical_tips: ['split step timing', 'approach shot angles', 'return positioning']
        }
      },
      {
        id: 'ambassador_4',
        profile: {
          full_name: 'Jake Thompson',
          username: 'jake_tennis_fitness',
          bio: '💪 Fitness-focused tennis player | Combining strength training with court work',
          skill_level: 'intermediate',
          user_type: 'player',
          experience_level: 'intermediate',
          playing_style: 'power_baseline',
          location_name: 'Denver, CO'
        },
        posting_schedule: {
          frequency: 3,
          preferred_times: ['06:00', '13:00', '19:00'],
          content_mix: { workout: 40, progress: 20, motivation: 20, technique: 15, match: 5 }
        },
        content_library: {
          achievements: ['increased serve power', 'improved court endurance', 'better recovery time'],
          challenges: ['balancing strength and agility', 'injury prevention', 'explosive movement'],
          focus_areas: ['fitness training', 'power development', 'injury prevention'],
          motivational_phrases: ['stronger on and off court', 'fitness is foundation', 'power meets precision'],
          technical_tips: ['core stability', 'explosive first step', 'recovery between points']
        }
      },
      {
        id: 'ambassador_5',
        profile: {
          full_name: 'Rachel Kim',
          username: 'rachel_tennis_mom',
          bio: '👩‍👧‍👦 Tennis mom learning alongside my kids | Proving it\'s never too late to start',
          skill_level: 'beginner',
          user_type: 'player',
          experience_level: 'beginner',
          playing_style: 'baseline',
          location_name: 'Seattle, WA'
        },
        posting_schedule: {
          frequency: 2,
          preferred_times: ['10:00', '16:00'],
          content_mix: { workout: 20, progress: 30, motivation: 30, technique: 15, match: 5 }
        },
        content_library: {
          achievements: ['first rally with my daughter', 'learned basic scoring', 'made it through full lesson'],
          challenges: ['finding practice time', 'learning fundamentals', 'building confidence'],
          focus_areas: ['basic technique', 'family tennis time', 'building confidence'],
          motivational_phrases: ['never too late to learn', 'family tennis is the best', 'progress over perfection'],
          technical_tips: ['keep it simple', 'watch and learn', 'enjoy the process']
        }
      },
      {
        id: 'ambassador_6',
        profile: {
          full_name: 'Alex Rivera',
          username: 'alex_college_tennis',
          bio: '🎓 College tennis player | Balancing academics and athletics | Future pro dreams',
          skill_level: 'advanced',
          user_type: 'player',
          experience_level: 'advanced',
          playing_style: 'all-court',
          location_name: 'Stanford, CA'
        },
        posting_schedule: {
          frequency: 4,
          preferred_times: ['07:00', '11:00', '15:00', '21:00'],
          content_mix: { workout: 25, progress: 20, motivation: 15, technique: 25, match: 15 }
        },
        content_library: {
          achievements: ['made varsity team', 'won conference match', 'improved ranking'],
          challenges: ['balancing studies and tennis', 'competitive pressure', 'physical demands'],
          focus_areas: ['match preparation', 'mental toughness', 'technique refinement'],
          motivational_phrases: ['dream big, work harder', 'every practice matters', 'champions are made daily'],
          technical_tips: ['point construction', 'pressure situations', 'tactical adjustments']
        }
      }
    ];
  }

  async createAmbassadorProfiles(): Promise<boolean> {
    try {
      console.log('🤖 Creating ambassador profiles...');
      
      for (const persona of this.ambassadorPersonas) {
        // Check if ambassador already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', persona.profile.username)
          .single();

        if (existingProfile) {
          console.log(`Ambassador ${persona.profile.username} already exists, skipping...`);
          continue;
        }

        // Create profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            full_name: persona.profile.full_name,
            username: persona.profile.username,
            bio: persona.profile.bio,
            user_type: persona.profile.user_type,
            experience_level: persona.profile.experience_level,
            playing_style: persona.profile.playing_style,
            location_name: persona.profile.location_name,
            skill_level: persona.profile.skill_level
          }])
          .select()
          .single();

        if (profileError) {
          console.error(`Error creating profile for ${persona.profile.username}:`, profileError);
          continue;
        }

        // Create ambassador profile
        const { error: ambassadorError } = await supabase
          .from('ambassador_profiles')
          .insert([{
            profile_id: profile.id,
            skill_level: persona.profile.skill_level,
            specialization: persona.content_library.focus_areas,
            posting_schedule: persona.posting_schedule
          }]);

        if (ambassadorError) {
          console.error(`Error creating ambassador profile for ${persona.profile.username}:`, ambassadorError);
          continue;
        }

        console.log(`✅ Created ambassador: ${persona.profile.username}`);
      }

      return true;
    } catch (error) {
      console.error('❌ Error creating ambassador profiles:', error);
      return false;
    }
  }

  async generateAmbassadorContent(ambassadorId: string): Promise<string> {
    const persona = this.ambassadorPersonas.find(p => p.id === ambassadorId);
    if (!persona) return '';

    const contentTypes = Object.keys(persona.posting_schedule.content_mix);
    const weights = Object.values(persona.posting_schedule.content_mix);
    
    // Weighted random selection
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    let currentWeight = 0;
    let selectedType = contentTypes[0];
    
    for (let i = 0; i < contentTypes.length; i++) {
      currentWeight += weights[i];
      if (random <= currentWeight) {
        selectedType = contentTypes[i];
        break;
      }
    }

    return this.generateContentByType(persona, selectedType);
  }

  private generateContentByType(persona: AmbassadorPersona, contentType: string): string {
    const { content_library } = persona;
    
    const templates = {
      workout: [
        `Great training session today! {achievement} and feeling {motivation}. {technical_tip} 💪`,
        `Focused on {focus_area} during practice. {achievement} - {motivation}! 🎾`,
        `Another step forward in my tennis journey. {achievement} while {challenge}. {motivation}! ✨`
      ],
      progress: [
        `Proud moment: {achievement}! Been {challenge} and it's paying off. {motivation} 📈`,
        `Progress update: {achievement}. Still {challenge} but {motivation}. Keep going! 🚀`,
        `Celebrating small wins: {achievement}. {focus_area} is really improving. {motivation}! 🎉`
      ],
      motivation: [
        `Tennis reminder: {motivation}. Whether you're {challenge} or celebrating victories, keep pushing! 💫`,
        `{motivation}! Today's focus: {focus_area}. Let's make it count! 🔥`,
        `Monday motivation: {motivation}. Remember, {technical_tip}. Let's do this! ⚡`
      ],
      technique: [
        `Technique tip: {technical_tip}. Been working on this while {challenge}. {motivation}! 🎯`,
        `Focus on {focus_area}: {technical_tip}. {achievement} when I applied this. Try it! 📚`,
        `Technical breakthrough: {achievement} by focusing on {technical_tip}. {motivation}! 🔧`
      ],
      match: [
        `Match day reflections: {achievement} but still {challenge}. {motivation} for next time! 🏆`,
        `Post-match analysis: {technical_tip} was key today. {achievement} and learned a lot! 📝`,
        `Competitive tennis: {achievement} during today's match. {focus_area} needs work but {motivation}! ⚔️`
      ]
    };

    const contentTemplates = templates[contentType] || templates.workout;
    const template = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];
    
    return template
      .replace(/{achievement}/g, this.getRandomItem(content_library.achievements))
      .replace(/{challenge}/g, this.getRandomItem(content_library.challenges))
      .replace(/{focus_area}/g, this.getRandomItem(content_library.focus_areas))
      .replace(/{motivation}/g, this.getRandomItem(content_library.motivational_phrases))
      .replace(/{technical_tip}/g, this.getRandomItem(content_library.technical_tips));
  }

  private getRandomItem(array: string[]): string {
    return array[Math.floor(Math.random() * array.length)];
  }

  async scheduleAmbassadorPosts(): Promise<void> {
    try {
      console.log('📅 Scheduling ambassador posts...');
      
      // Get all ambassador profiles
      const { data: ambassadors, error } = await supabase
        .from('ambassador_profiles')
        .select(`
          *,
          profiles:profile_id (*)
        `)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching ambassadors:', error);
        return;
      }

      for (const ambassador of ambassadors || []) {
        const persona = this.ambassadorPersonas.find(p => 
          p.profile.username === ambassador.profiles?.username
        );
        
        if (!persona) continue;

        // Generate content for this week
        const postsToCreate = persona.posting_schedule.frequency;
        
        for (let i = 0; i < postsToCreate; i++) {
          const content = await this.generateAmbassadorContent(persona.id);
          
          // Schedule post creation (in a real app, this would use a job queue)
          setTimeout(async () => {
            await this.createAmbassadorPost(ambassador.profile_id, content);
          }, i * 24 * 60 * 60 * 1000 / postsToCreate); // Spread posts throughout the week
        }
      }
      
      console.log('✅ Ambassador posts scheduled successfully');
    } catch (error) {
      console.error('❌ Error scheduling ambassador posts:', error);
    }
  }

  private async createAmbassadorPost(profileId: string, content: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('posts')
        .insert([{
          user_id: profileId,
          content,
          privacy_level: 'public',
          is_auto_generated: true,
          engagement_score: Math.floor(Math.random() * 10) + 5 // Random score 5-15
        }]);

      if (error) {
        console.error('Error creating ambassador post:', error);
      } else {
        console.log(`📝 Created ambassador post: ${content.substring(0, 50)}...`);
      }
    } catch (error) {
      console.error('Error in createAmbassadorPost:', error);
    }
  }

  getAmbassadorPersonas(): AmbassadorPersona[] {
    return this.ambassadorPersonas;
  }
}
