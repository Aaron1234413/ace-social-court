
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import CreatePostForm from '@/components/social/CreatePostForm';
import PostList from '@/components/social/PostList';
import { usePosts } from '@/hooks/use-posts';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MessageSquare, Heart, Clock } from 'lucide-react';
import { initializeStorage } from '@/integrations/supabase/storage';
import { toast } from 'sonner';
import { Loading } from '@/components/ui/loading';

type SortOption = 'recent' | 'popular' | 'commented';

const Feed = () => {
  const { user, profile, isProfileComplete } = useAuth();
  const [personalized, setPersonalized] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [storageInitialized, setStorageInitialized] = useState(false);
  
  const { posts, isLoading, fetchPosts } = usePosts({ 
    personalize: personalized,
    sortBy: sortOption 
  });

  useEffect(() => {
    // Initialize storage only if the user is logged in
    const setupStorage = async () => {
      try {
        if (user) {
          console.log('Feed: Initializing storage...');
          const result = await initializeStorage();
          console.log('Feed: Storage initialization result:', result);
          setStorageInitialized(result);
          
          if (!result) {
            toast.error('Failed to initialize storage. Media uploads may be limited.', {
              description: "Storage initialization will be retried next time you log in."
            });
          } else {
            toast.success('Storage initialized successfully');
          }
        }
      } catch (err) {
        console.error('Failed to initialize storage:', err);
        setStorageInitialized(false);
        toast.error('Error initializing media storage');
      }
    };
    
    setupStorage();
  }, [user]);

  useEffect(() => {
    // Log the user's profile status for debugging
    if (user) {
      console.log('Feed: User profile status', { 
        profileExists: !!profile,
        isProfileComplete,
        userId: user.id
      });
    }
  }, [user, profile, isProfileComplete]);

  const togglePersonalization = () => {
    setPersonalized(!personalized);
  };

  const handleSortChange = (value: string) => {
    if (value) {
      setSortOption(value as SortOption);
    }
  };

  const handlePostUpdated = () => {
    console.log("Feed: Post updated, refreshing posts");
    fetchPosts();
  };

  return (
    <div className="max-w-4xl w-full mx-auto px-3 sm:px-4 py-6 md:py-8">
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
        <div className="mb-5 overflow-x-auto pb-1">
          <ToggleGroup 
            type="single" 
            value={sortOption}
            onValueChange={handleSortChange}
            className="justify-start whitespace-nowrap"
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
          
          {isLoading ? (
            <Loading variant="skeleton" count={3} text="Loading posts..." />
          ) : (
            <PostList 
              posts={posts}
              currentUserId={user.id}
              isLoading={false}
              onPostUpdated={handlePostUpdated}
            />
          )}
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
