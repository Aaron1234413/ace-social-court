
import { supabase } from '@/integrations/supabase/client';

export class AIEngagementService {
  private static instance: AIEngagementService;

  static getInstance(): AIEngagementService {
    if (!this.instance) {
      this.instance = new AIEngagementService();
    }
    return this.instance;
  }

  async initializeAIEngagementPatterns(): Promise<void> {
    console.log('🤖 Initializing AI engagement patterns...');
    
    // Start monitoring for new posts to like
    this.startPostLikingPattern();
    
    // Start monitoring for new users to follow back
    this.startFollowBackPattern();
  }

  private startPostLikingPattern(): void {
    // Set up realtime subscription for new posts
    const channel = supabase
      .channel('ai-post-engagement')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          await this.handleNewPost(payload.new);
        }
      )
      .subscribe();

    console.log('✅ AI post liking pattern active');
  }

  private startFollowBackPattern(): void {
    // Set up realtime subscription for new follows
    const channel = supabase
      .channel('ai-follow-engagement')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'followers'
        },
        async (payload) => {
          await this.handleNewFollow(payload.new);
        }
      )
      .subscribe();

    console.log('✅ AI follow back pattern active');
  }

  private async handleNewPost(post: any): Promise<void> {
    try {
      // Don't engage with AI user posts
      const { data: authorProfile } = await supabase
        .from('profiles')
        .select('is_ai_user')
        .eq('id', post.user_id)
        .single();

      if (authorProfile?.is_ai_user) return;

      // Get active AI users
      const { data: aiUsers } = await supabase
        .from('profiles')
        .select('id, ai_personality_type')
        .eq('is_ai_user', true)
        .eq('ai_response_active', true);

      if (!aiUsers || aiUsers.length === 0) return;

      // Randomly select AI users to like the post (30% chance per AI user)
      for (const aiUser of aiUsers) {
        const shouldLike = Math.random() < 0.3;
        if (shouldLike) {
          // Add random delay to simulate human behavior
          setTimeout(async () => {
            await this.aiLikePost(aiUser.id, post.id);
          }, Math.random() * 30000 + 5000); // 5-35 seconds delay
        }
      }
    } catch (error) {
      console.error('Error handling new post for AI engagement:', error);
    }
  }

  private async handleNewFollow(follow: any): Promise<void> {
    try {
      // Check if the person being followed is an AI user
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('is_ai_user, ai_personality_type, ai_response_active')
        .eq('id', follow.following_id)
        .single();

      if (!targetProfile?.is_ai_user || !targetProfile.ai_response_active) return;

      // Check if follower is also AI (avoid AI-to-AI follows)
      const { data: followerProfile } = await supabase
        .from('profiles')
        .select('is_ai_user')
        .eq('id', follow.follower_id)
        .single();

      if (followerProfile?.is_ai_user) return;

      // AI user follows back with 80% probability
      const shouldFollowBack = Math.random() < 0.8;
      if (shouldFollowBack) {
        // Add delay based on personality type
        const delay = this.getFollowBackDelay(targetProfile.ai_personality_type);
        
        setTimeout(async () => {
          await this.aiFollowBack(follow.following_id, follow.follower_id);
        }, delay);
      }
    } catch (error) {
      console.error('Error handling follow for AI engagement:', error);
    }
  }

  private async aiLikePost(aiUserId: string, postId: string): Promise<void> {
    try {
      // Check if AI user already liked this post
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', aiUserId)
        .eq('post_id', postId)
        .single();

      if (existingLike) return;

      // Like the post
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: aiUserId,
          post_id: postId
        });

      if (error) {
        console.error('Error AI liking post:', error);
      } else {
        console.log(`🤖 AI user ${aiUserId} liked post ${postId}`);
      }
    } catch (error) {
      console.error('Error in AI like post:', error);
    }
  }

  private async aiFollowBack(aiUserId: string, humanUserId: string): Promise<void> {
    try {
      // Check if AI user already follows this person
      const { data: existingFollow } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', aiUserId)
        .eq('following_id', humanUserId)
        .single();

      if (existingFollow) return;

      // Follow back
      const { error } = await supabase
        .from('followers')
        .insert({
          follower_id: aiUserId,
          following_id: humanUserId
        });

      if (error) {
        console.error('Error AI following back:', error);
      } else {
        console.log(`🤖 AI user ${aiUserId} followed back ${humanUserId}`);
      }
    } catch (error) {
      console.error('Error in AI follow back:', error);
    }
  }

  private getFollowBackDelay(personalityType: string | null): number {
    // Different personalities have different response times
    switch (personalityType) {
      case 'enthusiastic':
        return Math.random() * 2000 + 1000; // 1-3 seconds
      case 'mentor':
        return Math.random() * 5000 + 3000; // 3-8 seconds
      case 'competitive':
        return Math.random() * 3000 + 2000; // 2-5 seconds
      case 'supportive':
        return Math.random() * 4000 + 2000; // 2-6 seconds
      default:
        return Math.random() * 5000 + 2000; // 2-7 seconds
    }
  }

  async triggerRandomAIActivity(): Promise<void> {
    // This can be called periodically to create natural activity
    try {
      const { data: aiUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_ai_user', true)
        .eq('ai_response_active', true);

      if (!aiUsers || aiUsers.length === 0) return;

      // Get recent posts from human users that AI users follow
      for (const aiUser of aiUsers) {
        const { data: followingPosts } = await supabase
          .from('posts')
          .select('id, user_id')
          .in('user_id', [
            // This would need to be populated with users the AI follows
            // For now, we'll skip this complex query
          ])
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
          .limit(5);

        // Randomly like some of these posts
        if (followingPosts && followingPosts.length > 0) {
          const postToLike = followingPosts[Math.floor(Math.random() * followingPosts.length)];
          await this.aiLikePost(aiUser.id, postToLike.id);
        }
      }
    } catch (error) {
      console.error('Error in random AI activity:', error);
    }
  }
}

export const aiEngagementService = AIEngagementService.getInstance();
