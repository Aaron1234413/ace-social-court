
import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import CreatePostForm from '@/components/social/CreatePostForm';
import PostList from '@/components/social/PostList';
import { usePosts } from '@/hooks/use-posts';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MessageSquare, Heart, Clock, TrendingUp } from 'lucide-react';

type SortOption = 'recent' | 'popular' | 'commented';

const Feed = () => {
  const { user } = useAuth();
  const [personalized, setPersonalized] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const { posts, isLoading, fetchPosts } = usePosts({ 
    personalize: personalized,
    sortBy: sortOption 
  });

  const handleShare = (postId: string) => {
    console.log(`Shared post ${postId}`);
    toast.info("Share feature coming soon!");
  };

  const togglePersonalization = () => {
    setPersonalized(!personalized);
  };

  const handleSortChange = (value: string) => {
    if (value) {
      setSortOption(value as SortOption);
    }
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
      
      {user && (
        <div className="mb-5">
          <ToggleGroup 
            type="single" 
            value={sortOption}
            onValueChange={handleSortChange}
            className="justify-start"
          >
            <ToggleGroupItem value="recent" aria-label="Sort by recent">
              <Clock className="h-4 w-4 mr-1" /> Recent
            </ToggleGroupItem>
            <ToggleGroupItem value="popular" aria-label="Sort by likes">
              <Heart className="h-4 w-4 mr-1" /> Popular
            </ToggleGroupItem>
            <ToggleGroupItem value="commented" aria-label="Sort by comments">
              <MessageSquare className="h-4 w-4 mr-1" /> Discussed
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      
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
