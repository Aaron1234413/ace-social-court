
import { Post } from '@/types/post';
import { useAuth } from '@/components/AuthProvider';

export class ReactionPermissionService {
  static canReactToPost(post: Post, currentUserId?: string): {
    canReact: boolean;
    reason?: string;
    isRestricted: boolean;
  } {
    // Ambassador posts and public content are always accessible
    if (post.is_ambassador_content || post.privacy_level === 'public' || post.privacy_level === 'public_highlights') {
      return { canReact: true, isRestricted: false };
    }

    // User must be logged in
    if (!currentUserId) {
      return { 
        canReact: false, 
        reason: "Sign in to react to posts",
        isRestricted: true
      };
    }

    // User's own posts
    if (post.user_id === currentUserId) {
      return { canReact: true, isRestricted: false };
    }

    // Private posts require following
    if (post.privacy_level === 'private') {
      // TODO: Check if user follows post author
      // For now, assuming they can't react to private posts
      return { 
        canReact: false, 
        reason: `Follow ${post.author?.full_name || 'this player'} first to react to their private posts`,
        isRestricted: true
      };
    }

    return { canReact: true, isRestricted: false };
  }

  static getReactionTooltip(post: Post, reactionType: string, canReact: boolean, reason?: string): string {
    if (canReact) {
      switch (reactionType) {
        case 'tip':
          return 'Share a coaching insight (comment required)';
        case 'heart':
          return 'Show love for this post';
        case 'fire':
          return 'This post is fire!';
        case 'trophy':
          return 'Celebrate this achievement';
        default:
          return 'React to this post';
      }
    }

    if (reason) {
      return `${reason}. But you can always share this post.`;
    }

    return 'React to this post';
  }
}
