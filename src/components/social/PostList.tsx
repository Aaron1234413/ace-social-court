
import React from 'react';
import { Post } from '@/types/post';
import { Loading } from '@/components/ui/loading';
import { FeedBubble, ContentType } from './FeedBubble';
import { MessageSquare } from 'lucide-react';

interface PostListProps {
  posts: Post[];
  currentUserId?: string;
  handleShare?: (postId: string) => void;
  isLoading: boolean;
  onPostUpdated?: () => void;
}

const PostList = ({ posts, currentUserId, isLoading, onPostUpdated }: PostListProps) => {
  if (isLoading) {
    return <Loading variant="skeleton" count={3} text="Loading posts..." />;
  }

  if (posts.length === 0) {
    return (
      <div className="bg-gradient-to-b from-muted/50 to-muted/30 rounded-lg p-8 text-center border border-muted shadow-inner">
        <div className="max-w-md mx-auto">
          <div className="bg-muted/50 p-4 rounded-full inline-block mb-3">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No feed items yet</h3>
          <p className="text-sm md:text-base text-muted-foreground">Start connecting with other players or join a group to see content in your feed!</p>
        </div>
      </div>
    );
  }

  const determineContentType = (post: Post): ContentType => {
    // Check if this is an ambassador post based on author information
    if (post.author?.user_type === 'ambassador' || post.is_ambassador_content) {
      return 'ambassador';
    }
    
    // Check if this is fallback content (could be expanded later)
    if (post.is_fallback_content) {
      return 'fallback';
    }
    
    return 'user';
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {posts.map((post, index) => {
        const contentType = determineContentType(post);
        
        return (
          <FeedBubble
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            contentType={contentType}
            onPostUpdated={onPostUpdated}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          />
        );
      })}
    </div>
  );
};

export default PostList;
