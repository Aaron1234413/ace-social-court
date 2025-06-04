
import React from 'react';
import { Post } from '@/types/post';
import { Loading } from '@/components/ui/loading';
import { FeedBubble, ContentType } from './FeedBubble';
import { MessageSquare } from 'lucide-react';
import { VirtualizedList } from '@/components/ui/virtualized-list';

interface PostListProps {
  posts: Post[];
  currentUserId?: string;
  handleShare?: (postId: string) => void;
  isLoading: boolean;
  onPostUpdated?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  virtualized?: boolean;
}

const PostList = ({ 
  posts, 
  currentUserId, 
  isLoading, 
  onPostUpdated,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  virtualized = false
}: PostListProps) => {
  if (isLoading && posts.length === 0) {
    return <Loading variant="skeleton" count={3} text="Loading posts..." />;
  }

  if (posts.length === 0) {
    return (
      <div className="bg-gradient-to-b from-muted/50 to-muted/30 rounded-lg p-6 text-center border border-muted shadow-inner">
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

  const renderPost = (post: Post, index: number) => {
    const contentType = determineContentType(post);
    
    return (
      <FeedBubble
        key={post.id}
        post={post}
        currentUserId={currentUserId}
        contentType={contentType}
        onPostUpdated={onPostUpdated}
        className="animate-slide-up"
        style={{ animationDelay: `${index * 50}ms` }}
      />
    );
  };

  if (virtualized && onLoadMore) {
    return (
      <VirtualizedList
        items={posts}
        renderItem={renderPost}
        itemHeight={200}
        containerHeight={600}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
        isLoading={isLoadingMore}
        threshold={3}
        className="space-y-2"
      />
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((post, index) => renderPost(post, index))}
      
      {isLoadingMore && (
        <div className="flex justify-center p-2">
          <Loading variant="skeleton" count={1} text="Loading more posts..." />
        </div>
      )}
    </div>
  );
};

export default PostList;
