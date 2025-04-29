
import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import CreatePostForm from '@/components/social/CreatePostForm';
import PostList from '@/components/social/PostList';
import { usePosts } from '@/hooks/use-posts';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Feed = () => {
  const { user } = useAuth();
  const [personalized, setPersonalized] = useState(true);
  const { posts, isLoading, fetchPosts } = usePosts({ personalize: personalized });

  const handleShare = (postId: string) => {
    console.log(`Shared post ${postId}`);
    toast.info("Share feature coming soon!");
  };

  const togglePersonalization = () => {
    setPersonalized(!personalized);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Home Feed</h1>
        
        {user && (
          <div className="flex items-center space-x-2">
            <Switch 
              id="personalized" 
              checked={personalized}
              onCheckedChange={togglePersonalization}
            />
            <Label htmlFor="personalized">Personalized</Label>
          </div>
        )}
      </div>
      
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
