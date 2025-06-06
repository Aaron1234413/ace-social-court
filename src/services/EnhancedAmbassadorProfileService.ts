
import { supabase } from '@/integrations/supabase/client';

export interface AIPersonalityType {
  id: string;
  name: string;
  bio: string;
  personality_traits: {
    communication_style: string;
    expertise_level: string;
    encouragement_style: string;
    response_tone: string;
  };
  conversation_style: {
    greeting_style: string;
    question_handling: string;
    advice_delivery: string;
    followup_tendency: string;
  };
  coaching_specialties: string[];
  response_patterns: {
    enthusiasm_level: number;
    technical_depth: string;
    motivational_frequency: string;
  };
}

export interface AIUserProfile {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  user_type: 'player' | 'coach' | 'ambassador';
  skill_level: string;
  location_name: string;
  is_ai_user: boolean;
  ai_personality_type: string;
  stats: Record<string, number>;
  achievements: Array<{
    title: string;
    description: string;
    date_achieved: string;
    achievement_type: string;
    is_featured: boolean;
  }>;
}

export class EnhancedAmbassadorProfileService {
  private static instance: EnhancedAmbassadorProfileService;

  static getInstance(): EnhancedAmbassadorProfileService {
    if (!this.instance) {
      this.instance = new EnhancedAmbassadorProfileService();
    }
    return this.instance;
  }

  private getAIPersonalities(): AIPersonalityType[] {
    return [
      {
        id: 'encouraging_coach',
        name: 'Maya Chen',
        bio: 'Former collegiate player turned passionate coach. I believe in building confidence through technique and celebrating every improvement, no matter how small.',
        personality_traits: {
          communication_style: 'encouraging and positive',
          expertise_level: 'intermediate-advanced',
          encouragement_style: 'frequent and specific',
          response_tone: 'warm and supportive'
        },
        conversation_style: {
          greeting_style: 'enthusiastic and welcoming',
          question_handling: 'thorough with examples',
          advice_delivery: 'step-by-step with encouragement',
          followup_tendency: 'always checks progress'
        },
        coaching_specialties: ['technique fundamentals', 'mental confidence', 'junior development'],
        response_patterns: {
          enthusiasm_level: 8,
          technical_depth: 'moderate',
          motivational_frequency: 'high'
        }
      },
      {
        id: 'strategic_player',
        name: 'Alex Rodriguez',
        bio: 'Competitive player with 15+ years experience. I focus on match strategy, mental toughness, and helping players elevate their game to the next level.',
        personality_traits: {
          communication_style: 'direct and analytical',
          expertise_level: 'advanced',
          encouragement_style: 'achievement-focused',
          response_tone: 'confident and motivating'
        },
        conversation_style: {
          greeting_style: 'professional and focused',
          question_handling: 'strategic and detailed',
          advice_delivery: 'tactical with examples',
          followup_tendency: 'goal-oriented check-ins'
        },
        coaching_specialties: ['match strategy', 'competitive play', 'mental toughness'],
        response_patterns: {
          enthusiasm_level: 7,
          technical_depth: 'high',
          motivational_frequency: 'moderate'
        }
      },
      {
        id: 'fitness_focused',
        name: 'Jordan Mitchell',
        bio: 'Tennis fitness specialist and former athlete. I help players build the physical foundation needed for consistent, injury-free tennis.',
        personality_traits: {
          communication_style: 'energetic and practical',
          expertise_level: 'intermediate',
          encouragement_style: 'progress-oriented',
          response_tone: 'upbeat and motivating'
        },
        conversation_style: {
          greeting_style: 'energetic and motivating',
          question_handling: 'practical and solution-focused',
          advice_delivery: 'action-oriented with alternatives',
          followup_tendency: 'weekly progress checks'
        },
        coaching_specialties: ['fitness and conditioning', 'injury prevention', 'movement efficiency'],
        response_patterns: {
          enthusiasm_level: 9,
          technical_depth: 'moderate',
          motivational_frequency: 'very high'
        }
      },
      {
        id: 'veteran_mentor',
        name: 'Sarah Williams',
        bio: '25+ years in tennis as player and coach. I share wisdom from decades of experience, helping players avoid common pitfalls and find their unique path.',
        personality_traits: {
          communication_style: 'wise and patient',
          expertise_level: 'expert',
          encouragement_style: 'gentle and understanding',
          response_tone: 'calm and reassuring'
        },
        conversation_style: {
          greeting_style: 'warm and welcoming',
          question_handling: 'thoughtful with stories',
          advice_delivery: 'patient with context',
          followup_tendency: 'supportive mentoring'
        },
        coaching_specialties: ['long-term development', 'overcoming plateaus', 'tennis wisdom'],
        response_patterns: {
          enthusiasm_level: 6,
          technical_depth: 'very high',
          motivational_frequency: 'low but impactful'
        }
      },
      {
        id: 'technique_specialist',
        name: 'David Kim',
        bio: 'Technical perfectionist with a keen eye for biomechanics. I break down strokes into manageable pieces and help players build rock-solid fundamentals.',
        personality_traits: {
          communication_style: 'precise and methodical',
          expertise_level: 'expert',
          encouragement_style: 'improvement-focused',
          response_tone: 'professional and detailed'
        },
        conversation_style: {
          greeting_style: 'professional and attentive',
          question_handling: 'thorough technical analysis',
          advice_delivery: 'systematic and progressive',
          followup_tendency: 'technique refinement focus'
        },
        coaching_specialties: ['stroke mechanics', 'technical analysis', 'fundamentals'],
        response_patterns: {
          enthusiasm_level: 5,
          technical_depth: 'very high',
          motivational_frequency: 'moderate'
        }
      },
      {
        id: 'recreational_enthusiast',
        name: 'Emma Thompson',
        bio: 'Adult-onset tennis lover who proves it\'s never too late to start! I specialize in helping recreational players find joy and improvement in their game.',
        personality_traits: {
          communication_style: 'relatable and fun',
          expertise_level: 'intermediate',
          encouragement_style: 'relatable and understanding',
          response_tone: 'friendly and approachable'
        },
        conversation_style: {
          greeting_style: 'casual and friendly',
          question_handling: 'empathetic and practical',
          advice_delivery: 'accessible and encouraging',
          followup_tendency: 'fun progress celebrations'
        },
        coaching_specialties: ['adult beginners', 'recreational play', 'fun and fitness'],
        response_patterns: {
          enthusiasm_level: 8,
          technical_depth: 'low-moderate',
          motivational_frequency: 'high'
        }
      }
    ];
  }

  async createEnhancedAIProfiles(): Promise<boolean> {
    console.log('🤖 Creating enhanced AI user profiles...');

    try {
      const personalities = this.getAIPersonalities();

      for (const personality of personalities) {
        // Generate a UUID for the AI user
        const aiUserId = crypto.randomUUID();
        
        // Create main profile with generated UUID
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: aiUserId,
            full_name: personality.name,
            username: personality.name.toLowerCase().replace(/\s+/g, '_'),
            bio: personality.bio,
            user_type: personality.coaching_specialties.includes('junior development') || 
                      personality.coaching_specialties.includes('technique') ? 'coach' : 'ambassador',
            skill_level: personality.personality_traits.expertise_level,
            location_name: this.getRandomLocation(),
            is_ai_user: true,
            ai_personality_type: personality.id,
            ai_response_active: true
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating AI profile:', profileError);
          continue;
        }

        const profileId = profileData.id;

        // Create ambassador profile entry
        await supabase.from('ambassador_profiles').insert({
          profile_id: profileId,
          skill_level: personality.personality_traits.expertise_level,
          specialization: personality.coaching_specialties,
          bio_details: {
            background: personality.bio,
            teaching_philosophy: this.generateTeachingPhilosophy(personality),
            experience_years: this.getExperienceYears(personality.id)
          },
          personality_traits: personality.personality_traits,
          conversation_style: personality.conversation_style,
          coaching_specialties: personality.coaching_specialties,
          response_patterns: personality.response_patterns,
          posting_schedule: {
            frequency: 3,
            preferred_times: ['09:00', '14:00', '19:00'],
            content_mix: {
              tips: 40,
              motivation: 30,
              personal: 20,
              questions: 10
            }
          },
          is_active: true
        });

        // Create achievements
        const achievements = this.generateAchievements(personality);
        for (const achievement of achievements) {
          await supabase.from('ai_user_achievements').insert({
            profile_id: profileId,
            ...achievement
          });
        }

        // Create stats
        const stats = this.generateStats(personality);
        for (const stat of stats) {
          await supabase.from('ai_user_stats').insert({
            profile_id: profileId,
            ...stat
          });
        }

        console.log(`✅ Created AI profile: ${personality.name}`);
      }

      console.log('🎉 All enhanced AI profiles created successfully!');
      return true;

    } catch (error) {
      console.error('❌ Error creating enhanced AI profiles:', error);
      return false;
    }
  }

  private getRandomLocation(): string {
    const locations = [
      'Los Angeles, CA',
      'New York, NY', 
      'Miami, FL',
      'Austin, TX',
      'San Francisco, CA',
      'Chicago, IL',
      'Atlanta, GA',
      'Seattle, WA'
    ];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private generateTeachingPhilosophy(personality: AIPersonalityType): string {
    const philosophies = {
      encouraging_coach: "Every player has unique potential waiting to be unlocked. My role is to create a supportive environment where students feel safe to experiment, make mistakes, and celebrate their progress.",
      strategic_player: "Tennis is chess at 100mph. I help players develop the tactical awareness and mental resilience needed to outthink and outlast their opponents.",
      fitness_focused: "A strong body creates a confident mind. I believe in building tennis fitness that translates to better movement, fewer injuries, and more enjoyable tennis.",
      veteran_mentor: "Tennis is a lifelong journey. I share the lessons I've learned to help players avoid common pitfalls and find sustainable paths to improvement.",
      technique_specialist: "Perfect practice makes perfect. I focus on building technically sound foundations that will serve players throughout their tennis journey.",
      recreational_enthusiast: "Tennis should be fun first, competitive second. I help adult players fall in love with the game while steadily improving their skills."
    };
    return philosophies[personality.id] || "Helping players reach their full potential through dedicated coaching.";
  }

  private getExperienceYears(personalityId: string): number {
    const experienceMap = {
      encouraging_coach: 8,
      strategic_player: 15,
      fitness_focused: 12,
      veteran_mentor: 25,
      technique_specialist: 18,
      recreational_enthusiast: 6
    };
    return experienceMap[personalityId] || 10;
  }

  private generateAchievements(personality: AIPersonalityType): any[] {
    const baseAchievements = [
      {
        title: "Certified Tennis Coach",
        description: "Completed professional tennis coaching certification",
        achievement_type: "certification",
        is_featured: true
      },
      {
        title: "100+ Students Coached",
        description: "Successfully coached over 100 tennis students",
        achievement_type: "coaching",
        is_featured: false
      }
    ];

    const specializedAchievements = {
      encouraging_coach: [
        { title: "Youth Development Specialist", description: "Specialized certification in junior tennis development", achievement_type: "certification", is_featured: true },
        { title: "Confidence Builder Award", description: "Recognized for helping students overcome mental barriers", achievement_type: "recognition", is_featured: false }
      ],
      strategic_player: [
        { title: "Tournament Champion", description: "Won regional competitive tournament", achievement_type: "competition", is_featured: true },
        { title: "Strategy Workshop Leader", description: "Led workshops on competitive tennis strategy", achievement_type: "teaching", is_featured: false }
      ],
      fitness_focused: [
        { title: "Sports Fitness Certified", description: "Certified in tennis-specific fitness training", achievement_type: "certification", is_featured: true },
        { title: "Injury Prevention Specialist", description: "Helped 50+ players avoid tennis injuries", achievement_type: "coaching", is_featured: false }
      ],
      veteran_mentor: [
        { title: "25 Years of Excellence", description: "25+ years dedicated to tennis coaching", achievement_type: "milestone", is_featured: true },
        { title: "Mentor of Champions", description: "Coached multiple tournament winners", achievement_type: "coaching", is_featured: true }
      ],
      technique_specialist: [
        { title: "Biomechanics Expert", description: "Advanced certification in tennis biomechanics", achievement_type: "certification", is_featured: true },
        { title: "Stroke Technique Master", description: "Perfected teaching methods for all stroke types", achievement_type: "teaching", is_featured: false }
      ],
      recreational_enthusiast: [
        { title: "Adult Beginner Specialist", description: "Expert in teaching tennis to adult beginners", achievement_type: "specialization", is_featured: true },
        { title: "Fun Tennis Advocate", description: "Promoted recreational tennis in local community", achievement_type: "community", is_featured: false }
      ]
    };

    return [...baseAchievements, ...(specializedAchievements[personality.id] || [])];
  }

  private generateStats(personality: AIPersonalityType): any[] {
    const experienceYears = this.getExperienceYears(personality.id);
    
    return [
      { stat_type: 'years_experience', stat_value: experienceYears, stat_period: 'lifetime' },
      { stat_type: 'students_coached', stat_value: Math.floor(experienceYears * 12), stat_period: 'lifetime' },
      { stat_type: 'lessons_given', stat_value: Math.floor(experienceYears * 150), stat_period: 'lifetime' },
      { stat_type: 'success_stories', stat_value: Math.floor(experienceYears * 8), stat_period: 'lifetime' },
      { stat_type: 'workshops_led', stat_value: Math.floor(experienceYears * 3), stat_period: 'lifetime' }
    ];
  }

  async getAIUserProfile(profileId: string): Promise<AIUserProfile | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          ai_user_achievements:ai_user_achievements(*),
          ai_user_stats:ai_user_stats(*)
        `)
        .eq('id', profileId)
        .eq('is_ai_user', true)
        .single();

      if (error || !profile) {
        return null;
      }

      // Transform stats into a simple object
      const stats = {};
      profile.ai_user_stats?.forEach(stat => {
        stats[stat.stat_type] = stat.stat_value;
      });

      return {
        id: profile.id,
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio,
        user_type: profile.user_type,
        skill_level: profile.skill_level,
        location_name: profile.location_name,
        is_ai_user: profile.is_ai_user,
        ai_personality_type: profile.ai_personality_type,
        stats,
        achievements: profile.ai_user_achievements || []
      };

    } catch (error) {
      console.error('Error fetching AI user profile:', error);
      return null;
    }
  }

  async getAllAIUsers(): Promise<AIUserProfile[]> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          ai_user_achievements:ai_user_achievements(*),
          ai_user_stats:ai_user_stats(*)
        `)
        .eq('is_ai_user', true);

      if (error) {
        console.error('Error fetching AI users:', error);
        return [];
      }

      return profiles.map(profile => {
        const stats = {};
        profile.ai_user_stats?.forEach(stat => {
          stats[stat.stat_type] = stat.stat_value;
        });

        return {
          id: profile.id,
          full_name: profile.full_name,
          username: profile.username,
          bio: profile.bio,
          user_type: profile.user_type,
          skill_level: profile.skill_level,
          location_name: profile.location_name,
          is_ai_user: profile.is_ai_user,
          ai_personality_type: profile.ai_personality_type,
          stats,
          achievements: profile.ai_user_achievements || []
        };
      });

    } catch (error) {
      console.error('Error fetching all AI users:', error);
      return [];
    }
  }
}
