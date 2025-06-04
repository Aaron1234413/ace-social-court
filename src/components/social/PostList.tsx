
import React from 'react';
import { Post } from '@/types/post';
import { Loading } from '@/components/ui/loading';
import { FeedBubble } from './FeedBubble';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface PostListProps {
  posts: Post[];
  currentUserId?: string;
  handleShare?: (postId: string) => void;
  isLoading: boolean;
  onPostUpdated?: () => void;
  error?: string | null;
}

const PostList = ({ posts, currentUserId, isLoading, onPostUpdated, error }: PostListProps) => {
  console.log('📋 PostList render:', { 
    postsCount: posts.length, 
    isLoading, 
    hasError: !!error,
    currentUserId: currentUserId?.substring(0, 8) + '...'
  });

  if (error) {
    console.error('📋 PostList: Displaying error state:', error);
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>Failed to load posts: {error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    console.log('📋 PostList: Showing loading state');
    return <Loading variant="skeleton" count={3} text="Loading posts..." />;
  }

  if (posts.length === 0) {
    console.log('📋 PostList: Showing empty state');
    return (
      <div className="bg-gradient-to-b from-muted/50 to-muted/30 rounded-lg p-8 text-center border border-muted shadow-inner">
        <div className="max-w-md mx-auto">
          <div className="bg-muted/50 p-4 rounded-full inline-block mb-3">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No feed items yet</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            Start connecting with other players or join a group to see content in your feed!
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-left">
              <h4 className="font-medium text-yellow-800 mb-1">Debug Info</h4>
              <p className="text-xs text-yellow-700">
                Check the console for detailed post loading logs to debug why no posts are showing.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  console.log('📋 PostList: Rendering', posts.length, 'posts');
  
  return (
    <div className="space-y-6 md:space-y-8">
      {posts.map((post, index) => (
        <FeedBubble
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          index={index}
          onPostUpdated={onPostUpdated}
        />
      ))}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && posts.length > 0 && (
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-1">Debug: Posts Loaded</h4>
          <p className="text-xs text-blue-700">
            Successfully loaded {posts.length} posts. Check console for detailed loading pipeline logs.
          </p>
        </div>
      )}
    </div>
  );
};

export default PostList;
