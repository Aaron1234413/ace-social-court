
import { supabase } from '@/integrations/supabase/client';
import { ConversationalContentEngine, ConversationalPost } from './ConversationalContentEngine';

export interface AmbassadorInteraction {
  id: string;
  ambassador_id: string;
  target_post_id: string;
  target_user_id: string;
  interaction_type: 'comment' | 'reaction' | 'encouragement';
  content: string;
  created_at: string;
}

export class AmbassadorContentManager {
  private static instance: AmbassadorContentManager;
  private contentEngine: ConversationalContentEngine;
  private interactionQueue: AmbassadorInteraction[] = [];

  static getInstance(): AmbassadorContentManager {
    if (!this.instance) {
      this.instance = new AmbassadorContentManager();
    }
    return this.instance;
  }

  constructor() {
    this.contentEngine = ConversationalContentEngine.getInstance();
  }

  async seedInitialAmbassadorPosts(): Promise<void> {
    try {
      console.log('🌱 Seeding initial Ambassador posts...');
      
      // Generate 200-300 Ambassador posts across different weeks
      const totalPosts = 250;
      const weeksToSeed = 8;
      const postsPerWeek = Math.floor(totalPosts / weeksToSeed);
      
      for (let week = 1; week <= weeksToSeed; week++) {
        const weeklyContent = this.generateWeeklyContent(week, postsPerWeek);
        
        for (const post of weeklyContent) {
          await this.createAmbassadorPost(post);
          
          // Add a small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      console.log(`✅ Successfully seeded ${totalPosts} Ambassador posts`);
    } catch (error) {
      console.error('❌ Error seeding Ambassador posts:', error);
    }
  }

  private generateWeeklyContent(week: number, count: number): ConversationalPost[] {
    const personalities = this.contentEngine.getPersonalities();
    const postsPerPersonality = Math.floor(count / personalities.length);
    const weeklyPosts: ConversationalPost[] = [];
    
    personalities.forEach(personality => {
      for (let i = 0; i < postsPerPersonality; i++) {
        const contentTypes: ConversationalPost['content_type'][] = ['struggle', 'success', 'tip', 'question', 'encouragement'];
        const contentType = contentTypes[i % contentTypes.length];
        
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() - (8 - week) * 7 + i);
        
        const post: ConversationalPost = {
          id: `${personality.id}_week_${week}_${i + 1}`,
          ambassador_id: personality.id,
          content: this.generatePersonalityContent(personality, contentType),
          content_type: contentType,
          rotation_week: week,
          created_at: baseDate.toISOString(),
          engagement_seed: this.generateEngagementSeed(contentType)
        };
        
        weeklyPosts.push(post);
      }
    });
    
    return weeklyPosts;
  }

  private generatePersonalityContent(personality: any, contentType: ConversationalPost['content_type']): string {
    const templates = {
      struggle: {
        coach_mike: [
          "Had a student struggle with nerves today—reminded me of my own journey. We all start somewhere! 💪",
          "Double-faulted during a demo today 😅 Students got a good laugh. Keep it human, right?",
          "Tough practice session today. Sometimes the shots just don't fall. Tomorrow's a new day! 🎾"
        ],
        player_sarah: [
          "Ugh, just hit my 5th ball into the net today 😅 Anyone else struggle with consistency?",
          "My backhand decided to take a vacation mid-match today. Back to the drawing board! 🤦‍♀️",
          "One of those days where my racket felt like a tennis-ball magnet... for the net 🎾"
        ],
        coach_elena: [
          "Video analysis of my own game today—yikes! Even coaches have blind spots 😬",
          "Tried explaining court geometry to juniors. I think I confused myself more than them 📐",
          "Technical breakdown mid-lesson today. Humbling reminder that fundamentals matter! ⚡"
        ]
      },
      success: [
        "Finally nailed that cross-court backhand I've been working on! 🔥",
        "Best practice session in weeks—everything clicked today! ✨",
        "Breakthrough moment: stayed calm under pressure for the first time 🧘‍♂️"
      ],
      tip: [
        "Pro tip: breathe between points. Sounds simple but game-changer! 🫁",
        "Quick reminder: watch the ball hit your strings. Still working on this myself! 👀",
        "Tried a new foot-drill today—ankles felt so much looser. Game changer! 🦶"
      ],
      question: [
        "What's your go-to mental reset between games? Mine's three deep breaths 🫁",
        "Anyone else find rainy day practice sessions weirdly therapeutic? ☔",
        "Quick poll: morning or evening practice? I'm team sunrise! 🌅"
      ],
      encouragement: [
        "Remember: every pro started as a beginner. Keep grinding! 💪",
        "Bad day on court? Your brain's making room for tomorrow's breakthrough! 🧠",
        "Seeing all your progress posts—you're all crushing it! 🔥"
      ]
    };

    if (contentType === 'struggle' && templates.struggle[personality.id as keyof typeof templates.struggle]) {
      const personalityTemplates = templates.struggle[personality.id as keyof typeof templates.struggle];
      return personalityTemplates[Math.floor(Math.random() * personalityTemplates.length)];
    }
    
    const typeTemplates = templates[contentType];
    return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
  }

  private generateEngagementSeed(contentType: ConversationalPost['content_type']): ConversationalPost['engagement_seed'] {
    const baseEngagement = {
      struggle: { likes: 8, comments: 3, reactions: 12 },
      success: { likes: 15, comments: 5, reactions: 18 },
      tip: { likes: 12, comments: 4, reactions: 16 },
      question: { likes: 6, comments: 8, reactions: 14 },
      encouragement: { likes: 20, comments: 6, reactions: 22 }
    };

    const base = baseEngagement[contentType];
    return {
      likes: base.likes + Math.floor(Math.random() * 5) - 2,
      comments: base.comments + Math.floor(Math.random() * 3) - 1,
      reactions: base.reactions + Math.floor(Math.random() * 6) - 3
    };
  }

  private async createAmbassadorPost(post: ConversationalPost): Promise<void> {
    try {
      // First, ensure the Ambassador profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', post.ambassador_id)
        .single();

      if (!profile) {
        console.log(`Ambassador profile ${post.ambassador_id} not found, skipping post`);
        return;
      }

      // Create the post
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: profile.id,
          content: post.content,
          privacy_level: 'public',
          is_auto_generated: true,
          is_ambassador_content: true,
          engagement_score: post.engagement_seed.reactions,
          created_at: post.created_at
        });

      if (postError) {
        console.error('Error creating Ambassador post:', postError);
      }
    } catch (error) {
      console.error('Error in createAmbassadorPost:', error);
    }
  }

  async scheduleEncouragingReplies(): Promise<void> {
    try {
      // Get recent user posts (non-Ambassador)
      const { data: recentPosts } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          user_id,
          created_at,
          profiles:user_id (
            full_name,
            skill_level
          )
        `)
        .eq('is_ambassador_content', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (!recentPosts || recentPosts.length === 0) return;

      // Select 2-3 posts for Ambassador replies
      const postsToReplyTo = recentPosts.slice(0, 3);
      
      for (const post of postsToReplyTo) {
        const encouragingReply = this.contentEngine.generateEncouragingReply(
          post.content,
          (post.profiles as any)?.skill_level
        );
        
        // Replace placeholder with actual name
        const userName = (post.profiles as any)?.full_name?.split(' ')[0] || 'there';
        const finalReply = encouragingReply.replace('{name}', userName);
        
        // Schedule the reply (in a real implementation, this would use a job queue)
        setTimeout(async () => {
          await this.createAmbassadorComment(post.id, finalReply);
        }, Math.random() * 2 * 60 * 60 * 1000); // Random delay 0-2 hours
      }
    } catch (error) {
      console.error('Error scheduling encouraging replies:', error);
    }
  }

  private async createAmbassadorComment(postId: string, content: string): Promise<void> {
    try {
      // Get a random Ambassador profile
      const personalities = this.contentEngine.getPersonalities();
      const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
      
      const { data: ambassadorProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', randomPersonality.id)
        .single();

      if (!ambassadorProfile) return;

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: ambassadorProfile.id,
          content: content,
          is_ambassador_content: true
        });

      if (error) {
        console.error('Error creating Ambassador comment:', error);
      } else {
        console.log(`✅ Ambassador reply created: "${content.substring(0, 50)}..."`);
      }
    } catch (error) {
      console.error('Error in createAmbassadorComment:', error);
    }
  }

  async performWeeklyContentDrop(): Promise<void> {
    try {
      console.log('📅 Performing weekly Ambassador content drop...');
      
      // Retire old content (8+ weeks old)
      this.contentEngine.retireOldContent(8);
      
      // Generate new content for this week
      const newPosts = this.contentEngine.generateNewWeeklyDrop();
      
      // Create posts in database
      for (const post of newPosts) {
        await this.createAmbassadorPost(post);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`✅ Weekly content drop completed: ${newPosts.length} new posts`);
    } catch (error) {
      console.error('❌ Error in weekly content drop:', error);
    }
  }

  async getAmbassadorEngagementStats(): Promise<{
    totalPosts: number;
    avgReactions: number;
    recentActivity: number;
  }> {
    try {
      const { data: stats } = await supabase
        .rpc('get_ambassador_engagement_stats');
      
      return stats || { totalPosts: 0, avgReactions: 0, recentActivity: 0 };
    } catch (error) {
      console.error('Error getting Ambassador stats:', error);
      return { totalPosts: 0, avgReactions: 0, recentActivity: 0 };
    }
  }
}
