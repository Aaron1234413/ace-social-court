
import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import CreatePostForm from '@/components/social/CreatePostForm';
import PostList from '@/components/social/PostList';
import { usePosts } from '@/hooks/use-posts';

const Feed = () => {
  const { user } = useAuth();
  const { posts, isLoading, fetchPosts } = usePosts();

  const handleShare = (postId: string) => {
    console.log(`Shared post ${postId}`);
    toast.info("Share feature coming soon!");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Home Feed</h1>
      
      {user ? (
        <>
          <div className="mb-6">
            <CreatePostForm onPostCreated={fetchPosts} />
          </div>
          
          <PostList 
            posts={posts}
            currentUserId={user.id}
            handleShare={handleShare}
            isLoading={isLoading}
          />
        </>
      ) : (
        <div className="bg-gray-100 rounded-lg p-6 md:p-8 text-center">
          <p className="text-base md:text-lg mb-4">Please log in to view your personalized feed</p>
          <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
        </div>
      )}
    </div>
  );
};

export default Feed;
