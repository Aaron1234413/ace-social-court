
import { supabase } from '@/integrations/supabase/client';

export interface AmbassadorProfile {
  id: string;
  full_name: string;
  user_type: 'ambassador';
  skill_level: string;
  bio: string;
  avatar_url?: string;
}

export interface AmbassadorPost {
  content: string;
  privacy_level: 'public_highlights';
  is_ambassador_content: boolean;
  template_id?: string;
}

export class AmbassadorSeedingService {
  private static ambassadorProfiles: AmbassadorProfile[] = [
    {
      id: 'amb_1',
      full_name: 'Sarah Chen',
      user_type: 'ambassador',
      skill_level: '4.5',
      bio: 'Former college player, now helping others improve their game',
      avatar_url: undefined
    },
    {
      id: 'amb_2', 
      full_name: 'Marcus Rodriguez',
      user_type: 'ambassador',
      skill_level: '5.0',
      bio: 'Professional coach with 15 years experience',
      avatar_url: undefined
    },
    {
      id: 'amb_3',
      full_name: 'Emma Thompson',
      user_type: 'ambassador',
      skill_level: '4.0',
      bio: 'Weekend warrior sharing the tennis journey',
      avatar_url: undefined
    },
    {
      id: 'amb_4',
      full_name: 'James Wilson',
      user_type: 'ambassador',
      skill_level: '3.5',
      bio: 'Beginner-friendly tips and encouragement',
      avatar_url: undefined
    },
    {
      id: 'amb_5',
      full_name: 'Lisa Park',
      user_type: 'ambassador',
      skill_level: '4.5',
      bio: 'Fitness enthusiast focusing on tennis conditioning',
      avatar_url: undefined
    }
  ];

  private static ambassadorPosts: { [ambassadorId: string]: AmbassadorPost[] } = {
    amb_1: [
      { content: "Just finished a great practice session! Remember: consistency beats power every time. Focus on getting 7/10 balls in before adding pace. 🎾", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Pro tip: When practicing your serve, aim for the service box corners. Start with 50% power and gradually increase as your accuracy improves.", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Mental game reminder: Every point is a new opportunity. Don't let the last point affect the next one. Stay present! 🧠", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Working on footwork today. Quick feet = better positioning = cleaner shots. Ladder drills aren't just for pros!", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Backhand breakthrough moment! Sometimes slowing down helps you speed up. Take time to feel the proper contact point.", privacy_level: 'public_highlights', is_ambassador_content: true }
    ],
    amb_2: [
      { content: "Coach's corner: The split step is your foundation. Watch the pros - they're never flat-footed when the opponent makes contact.", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Teaching a junior today reminded me: tennis is 90% mental. Technique gets you far, but mental toughness wins matches.", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Video analysis session today. Amazing how much players improve when they see their own technique. Record yourself if possible!", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Return of serve tip: Stand closer than you think. Most recreational players stand too far back. Attack that second serve! 💪", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Doubles strategy: 90% of points are won at the net. Work on your volleys and approach shots. The baseline is for singles!", privacy_level: 'public_highlights', is_ambassador_content: true }
    ],
    amb_3: [
      { content: "Saturday morning match complete! Lost 6-4, 7-5 but played my best tennis in months. Progress isn't always about winning 🌟", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Finally mastered the kick serve! Took 6 months of practice but now I have a reliable second serve. Persistence pays off!", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Playing in the rain taught me so much about adapting my game. Sometimes conditions force you to discover new strengths.", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Tennis lesson: Don't try to hit winners on every shot. Build the point, wait for the right opportunity. Patience is power!", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Mixed doubles tonight! Love how tennis brings people together. Met some amazing players and made new friends 🤝", privacy_level: 'public_highlights', is_ambassador_content: true }
    ],
    amb_4: [
      { content: "First time breaking serve in a match! 🎉 Remember fellow beginners: every small victory counts. Celebrate your progress!", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Beginner tip: Don't worry about power yet. Focus on getting the ball over the net and in the court. Consistency first!", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Had my first tennis lesson last week. Coach says I'm gripping too tightly. Relaxed grip = better feel. Who knew? 🤔", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Practice partner tip: Find someone slightly better than you. They'll push you to improve without being overwhelming.", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Learning tennis at 35 - it's never too late! Yes, kids pick it up faster, but adults can learn too. Keep at it! 💪", privacy_level: 'public_highlights', is_ambassador_content: true }
    ],
    amb_5: [
      { content: "Tennis conditioning day! 30 minutes of court movement drills. Your legs are your engine - keep them strong! 🏃‍♀️", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Recovery day is just as important as training day. Tennis is demanding on your body - listen to it and rest when needed.", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Core workout complete! Strong abs = better rotation = more power. Planks and Russian twists are your friends 💪", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Stretching routine post-tennis: Hip flexors, calves, and shoulders need the most attention. 10 minutes now saves injury later.", privacy_level: 'public_highlights', is_ambassador_content: true },
      { content: "Hydration reminder: 16oz of water 2 hours before playing, 8oz every 15-20 minutes during play. Your performance depends on it! 💧", privacy_level: 'public_highlights', is_ambassador_content: true }
    ]
  };

  static async checkAndSeedAmbassadors(): Promise<void> {
    try {
      console.log('🌱 Checking ambassador seeding status...');
      
      // Check if ambassadors already exist
      const { data: existingAmbassadors, error: checkError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('user_type', 'ambassador');

      if (checkError) {
        console.error('Error checking ambassadors:', checkError);
        return;
      }

      if (existingAmbassadors && existingAmbassadors.length > 0) {
        console.log('✅ Ambassadors already seeded:', existingAmbassadors.length);
        return;
      }

      // Seed ambassador profiles and posts
      await this.seedAmbassadorProfiles();
      await this.seedAmbassadorPosts();
      
      console.log('🎉 Ambassador seeding completed successfully!');
      
    } catch (error) {
      console.error('❌ Ambassador seeding failed:', error);
    }
  }

  private static async seedAmbassadorProfiles(): Promise<void> {
    console.log('👥 Seeding ambassador profiles...');
    
    for (const ambassador of this.ambassadorProfiles) {
      // Create auth user first (in a real app this would be handled differently)
      const email = `${ambassador.id}@rallytennis.app`;
      const password = 'RallyAmbassador2024!';
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: ambassador.full_name,
            user_type: 'ambassador'
          }
        }
      });

      if (authError && !authError.message.includes('already registered')) {
        console.error('Auth error for ambassador:', ambassador.full_name, authError);
        continue;
      }

      // Update or create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user?.id || ambassador.id,
          full_name: ambassador.full_name,
          user_type: 'ambassador' as any,
          skill_level: ambassador.skill_level,
          bio: ambassador.bio,
          avatar_url: ambassador.avatar_url,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile error for ambassador:', ambassador.full_name, profileError);
      } else {
        console.log('✅ Seeded ambassador profile:', ambassador.full_name);
      }
    }
  }

  private static async seedAmbassadorPosts(): Promise<void> {
    console.log('📝 Seeding ambassador posts...');
    
    // Get ambassador profiles from database
    const { data: ambassadors, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('user_type', 'ambassador');

    if (error || !ambassadors) {
      console.error('Could not fetch ambassadors for post seeding:', error);
      return;
    }

    const now = new Date();
    
    for (const ambassador of ambassadors) {
      const ambassadorKey = Object.keys(this.ambassadorPosts)[Math.floor(Math.random() * Object.keys(this.ambassadorPosts).length)];
      const posts = this.ambassadorPosts[ambassadorKey] || this.ambassadorPosts.amb_1;
      
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        // Spread posts over the last 7 days
        const postDate = new Date(now);
        postDate.setDate(postDate.getDate() - Math.floor(i * 1.5));
        
        const { error: postError } = await supabase
          .from('posts')
          .insert({
            user_id: ambassador.id,
            content: post.content,
            privacy_level: post.privacy_level as any,
            is_ambassador_content: post.is_ambassador_content,
            created_at: postDate.toISOString(),
            engagement_score: Math.floor(Math.random() * 50) + 10 // Random engagement 10-60
          });

        if (postError) {
          console.error('Post error for ambassador:', ambassador.full_name, postError);
        }
      }
      
      console.log(`✅ Seeded posts for ambassador: ${ambassador.full_name}`);
    }
  }

  static async getAmbassadorFallbackPosts(limit: number = 8): Promise<any[]> {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          media_url,
          media_type,
          privacy_level,
          is_ambassador_content,
          engagement_score,
          profiles!posts_user_id_fkey (
            full_name,
            user_type,
            avatar_url
          )
        `)
        .eq('is_ambassador_content', true)
        .eq('privacy_level', 'public_highlights')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching ambassador posts:', error);
        return [];
      }

      return posts?.map(post => ({
        ...post,
        author: post.profiles ? {
          full_name: post.profiles.full_name,
          user_type: post.profiles.user_type,
          avatar_url: post.profiles.avatar_url
        } : null
      })) || [];
      
    } catch (error) {
      console.error('Ambassador fallback query failed:', error);
      return [];
    }
  }
}
